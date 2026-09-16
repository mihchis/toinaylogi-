export function checkDirectCardDialogEnabled(
  env: Record<string, string | undefined>,
): boolean {
  const value =
    env.NEXT_PUBLIC_DIRECT_CARD_DIALOG ??
    env.DIRECT_CARD_DIALOG ??
    env.NEXT_PUBLIC_ENABLE_DIRECT_CARD_DIALOG ??
    env.ENABLE_DIRECT_CARD_DIALOG ??
    env.NEXT_PUBLIC_ENABLE_CARD_DIALOG ??
    env.ENABLE_CARD_DIALOG;

  return value === 'true' || value === '1';
}

export function isDirectCardDialogEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_DIRECT_CARD_DIALOG === 'true' ||
    process.env.NEXT_PUBLIC_DIRECT_CARD_DIALOG === '1' ||
    process.env.DIRECT_CARD_DIALOG === 'true' ||
    process.env.DIRECT_CARD_DIALOG === '1' ||
    process.env.NEXT_PUBLIC_ENABLE_DIRECT_CARD_DIALOG === 'true' ||
    process.env.NEXT_PUBLIC_ENABLE_DIRECT_CARD_DIALOG === '1' ||
    process.env.ENABLE_DIRECT_CARD_DIALOG === 'true' ||
    process.env.ENABLE_DIRECT_CARD_DIALOG === '1' ||
    process.env.NEXT_PUBLIC_ENABLE_CARD_DIALOG === 'true' ||
    process.env.NEXT_PUBLIC_ENABLE_CARD_DIALOG === '1'
  );
}
