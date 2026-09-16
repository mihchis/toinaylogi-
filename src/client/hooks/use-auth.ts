'use client';

import { useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

const LOCAL_PROFILE_KEY = 'toinaylogi_local_profile';

export type LocalUser = {
  id: string;
  email: string;
  user_metadata: {
    display_name: string;
    avatar_url?: string;
  };
};

export function useAuth() {
  const [user, setUser] = useState<User | LocalUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.warn('Failed to fetch profile:', err);
    }
  }, []);

  const loadLocalUser = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as LocalUser;
    } catch {
      return null;
    }
  }, []);

  const signInLocal = useCallback((displayName: string) => {
    const local: LocalUser = {
      id: `local-user-${Date.now()}`,
      email: `${displayName.toLowerCase().replace(/\s+/g, '')}@local.app`,
      user_metadata: {
        display_name: displayName.trim() || 'Người chơi',
      },
    };
    try {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(local));
      setUser(local);
      setProfile({
        id: local.id,
        email: local.email,
        display_name: local.user_metadata.display_name,
        avatar_url: null,
        total_spins: 0,
        created_at: new Date().toISOString(),
      });
    } catch {}
    return local;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    try {
      localStorage.removeItem(LOCAL_PROFILE_KEY);
    } catch {}
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      const local = loadLocalUser();
      if (local) {
        setUser(local);
        setProfile({
          id: local.id,
          email: local.email,
          display_name: local.user_metadata.display_name,
          avatar_url: null,
          total_spins: 0,
          created_at: new Date().toISOString(),
        });
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        void fetchProfile(session.user.id);
      } else {
        const local = loadLocalUser();
        if (local) {
          setUser(local);
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        void fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, loadLocalUser]);

  return {
    user: user as User | null,
    profile,
    loading,
    isConfigured,
    signInLocal,
    signOut,
    refreshProfile: user ? () => fetchProfile(user.id) : () => null,
  };
}
