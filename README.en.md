# Tối Nay Lọ Gì? 🎰

[Tiếng Việt](README.md) · **English**

A local case-opening app that selects a XXX actress. Its local Next.js server crawls the first three pages of XXX.Guru's monthly-view ranking, best-effort enriches profiles from AvBase, and refreshes the pool no more than weekly.

<video src="assets/promo.mp4" controls="controls" muted="muted" width="100%"></video>

## Run locally

Node.js 22.12+ and the pnpm version in `package.json` are required.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
redis-server
pnpm dev
```

Open [127.0.0.1:3000](http://127.0.0.1:3000). The first crawl runs in the background; the browser waits for a local snapshot and never fetches XXX.Guru itself. Use `pnpm data:refresh` to force a refresh or debug it. A new snapshot is published only after every list, movie, profile and declared image validates, so a failed refresh preserves the current cache.

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

The server binds to loopback only. During enrichment, it uses `impit` with a Chrome TLS fingerprint only for AvBase requests; an AvBase error, 403, or 429 never prevents a new XXX.Guru snapshot from publishing. Once a snapshot exists, the browser loads local JSON/images only; XXX.Guru, AvBase, Wikipedia, X, Instagram, and TikTok links open solely after a user click.

## Local data

- Snapshot v4 and crawler images are in gitignored `public/actress-cache/`; existing v3 snapshots remain readable during refresh.
- XXX.Guru determines ranking/tier. AvBase is a best-effort supplement for Japanese name/reading, birthday, measurements, cup, blood type, hometown, hobbies, social links, Wikipedia, and DMM images copied into the local cache.
- Staging and locks are in gitignored `.cache/jav-crawler/`.
- Tier filters, actress exclusions, language, latest choice, and the local spin count use bounded, versioned host-only cookies. The local count belongs only to this browser.
- `SERVER-WIDE OPENS` is the number of completed case openings shared by clients of the same local Next.js server. It is stored in Redis under `toinaylogi:opens`; the connection string is server-only `REDIS_URL` in `.env` (the `.env.example` default is local `redis://localhost:6379`). It is not a hosted/community deployment metric.
- If Redis is down, cases and the local count still work. The server counter shows unavailable and retries when the page reloads or another case completes.

## GitHub Pages, contributing and history

GitHub Pages redirects only to https://truanayangi.com/; only `pages-redirect/` is published to `gh-pages`, while this local app stays on `main`. Issues and fork PRs to `main` are welcome in Vietnamese or English, including drafts.

Inspired by [nagisanzenin/truanayangi](https://github.com/nagisanzenin/truanayangi). This repository preserves history from `nagisanzenin/truanayangi`. See [ATTRIBUTION.md](ATTRIBUTION.md) for asset credits.
