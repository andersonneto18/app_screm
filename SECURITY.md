# Security posture

## Authentication & sessions
- Auth.js (NextAuth v5), JWT session strategy, 30-day expiry.
- Cookies: `HttpOnly`, `SameSite=Lax`, `Secure` + `__Secure-`/`__Host-`
  prefixes in production (handled by Auth.js).
- Passwords hashed with **Argon2id** (`@node-rs/argon2`, 19 MiB / t=2 / p=1).
  Plaintext is never stored or logged.
- CSRF: Auth.js double-submit token on all auth mutations; other mutations are
  same-origin `fetch` with `SameSite=Lax` cookies + `form-action 'self'`.

## Brute force
`src/lib/auth/brute-force.ts`, enforced inside the credentials `authorize`:
- per-IP throttle: 10 / min
- per-email throttle: 5 / min
- per-email lockout: 10 failed attempts → 15 min block
Throttled/locked logins return the generic "invalid credentials" result — the
state is not disclosed to the caller. Failures for non-existent emails are also
counted (no account enumeration).

## Authorization (RBAC)
- Central model in `src/lib/permissions` — `requireRoomPermission(role, perm)`.
  No ad-hoc role checks in routes.
- Every room route goes through `loadRoomContext(slug, permission?)` which
  loads the caller's active membership and enforces the permission in one step.
- `participant-service` adds target-aware rules: nobody may act on the OWNER;
  a MODERATOR may only act on VIEWERs; no self-targeting.
- LiveKit: room name, participant identity, role and publish rights are all
  **assigned by the backend**. Viewers get a subscribe-only token
  (`canPublish=false`, empty `canPublishSources`). Tokens are short-lived
  (20 min) and refreshed client-side before expiry.

## Input validation
- Zod on every route body (`src/schemas`). Frontend input is never trusted.
- Chat content is stored raw and rendered as text (React-escaped) — never as
  HTML. 1000-char cap.
- Room slugs / invite tokens are validated by regex before any lookup.

## Secrets & identifiers
- Room slugs: 12 chars from a 56-symbol alphabet (~70 bits), `nanoid`. Never
  sequential DB ids in URLs.
- Invite tokens: 32 random bytes; only `SHA-256(token)` is persisted.
- Room passwords: Argon2id, rate-limited (5 / min per room+IP).
- IPs are hashed (`SHA-256(ip + AUTH_SECRET)`) before storage for bans.

## Rate limiting
`src/lib/rate-limit` — fixed window. In-memory by default; set `REDIS_URL` to
use the shared Redis store for multi-instance deploys. Limits (per
`documentatio.md`): create room 10/h, join 30/min, room password 5/min,
invite 20/h, chat 20/10s, LiveKit token 30/min, register 5/min.

## HTTP headers (`next.config.ts`)
- `Content-Security-Policy`: `default-src 'self'`; connect limited to
  `*.livekit.cloud` (+ an explicit self-hosted URL when configured);
  `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'`. `upgrade-insecure-requests` in production.
  Known limitation: `script-src`/`style-src` still allow `'unsafe-inline'`
  (Next/Turbopack inject inline bootstrap); a nonce policy needs request-time
  rewriting and is tracked for a later pass. `'unsafe-eval'` is dev-only.
- `Strict-Transport-Security` (prod), `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy:
  same-origin`, `Permissions-Policy` (camera off, mic/display-capture self).
- `X-Powered-By` removed.

## Privacy
- No recording. No video/audio/screenshots are stored. The room UI states this.
- Non-members viewing the join gate do not receive the participant list or the
  owner's name.
- Structured logging (`pino`) redacts `password`, `token`, `authorization`,
  `cookie`, etc.

## Media
- Media never transits the Next.js server — WebRTC/LiveKit SFU only.
- No DRM/HDCP circumvention; the app is for legitimate desktop/app sharing.

## Trust assumptions
- `x-forwarded-for` is trusted for the client IP — deploy only behind a proxy
  that sets it (Vercel, a hardened nginx, etc.).
- LiveKit `LIVEKIT_API_SECRET` and `AUTH_SECRET` must be strong and never
  exposed to the client (`.env` is git-ignored; only `NEXT_PUBLIC_*` reach the
  browser).

## Reporting
Open a private security advisory on the repository.
