# Secret Safety Audit

Date: 2026-05-23

## Result

No tracked real secrets were found in the repository during the current scan.

The scan checked for:

- Firebase Admin private key markers and service account fields
- GitHub token prefixes
- Google/Firebase API key patterns
- Razorpay key prefixes
- PostgreSQL URLs with inline credentials
- Gmail, PayPal, Razorpay, and Resend secret assignments

Matched items were expected placeholders or code/test references:

- Docker Compose `DATABASE_URL` uses `${POSTGRES_USER}` and `${POSTGRES_PASSWORD}` interpolation, not a committed credential.
- Tests use placeholder values like `secret`, `rzp_test_key`, and a dummy Firebase private key marker.
- Runtime code checks for private key formatting but does not contain key material.

## Ignore Coverage Added

The repo now ignores common secret-bearing local files:

- `.env.*`, except `.env.example` and `.env.production.example`
- `serviceAccountKey.json`
- `firebase-service-account*.json`
- `firebase-adminsdk*.json`
- `*service-account*.json`
- `*.pem`, `*.key`, `*.p12`

The same key/service-account patterns are also excluded from Docker and Vercel uploads.

## Operational Rule

Any Firebase Admin JSON, SMTP app password, Railway/Postgres URL, Razorpay/PayPal secret, Vercel token, or Cloudflare token that was shared in chat or screenshots must be rotated before client handoff.

