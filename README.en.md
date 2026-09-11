# Tối Nay Lọ Gì? 🎰

[Tiếng Việt](README.md) · **English**

A local case-opening app that selects a JAV actress. Its local Next.js server crawls the first three pages of JAV.Guru's monthly-view ranking, best-effort enriches profiles from AvBase, and refreshes the pool no more than weekly.

## Run locally

Node.js 22.12+ and the pnpm version in `package.json` are required.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [127.0.0.1:3000](http://127.0.0.1:3000). The first crawl runs in the background; the browser waits for a local snapshot and never fetches JAV.Guru itself. Use `pnpm data:refresh` to force a refresh or debug it. A new snapshot is published only after every list, movie, profile and declared image validates, so a failed refresh preserves the current cache.

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

The server binds to loopback only. During enrichment, it uses `impit` with a Chrome TLS fingerprint only for AvBase requests; an AvBase error, 403, or 429 never prevents a new JAV.Guru snapshot from publishing. Once a snapshot exists, the browser loads local JSON/images only; JAV.Guru, AvBase, Wikipedia, X, Instagram, and TikTok links open solely after a user click.

## Local data

- Snapshot v4 and crawler images are in gitignored `public/actress-cache/`; existing v3 snapshots remain readable during refresh.
- JAV.Guru determines ranking/tier. AvBase is a best-effort supplement for Japanese name/reading, birthday, measurements, cup, blood type, hometown, hobbies, social links, Wikipedia, and DMM images copied into the local cache.
- Staging and locks are in gitignored `.cache/jav-crawler/`.
- Tier filters, actress exclusions, language and local spin count are bounded, versioned host-only cookies. The counter belongs to this browser, never a community total.

## GitHub Pages, contributing and history

GitHub Pages redirects only to https://truanayangi.com/; only `pages-redirect/` is published to `gh-pages`, while this local app stays on `main`. Issues and fork PRs to `main` are welcome in Vietnamese or English, including drafts.

This repository preserves history from `nagisanzenin/truanayangi`. See [ATTRIBUTION.md](ATTRIBUTION.md) for asset credits.
