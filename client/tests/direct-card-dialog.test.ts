import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkDirectCardDialogEnabled,
  isDirectCardDialogEnabled,
} from '../lib/direct-card-dialog';

test('checkDirectCardDialogEnabled returns true when env flag is "true" or "1"', () => {
  assert.equal(
    checkDirectCardDialogEnabled({ NEXT_PUBLIC_DIRECT_CARD_DIALOG: 'true' }),
    true,
  );
  assert.equal(
    checkDirectCardDialogEnabled({ NEXT_PUBLIC_DIRECT_CARD_DIALOG: '1' }),
    true,
  );
  assert.equal(
    checkDirectCardDialogEnabled({ DIRECT_CARD_DIALOG: 'true' }),
    true,
  );
  assert.equal(checkDirectCardDialogEnabled({ DIRECT_CARD_DIALOG: '1' }), true);
  assert.equal(
    checkDirectCardDialogEnabled({
      NEXT_PUBLIC_ENABLE_DIRECT_CARD_DIALOG: 'true',
    }),
    true,
  );
  assert.equal(
    checkDirectCardDialogEnabled({ ENABLE_DIRECT_CARD_DIALOG: 'true' }),
    true,
  );
});

test('checkDirectCardDialogEnabled returns false when env flag is missing, false, or other values', () => {
  assert.equal(checkDirectCardDialogEnabled({}), false);
  assert.equal(
    checkDirectCardDialogEnabled({ NEXT_PUBLIC_DIRECT_CARD_DIALOG: 'false' }),
    false,
  );
  assert.equal(
    checkDirectCardDialogEnabled({ NEXT_PUBLIC_DIRECT_CARD_DIALOG: '0' }),
    false,
  );
  assert.equal(
    checkDirectCardDialogEnabled({ NEXT_PUBLIC_DIRECT_CARD_DIALOG: 'random' }),
    false,
  );
});

test('isDirectCardDialogEnabled respects process.env changes', () => {
  const original = process.env.NEXT_PUBLIC_DIRECT_CARD_DIALOG;
  try {
    delete process.env.NEXT_PUBLIC_DIRECT_CARD_DIALOG;
    delete process.env.DIRECT_CARD_DIALOG;
    assert.equal(isDirectCardDialogEnabled(), false);

    process.env.NEXT_PUBLIC_DIRECT_CARD_DIALOG = 'true';
    assert.equal(isDirectCardDialogEnabled(), true);

    process.env.NEXT_PUBLIC_DIRECT_CARD_DIALOG = 'false';
    assert.equal(isDirectCardDialogEnabled(), false);
  } finally {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_DIRECT_CARD_DIALOG = original;
    } else {
      delete process.env.NEXT_PUBLIC_DIRECT_CARD_DIALOG;
    }
  }
});
