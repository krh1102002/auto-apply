# Job Apply — Auto-apply stack

Monorepo:

| Folder    | Stack                          |
|-----------|--------------------------------|
| `client/` | Vite + React (dashboard)      |
| `server/` | Express + MongoDB + BullMQ + Puppeteer |

## Quick start (local)

```bash
# API
cd server && cp .env.example .env
# Edit .env — MONGODB_URI, REDIS_URL, JWT_SECRET, etc.

npm install
npm start
```

```bash
# Client
cd client && npm install
npm run dev
```

## Production

- **API:** [Render](https://render.com) — Web Service, root `server`, `npm start`. See [`render.yaml`](render.yaml).
- **Frontend:** e.g. Vercel — `client/`, set `VITE_API_URL` to your Render URL.
- **Hourly jobs (free):** GitHub Actions → [`/.github/workflows/hourly-cron.yml`](.github/workflows/hourly-cron.yml) → `POST /api/cron/hourly` with `CRON_SECRET`.

Full steps: **[`docs/RENDER_CHECKLIST.md`](docs/RENDER_CHECKLIST.md)**.

## Scripts (server)

| Script | Purpose |
|--------|---------|
| `npm start` | HTTP API |
| `npm run jobs:discover` | Greenhouse/Lever discovery |
| `npm run jobs:apply:filtered` | Dashboard-driven filtered apply |
| `npm run jobs:hourly-cycle-once` | Full hourly pipeline once (CLI) |
| `npm run jobs:cron-hourly` | Local daemon + hourly schedule |

## License

Private / your project.
