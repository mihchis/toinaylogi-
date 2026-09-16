import { useCallback, useEffect, useRef, useState } from 'react';
import { parseOpenCountResponse } from '@/lib/open-count';

export type ServerSpinCountStatus = 'loading' | 'ready' | 'unavailable';

type ServerSpinCount = {
  count: number | null;
  status: ServerSpinCountStatus;
  increment: () => Promise<void>;
};

async function requestCount(method: 'GET' | 'POST') {
  const response = await fetch('/api/open-count', {
    method,
    cache: 'no-store',
  });
  if (!response.ok)
    throw new Error(`Open counter unavailable: ${response.status}`);
  const count = parseOpenCountResponse(await response.json());
  if (count === null) throw new Error('Invalid open counter response');
  return count;
}

export function useServerSpinCount(): ServerSpinCount {
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<ServerSpinCountStatus>('loading');
  const requestId = useRef(0);
  const mounted = useRef(true);

  const update = useCallback(async (method: 'GET' | 'POST') => {
    const id = ++requestId.current;
    try {
      const next = await requestCount(method);
      if (!mounted.current || id !== requestId.current) return;
      setCount(next);
      setStatus('ready');
    } catch {
      if (!mounted.current || id !== requestId.current) return;
      setCount(null);
      setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void update('GET');
    return () => {
      mounted.current = false;
    };
  }, [update]);

  const increment = useCallback(async () => {
    await update('POST');
  }, [update]);

  return { count, status, increment };
}
