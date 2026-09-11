import { useEffect, useState } from 'react';
import {
  emptyProfile,
  validateProfile,
  type ActressProfile,
} from '@/lib/actress-preferences';
import { readCookie, writeCookie, clearCookie } from '@/lib/cookies';
function load() {
  try {
    return validateProfile(readCookie('actress-pool'));
  } catch {
    return emptyProfile();
  }
}
export function usePreferences() {
  const [profile, setProfile] = useState<ActressProfile>(emptyProfile),
    [error, setError] = useState('');
  useEffect(() => setProfile(load()), []);
  const save = (next: ActressProfile) => {
    try {
      const checked = validateProfile(next);
      writeCookie('actress-pool', checked);
      setProfile(checked);
      setError('');
      return true;
    } catch (error) {
      setError((error as Error).message);
      return false;
    }
  };
  const reload = () => {
    const next = load();
    setProfile(next);
    setError('');
    return next;
  };
  const remove = () => {
    try {
      clearCookie('actress-pool');
      setProfile(emptyProfile());
      setError('');
      return true;
    } catch (error) {
      setError((error as Error).message);
      return false;
    }
  };
  return { profile, error, setError, save, reload, remove };
}
export type Preferences = ReturnType<typeof usePreferences>;
