# Render + Redis setup (step by step)

## 1. Redis Cloud: set eviction policy to **no eviction** (BullMQ)

BullMQ expects Redis **not** to delete keys when memory is tight. The default **`volatile-lru`** can evict job data and causes warnings like *“Eviction policy is volatile-lru. It should be noeviction”*.

### Redis Cloud (official Redis)

1. Sign in at [Redis Cloud / Redis Enterprise Cloud](https://redis.io/cloud/) (or your Redis Cloud console URL).
2. Open your **Subscription** → select the **database** your app uses (the one in `REDIS_URL`).
3. Open **Configuration** for that database (sometimes under **Edit** or the database name → **Edit database**).
4. Find **Data eviction policy** (or **Eviction policy** / **Maxmemory policy**).
5. Change it from **`volatile-lru`** (or anything else) to **`no eviction`**  
   (this is Redis’s `noeviction`: writes fail if the DB is full instead of silently deleting keys).
6. **Save** / **Update** the database.  
   - *Note:* Redis Cloud may take a minute to apply changes.

**If you don’t see the option:** use the UI’s search/help for “data eviction” — Redis documents it [here](https://redis.io/docs/latest/operate/rc/databases/configuration/data-eviction-policies/).

**Other providers (Upstash, Railway Redis, etc.):** look for **maxmemory-policy**, **eviction policy**, or **noeviction** in the instance settings and set it the same way.

**If you hit OOM after switching:** your plan may be too small for queue traffic — upgrade DB size or reduce queue retention; `noeviction` only changes *how* Redis behaves at the limit, not the limit itself.

### Small Redis (e.g. **30MB**)

This project is tuned to use **little Redis memory**:

- **Job payloads** only store `applicationId`, `userId`, and small `jobDetails` — the worker loads the user from **MongoDB** when processing (not stored in Redis).
- **BullMQ** is configured with **`removeOnComplete: true`** (completed jobs removed immediately) and **only the last ~20 failed** jobs kept (`removeOnFail: { count: 20 }`).
- **Worker concurrency** is **1** so fewer jobs are active at once.

If Redis still fills up, **upgrade the plan** or occasionally clear old BullMQ keys in a dev/staging instance (not usually needed with the settings above).

---

## 2. Render: Web service = **`npm start`** (API only)

1. **Render Dashboard** → your **Web Service** (e.g. `job-apply-api`).
2. **Settings**:
   - **Root Directory:** `server` (if your repo has `client/` + `server/`).
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`  
     (must **not** be `npm run jobs:cron-hourly` or `jobs:hourly-cycle-once`).
3. **Environment** tab: set `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `AUTO_USER_EMAIL`, etc. (same values you use locally, without committing `.env`).

Redeploy after changes. You should see logs like **Server listening on http://0.0.0.0:PORT** and Render should report the service **live**.

---

## 3. Hourly jobs **without** Render Cron (free)

Render’s **managed Cron** service is **paid**. Free options:

### Option A — **GitHub Actions** (recommended, $0)

1. Deploy the API with env **`CRON_SECRET`** = a long random string (same as any strong password).
2. In the repo, enable **`.github/workflows/hourly-cron.yml`** (already in this project).
3. **GitHub** → **Settings** → **Secrets and variables** → **Actions** → add:
   - **`CRON_SECRET`** — same value as on Render
   - **`RENDER_CRON_URL`** — `https://YOUR-SERVICE.onrender.com/api/cron/hourly`
4. Push to your default branch. The workflow runs **every hour (UTC)** and `POST`s to your API with the secret.

The API responds with **202** immediately and runs the pipeline in the **background** (same scripts as `npm run jobs:hourly-cycle-once`).

#### After you add `CRON_SECRET` + `RENDER_CRON_URL` (next steps)

1. **Redeploy Render** once so the running app picks up `CRON_SECRET`: **Dashboard** → your Web Service → **Manual Deploy** → **Clear build cache & deploy** (or normal deploy).
2. **Push** the latest code to GitHub (including `.github/workflows/hourly-cron.yml` and `server/routes/cronRoutes.js`) if you haven’t already — the workflow file must be on your **default branch** (`main` / `master`).
3. **Test manually (GitHub):** **Actions** tab → **Hourly job pipeline** → **Run workflow** → **Run workflow**. Open the run → confirm the step is green.
4. **Check Render logs:** after a successful run you should see `[HTTP Cron] Hourly cycle started` / pipeline lines (`[Cron] Starting Discover Jobs...`). First request after sleep can take ~30–60s (cold start).
5. **Optional — test from your PC** (replace URL and secret):

   `curl -i -X POST "https://YOUR-SERVICE.onrender.com/api/cron/hourly" -H "Authorization: Bearer YOUR_CRON_SECRET" -H "Content-Type: application/json" -d "{}"`

   Expect **`HTTP/1.1 202`** and body `{"ok":true,...}`.

### Option B — **cron-job.org** (or similar free HTTP cron)

1. Create a job that **POST**s to `https://YOUR-SERVICE.onrender.com/api/cron/hourly`.
2. Add header **`Authorization: Bearer YOUR_CRON_SECRET`** (or **`x-cron-secret: YOUR_CRON_SECRET`**).

### Option C — Render Cron / Worker (**paid** on Render)

Only if you want to pay for Render’s Cron or a Background Worker — see Render docs. This repo’s `render.yaml` deploys **web only** to stay free-tier friendly.

### Do **not** use as Web start command

Do **not** set **`npm run jobs:cron-hourly`** or **`jobs:hourly-cycle-once`** as the Web Service start command (no HTTP port).

---

## 4. Deploy “latest server” (Mongo fix + queue + cron)

1. **Push** your latest code to the branch Render deploys (e.g. `main`).
2. In Render, open the **Web Service** → **Manual Deploy** → **Deploy latest commit** (or wait for auto-deploy).
3. **Hourly jobs** use **GitHub Actions** (or another HTTP cron), **not** a second Render service — see [§3](#3-hourly-jobs-without-render-cron-free).
4. Confirm in **Logs**:
   - API: no “no open ports” when using `npm start`.
   - Filtered apply: no `Sort exceeded memory limit` from `applyFromSettings.js` (uses aggregate + `allowDiskUse` and indexed fallback — see `server/applyFromSettings.js`).
5. **`GET /api/health`** on production should include `"cron": { "httpTriggerConfigured": true }` after you set `CRON_SECRET` on Render.

---

## Quick reference

| Service        | Type on Render   | Start / command |
|----------------|------------------|-----------------|
| HTTP API       | **Web Service**  | `npm start`     |
| Hourly pipeline| **GitHub Actions** / **HTTP cron** | `POST /api/cron/hourly` + `CRON_SECRET` |
| (Paid)         | **Render Cron**  | `npm run jobs:hourly-cycle-once` |

| Redis setting  | Value for BullMQ |
|----------------|------------------|
| Eviction policy| **No eviction** (`noeviction`) |
