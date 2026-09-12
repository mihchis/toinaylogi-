import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseOpenCountResponse,
  parseStoredOpenCount,
  MAX_OPEN_COUNT,
} from '../src/lib/open-count';
import {
  incrementOpenCountFrom,
  OPEN_COUNTER_KEY,
  readOpenCountFrom,
  type OpenCounterStore,
} from '../src/server/open-counter';

test('validates Redis values and API payloads as safe non-negative integers', () => {
  assert.equal(parseStoredOpenCount(null), 0);
  assert.equal(parseStoredOpenCount('42'), 42);
  assert.equal(parseStoredOpenCount('01'), 1);
  assert.equal(parseStoredOpenCount('-1'), null);
  assert.equal(parseStoredOpenCount('1.5'), null);
  assert.equal(parseStoredOpenCount(String(MAX_OPEN_COUNT + 1)), null);

  assert.equal(parseOpenCountResponse({ count: 3 }), 3);
  assert.equal(parseOpenCountResponse({ count: '3' }), null);
  assert.equal(parseOpenCountResponse({ count: -1 }), null);
  assert.equal(parseOpenCountResponse(null), null);
});

test('reads a missing Redis counter as zero without writing it', async () => {
  const calls: string[] = [];
  const store: OpenCounterStore = {
    async get(key) {
      calls.push(`get:${key}`);
      return null;
    },
    async incr() {
      throw new Error('must not increment while reading');
    },
  };

  assert.equal(await readOpenCountFrom(store), 0);
  assert.deepEqual(calls, [`get:${OPEN_COUNTER_KEY}`]);
});

test('delegates completed-spin counts to Redis atomic INCR', async () => {
  const calls: string[] = [];
  const store: OpenCounterStore = {
    async get() {
      return null;
    },
    async incr(key) {
      calls.push(`incr:${key}`);
      return 17;
    },
  };

  assert.equal(await incrementOpenCountFrom(store), 17);
  assert.deepEqual(calls, [`incr:${OPEN_COUNTER_KEY}`]);
});

test('rejects malformed values and unavailable Redis adapters', async () => {
  const invalid: OpenCounterStore = {
    async get() {
      return 'not-a-number';
    },
    async incr() {
      return MAX_OPEN_COUNT + 1;
    },
  };
  const unavailable: OpenCounterStore = {
    async get() {
      throw new Error('Redis unavailable');
    },
    async incr() {
      throw new Error('Redis unavailable');
    },
  };

  await assert.rejects(readOpenCountFrom(invalid));
  await assert.rejects(incrementOpenCountFrom(invalid));
  await assert.rejects(readOpenCountFrom(unavailable));
  await assert.rejects(incrementOpenCountFrom(unavailable));
});
