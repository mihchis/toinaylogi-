import { createClient } from 'redis';
import { parseStoredOpenCount, isOpenCount } from '@/lib/open-count';

export const OPEN_COUNTER_KEY = 'toinaylogi:opens';

export interface OpenCounterStore {
  get(key: string): Promise<string | null>;
  incr(key: string): Promise<number>;
}

type RedisClient = OpenCounterStore & {
  isOpen: boolean;
  isReady: boolean;
  connect(): Promise<unknown>;
  destroy(): void;
  on(event: 'error', listener: (error: Error) => void): unknown;
};

let client: RedisClient | undefined;
let connecting: Promise<RedisClient> | undefined;

function discardClient(candidate: RedisClient) {
  if (client !== candidate) return;
  client = undefined;
  if (candidate.isOpen) candidate.destroy();
}

async function redisClient(): Promise<RedisClient> {
  if (client?.isReady) return client;
  if (connecting) return connecting;

  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not configured');

  if (client) discardClient(client);
  const next = createClient({
    url,
    socket: {
      connectTimeout: 750,
      reconnectStrategy: false,
    },
  }) as RedisClient;
  next.on('error', () => {});
  client = next;
  const connection = next
    .connect()
    .then(() => next)
    .catch((error: unknown) => {
      discardClient(next);
      throw error;
    })
    .finally(() => {
      if (connecting === connection) connecting = undefined;
    });
  connecting = connection;
  return connection;
}

async function withStore<T>(
  operation: (store: OpenCounterStore) => Promise<T>,
) {
  const current = await redisClient();
  try {
    return await operation(current);
  } catch (error) {
    discardClient(current);
    throw error;
  }
}

export async function readOpenCountFrom(store: OpenCounterStore) {
  const count = parseStoredOpenCount(await store.get(OPEN_COUNTER_KEY));
  if (count === null) throw new Error('Invalid Redis open counter');
  return count;
}

export async function incrementOpenCountFrom(store: OpenCounterStore) {
  const count = await store.incr(OPEN_COUNTER_KEY);
  if (!isOpenCount(count)) throw new Error('Invalid Redis open counter');
  return count;
}

export function readOpenCount() {
  return withStore(readOpenCountFrom);
}

export function incrementOpenCount() {
  return withStore(incrementOpenCountFrom);
}
