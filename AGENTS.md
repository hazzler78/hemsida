# AGENTS.md

## Cursor Cloud specific instructions

Elchef.se is a single **Next.js 15 (App Router) + React 19** web app (Swedish electricity-contract comparison site). It is not a monorepo. Package manager is **npm** (`package-lock.json`). Standard commands live in `package.json`; the relevant ones:

- Dev server: `npm run dev` (serves on http://localhost:3000)
- Lint: `npm run lint`
- Build: `npm run build`
- Cloudflare Pages build/preview/deploy: `npm run cf:build` / `cf:preview` / `cf:deploy` (production only; not needed for local dev)

### Non-obvious notes

- **No env vars are required to run the dev server or test the core feature.** The homepage loads and the core price-comparison flow works with zero configuration: `/api/prices` fetches live data from an external public feed (Stockholms Elbolag), and the comparison UI renders providers from that feed. The dev server starts even with no `.env` file present.
- **No `.env` / `.env.example` is committed** (`.gitignore` excludes `.env*`). Optional integrations are configured purely through env vars documented in `README.md` and the per-feature `*_SETUP.md` guides at the repo root. They degrade gracefully when unset:
  - Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_*`) backs analytics/events, contacts, reminders, invoice OCR, providers, knowledge base, chat logs. Routes that need it return errors when it is absent, but the core comparison flow does not require it.
  - AI/optional: `XAI_API_KEY` (Grok chat/vision), `OPENAI_API_KEY` (invoice OCR), `MAILERLITE_*` (newsletter), `TELEGRAM_*` (notifications), `OTOVO_*` (solar leads), `TIKTOK_*` (tracking), `UPDATE_SECRET_KEY` (cron endpoints), `ADMIN_DASHBOARD_PASSWORD` (admin).
- **Cloudflare D1** (`DB` binding in `wrangler.toml`) only exists under the Cloudflare runtime (`npm run cf:preview`), NOT under plain `next dev`. Code that reads `process.env.DB` falls back/ no-ops in plain dev.
- **Cheap Energy automation** uses Playwright + Chromium and only runs under the Node runtime. To test it, run `npx playwright install chromium` first (browser binaries are not installed by `npm install`). Playwright is deliberately excluded from the webpack/Edge bundle (see `next.config.ts`), so it will not work on Cloudflare Pages / Edge.
- The root `test-*.js` files are mostly empty 1-byte stubs; there is no formal automated test suite. Manual/feature testing guidance lives in `TESTING_GUIDE.md`, `QUICK_START_TESTING.md`, and the various `*_SETUP.md` docs.
- `npm run lint` passes with only `no-img-element` warnings (non-blocking).
