# Tests

## Unit — `npm run test` (Vitest)

Pure logic, no network or DB. Runs in ~1s.

- `permissions` — the RBAC map (OWNER/MODERATOR/VIEWER)
- `schemas` — every Zod schema, valid + invalid cases
- `security` — slug/token/ip hashing, Argon2id hash+verify, admin-email matching
- `rate-limit` — window, per-identifier isolation, `peek` doesn't consume
- `utils` — `cn`, `formatDuration`, `absoluteUrl`
- `settings-service` — defaults, cache TTL, cache-bust on write (Prisma mocked)

## End-to-end — `npm run test:e2e` (Playwright, Chromium)

Drives the real app against a dev server on `:3000` (started automatically,
or reused if already running). **Needs the same `.env` as dev** — a reachable
`DATABASE_URL`, LiveKit creds, and `ADMIN_EMAILS` containing the demo admin
(`anderson.demo@screenroom.app`). Creates throwaway accounts/rooms in the
configured database.

- `auth` — homepage, register→auto-login→logout, wrong password, weak-password
  validation, protected dashboard, log back in
- `admin` — non-admin gets 404 on `/admin` and no create-room CTA; admin sees
  the panel + broadcast toggle
- `room` — admin creates a public room → shows in the panel → ends it; a fresh
  viewer auto-joins, chat propagates host↔viewer, viewer has no share button;
  unknown slug is 404

Each test runs with its own `X-Forwarded-For` so the per-IP login/join throttle
doesn't bleed across tests (`fixtures.ts`).

Not covered here (verified manually — LiveKit media is flaky to assert in CI):
the actual WebRTC video frames reaching a subscriber.
