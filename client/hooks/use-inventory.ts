'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { InventoryItem, ItemType } from '@/lib/supabase/types';

function getUserStorageKey(userId: string) {
  return `toinaylogi_user_inventory_${userId}`;
}

function loadUserLocalInventory(userId: string): InventoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getUserStorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUserLocalInventory(userId: string, items: InventoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getUserStorageKey(userId), JSON.stringify(items));
  } catch {}
}

export function useInventory(user: User | null) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Dọn dẹp key cũ không gắn với user nếu có
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('toinaylogi_user_inventory');
      } catch {}
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    // CHƯA ĐĂNG NHẬP -> Không nạp túi đồ
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setItems(loadUserLocalInventory(user.id));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('last_obtained_at', { ascending: false });

      if (!error && data) {
        setItems(data as InventoryItem[]);
      } else {
        // Fallback to user-scoped local storage
        setItems(loadUserLocalInventory(user.id));
      }
    } catch (err) {
      console.warn('Failed to fetch user inventory from Supabase:', err);
      setItems(loadUserLocalInventory(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchInventory();
  }, [fetchInventory]);

  const addItem = useCallback(
    async (
      payload: {
        id: string;
        name: string;
        subname?: string | null;
        tier: 0 | 1 | 2 | 3 | 4;
        imageUrl: string;
        metadata?: Record<string, unknown>;
      },
      type: ItemType,
    ) => {
      // CHƯA ĐĂNG NHẬP -> Không lưu vào túi đồ
      if (!user) {
        return;
      }

      const now = new Date().toISOString();
      const supabase = getSupabaseBrowserClient();

      if (supabase) {
        try {
          const { data: existing } = await supabase
            .from('user_inventory')
            .select('*')
            .eq('user_id', user.id)
            .eq('item_type', type)
            .eq('item_id', payload.id)
            .maybeSingle();

          if (existing) {
            const updatedQuantity = (existing.quantity || 1) + 1;
            await supabase
              .from('user_inventory')
              .update({
                quantity: updatedQuantity,
                last_obtained_at: now,
              })
              .eq('id', existing.id);
          } else {
            await supabase.from('user_inventory').insert({
              user_id: user.id,
              item_type: type,
              item_id: payload.id,
              item_name: payload.name,
              item_subname: payload.subname || null,
              tier: payload.tier,
              image_url: payload.imageUrl,
              metadata: payload.metadata || {},
              quantity: 1,
              first_obtained_at: now,
              last_obtained_at: now,
            });
          }

          void fetchInventory();
          return;
        } catch (err) {
          console.warn('Failed to write to Supabase inventory, writing to user local storage:', err);
        }
      }

      // User-scoped Local storage fallback
      const current = loadUserLocalInventory(user.id);
      const existingIdx = current.findIndex(
        (i) => i.item_type === type && i.item_id === payload.id,
      );

      let next: InventoryItem[];
      if (existingIdx >= 0) {
        next = [...current];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: (next[existingIdx].quantity || 1) + 1,
          last_obtained_at: now,
        };
      } else {
        const newItem: InventoryItem = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          item_type: type,
          item_id: payload.id,
          item_name: payload.name,
          item_subname: payload.subname || null,
          tier: payload.tier,
          image_url: payload.imageUrl,
          metadata: payload.metadata || {},
          quantity: 1,
          first_obtained_at: now,
          last_obtained_at: now,
        };
        next = [newItem, ...current];
      }

      saveUserLocalInventory(user.id, next);
      setItems(next);
    },
    [user, fetchInventory],
  );

  const actressItems = items.filter((i) => i.item_type === 'actress');
  const movieItems = items.filter((i) => i.item_type === 'movie');
  const totalSpins = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return {
    items,
    loading,
    addItem,
    refreshInventory: fetchInventory,
    stats: {
      totalSpins,
      uniqueCount: items.length,
      actressCount: actressItems.length,
      movieCount: movieItems.length,
    },
  };
}
