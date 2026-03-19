# Auth Verification — Magic Code System

**Status: IMPLEMENTED & VERIFIED** ✅

## Components

### Routes
- `POST /api/local-auth/request-code` — generates 6-digit code, sends via Mailgun, stores in DB
- `POST /api/local-auth/verify-code` — validates code, creates session, sets httpOnly cookie
- `POST /api/local-auth/logout` — soft-deletes session, clears cookie
- `GET /api/local-auth/me` — returns current user from session

### UI
- `/account/signin` — 2-step form: email → 6-digit code

### Database Tables
- `auth_users` — admin users (no passwords)
- `auth_sessions` — 7-day sessions with soft-delete (`deleted_at`)
- `auth_verification_codes` — 15-min expiry codes, single-use

## Security Properties
- No passwords: pure magic code / passwordless flow
- 6-digit codes: cryptographically random (`crypto.getRandomValues`)
- Sessions: 64 hex chars from `crypto.randomBytes(32)`, httpOnly cookie
- Session invalidation: soft-delete (`deleted_at`) preserves audit trail
- Rate limiting: 5 auth attempts / 60s per IP
- User enumeration protection: always returns `{ code_sent: true }` regardless of user existence
- Code reuse prevention: marks codes as used immediately on verify
- CSRF: `SameSite=Lax` cookie policy

## Environment Variables Required
- `MAILGUN_API_KEY` — required for email delivery
- `MAILGUN_DOMAIN` — defaults to `ashbi.ca`
- `DATABASE_URL` — PostgreSQL connection string
- **Do NOT set `AUTH_SECRET`** — keeps NextAuth disabled (see AUTH-ARCHITECTURE.md)
