export const MAX_OPEN_COUNT = Number.MAX_SAFE_INTEGER;

export function isOpenCount(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= MAX_OPEN_COUNT
  );
}

export function parseStoredOpenCount(value: unknown): number | null {
  if (value === null) return 0;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const count = Number(value);
  return isOpenCount(count) ? count : null;
}

export function parseOpenCountResponse(value: unknown): number | null {
  if (!value || typeof value !== 'object') return null;
  return isOpenCount((value as Record<string, unknown>).count)
    ? (value as { count: number }).count
    : null;
}
