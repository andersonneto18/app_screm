# Deploying to Vercel

The app is a standard Next.js project. Postgres runs on **Neon**, media on
**LiveKit Cloud** — both stay where they are; only the web app goes to Vercel.

## 1. Import the repo

Vercel → **Add New… → Project** → import `andersonneto18/app_screm`.
Framework preset is detected as **Next.js**. Leave the build settings default —
`vercel.json` pins the framework and the `fra1` region, and the `vercel-build`
script runs `prisma migrate deploy && prisma generate && next build`.

## 2. Environment variables

Add these under **Settings → Environment Variables** (Production + Preview):

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Neon **pooled** URL | `...-pooler...` host, `?sslmode=verify-full` |
| `DIRECT_URL` | Neon **direct** URL | non-pooler host — used by `migrate deploy` |
| `AUTH_SECRET` | *(generate a fresh one)* | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` | your real domain; used for invite links + metadata |
| `LIVEKIT_URL` | `wss://app-screem-ygi5becv.livekit.cloud` | |
| `NEXT_PUBLIC_LIVEKIT_URL` | same as `LIVEKIT_URL` | **must be set before the first build** — it is inlined into the client bundle and the CSP |
| `LIVEKIT_API_KEY` | LiveKit Cloud key | |
| `LIVEKIT_API_SECRET` | LiveKit Cloud secret | server-only, never `NEXT_PUBLIC_*` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | *(optional)* | leave unset to disable Google login |
| `REDIS_URL` | *(optional but recommended)* | e.g. Upstash — see step 5 |

A freshly generated `AUTH_SECRET` you can use:

```
KDLwG2MAlXBbMbgRHv5nc04702sWUwffr0IQQx0t6XU=
```

> Changing `AUTH_SECRET` later invalidates every existing session (everyone is
> logged out once). Pick it now and keep it.

## 3. Deploy

Push to `main` (or click **Deploy**). The build will:
1. `npm install` → `postinstall` runs `prisma generate`
2. `vercel-build` → `prisma migrate deploy` applies the 2 migrations to Neon,
   then `next build`

If the build fails on `migrate deploy`, it is almost always `DIRECT_URL`
missing or pointing at the pooler host.

## 4. After the first deploy

- Open `https://<app>/api/health` — expect `{"status":"healthy"}` with
  `database` and `livekit` both `ok`.
- Register an account, create a room, open the invite link in a second
  browser, share your screen. On restrictive networks LiveKit falls back to
  TURN/TLS on `*.livekit.cloud` (already allowed by the CSP).
- If you add a custom domain, update `NEXT_PUBLIC_APP_URL` and redeploy.

## 5. Rate limiting in production (recommended)

Vercel functions are serverless — the in-memory rate limiter is **per
instance**, so limits are softer than intended. Add a Redis:

1. Vercel → **Storage → Upstash Redis** (or any Redis), copy its connection URL.
2. Set `REDIS_URL` and redeploy. `src/instrumentation.ts` switches the limiter
   to the shared Redis store automatically.

## 6. LiveKit Cloud allowed origins (optional hardening)

In the LiveKit Cloud project settings you can restrict which origins may
request connections — add `https://<your-app>.vercel.app`.

## Self-hosting instead

`docker-compose.yml` + `docker/livekit.yaml` run LiveKit + Redis locally. Point
`LIVEKIT_URL` at `ws://localhost:7880` with the `devkey`/`devsecret` pair and
run `docker compose up -d`.

## 7. Room cover uploads (optional)

Create a **Public** Blob store: Vercel → **Storage → Create Database → Blob**,
region `fra1`, Access **Public**, connect it to the project (Production +
Preview) with the read-write token. `BLOB_READ_WRITE_TOKEN` is injected
automatically. Redeploy once so the running deployment picks it up. Until
then (and if you skip this), covers are still settable by pasting an image
URL in the room editor.
