/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['impit'],
  env: {
    DIRECT_CARD_DIALOG:
      process.env.DIRECT_CARD_DIALOG ??
      process.env.NEXT_PUBLIC_DIRECT_CARD_DIALOG ??
      process.env.ENABLE_DIRECT_CARD_DIALOG ??
      process.env.NEXT_PUBLIC_ENABLE_DIRECT_CARD_DIALOG ??
      '',
  },
};

export default nextConfig;
