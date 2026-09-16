'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { InventoryItem, ItemType } from '@/lib/supabase/types';

const LOCAL_STORAGE_KEY = 'toinaylogi_user_inventory';

function loadLocalInventory(): InventoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalInventory(items: InventoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useInventory(user: User | null) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    if (!user) {
      setItems(loadLocalInventory());
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setItems(loadLocalInventory());
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
        // Fallback to local
        setItems(loadLocalInventory());
      }
    } catch (err) {
      console.warn('Failed to fetch user inventory from Supabase:', err);
      setItems(loadLocalInventory());
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
      const now = new Date().toISOString();
      const supabase = getSupabaseBrowserClient();

      if (user && supabase) {
        try {
          // Check if item exists in inventory for this user
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
          console.warn('Failed to write to Supabase inventory, writing to local:', err);
        }
      }

      // Local storage fallback
      const current = loadLocalInventory();
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

      saveLocalInventory(next);
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
