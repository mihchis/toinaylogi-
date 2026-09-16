# Toinaylogi - Frontend

- Independent local web application for actress crate opening and discovery.
- Current code is a standalone local frontend. No external authentication, OAuth/login, cloud credentials, or infrastructure state.
- Build and run locally. Compatible with Node.js and modern package managers (pnpm / npm).
- Store user preferences in bounded, versioned, host-only cookies.
- Server-wide open counter uses an optional local Redis instance (`toinaylogi:opens` key via `REDIS_URL`).
- All assets and profile snapshots are loaded locally; external links open only when explicitly clicked by the user.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
