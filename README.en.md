# Who Tonight? (Tối Nay Lọ Gì?) 🎰

[Tiếng Việt](README.md) · **English**

A CS:GO crate-opening inspired web application to randomly select a XXX actress based on rarity tiers. Data is crawled and locally cached, enriched with profiles, measurements, photos, ratings, and social links from Minnano-AV and AvBase.

## Features
- 🎰 **CS:GO Crate Mechanics**: Smooth reel animation with authentic Valve crate opening sound effects.
- ⭐ **Rarity Tiers**: Mil-Spec, Restricted, Classified, Covert, and ★ Special Item.
- 🔍 **Interactive Profile Cards**: Click on any card in the inventory or reel to view high-res photos, bust/waist/hip measurements, cup size, star ratings, and top films.
- 🎛️ **Pool Customization**: Enable/disable specific tiers or exclude actresses directly in the customization panel.
- 🔒 **Local & Private**: Snapshot data and preferences are saved locally on your device.

## Getting Started

Requires Node.js 22.12+ and `npm` or `pnpm`.

```sh
# 1. Install dependencies
npm install

# 2. Setup environment configuration
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Useful Commands:
```sh
npm test          # Run test suite
npm run typecheck # TypeScript type checking
npm run lint      # Code linting
npm run build     # Production build
npm run start     # Run production build
```

## Attribution & Licenses
See [ATTRIBUTION.md](ATTRIBUTION.md) for details.
