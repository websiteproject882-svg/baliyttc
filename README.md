# Bali YTTC

Production-ready website and portal for Bali YTTC, including public course pages, multilingual routing, enrollments, bank transfer checkout, student portal, staff/admin panels, communications, and operational settings.

## Stack

- Next.js 14 App Router
- React 18 + TypeScript
- Tailwind CSS + Radix UI components
- Prisma + PostgreSQL
- Firebase Auth / Firebase Admin
- Gmail SMTP or Resend for transactional email
- Razorpay, PayPal, and Bank Transfer payment modules
- Vercel for staging, Docker Compose for VPS production

## Current Deployment

- GitHub: `websiteproject882-svg/baliyttc`
- Vercel project: `vivek07-s-projects/baliyttc`
- Staging/temporary production URL: `https://baliyttc-vivek07-s-projects.vercel.app`
- Health check: `/api/health`

The final client production target is a VPS with `docker-compose.vps.yml`. Vercel can continue as staging/testing.

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

For local database work:

```bash
npm run db:migrate
npm run db:seed
```

For a hosted database such as Railway, use the public PostgreSQL URL in `DATABASE_URL` when running locally or on Vercel. The internal Railway hostname only works between Railway services.

## Required Environment

Minimum runtime variables:

```env
DATABASE_URL=
NEXT_PUBLIC_BASE_URL=
SESSION_SECRET=
```

Production auth variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Email can use Gmail SMTP now. Public `/en/apply`, contact forms, enrollment confirmations, and admin lead notifications use this provider when configured:

```env
GMAIL_EMAIL=
GMAIL_APP_PASSWORD=
ADMIN_EMAIL=
```

Or Resend later:

```env
RESEND_API_KEY=
EMAIL_FROM="Bali YTTC <noreply@baliyttc.com>"
```

Firebase Admin is required for real student, staff, and admin Firebase token verification. Public marketing pages still deploy without it, but login APIs will return a clear service-unavailable response until these are set correctly:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

For Vercel, paste the private key with escaped newlines (`\n`) exactly as shown. Do not set `ALLOW_PRODUCTION_TEST_LOGIN=true` for client production.

Payment providers are optional until client accounts are ready:

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_ENV=sandbox
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
```

Temporary test login is env-gated:

```env
ENABLE_TEST_LOGIN=false
TEST_ADMIN_PASSWORD=
TEST_STUDENT_PASSWORD=
TEST_TEACHER_PASSWORD=
```

Disable test login before final client handoff unless it is explicitly needed for staging.

## Useful Commands

```bash
npm run qa:full
npm run typecheck
npm run lint
npm test
npm run build
npm run smoke:prod
npm run db:migrate:deploy
npm run db:seed
```

`qa:full` is the strongest local check: typecheck, lint, unit tests, Prisma schema validation, production build, and live production smoke. To smoke-test a specific deployment, run:

```bash
SMOKE_BASE_URL=https://your-deployment.vercel.app npm run smoke:prod
```

CI runs lint, typecheck, tests, and build on `main`/`develop` pushes and pull requests. Manual Vercel deployments also smoke-test the deployed URL before the workflow finishes. A scheduled production smoke workflow checks the live site daily. The CI build uses non-secret demo env values only; real runtime secrets must be set in Vercel, Railway, or the VPS `.env.production`.

## Admin And Operations

- Admin settings control payment provider visibility and display order.
- Checkout only enables a provider when both admin toggle and env keys are ready.
- Bank Transfer is the default safe fallback while PayPal/Razorpay client accounts are pending.
- `/api/admin/provider-smoke` can test email and WhatsApp provider connectivity from the admin panel.
- `/api/health` reports database, env, and provider readiness.

## VPS Deployment

1. Copy `.env.production.example` to `.env.production` on the VPS.
2. Fill client-owned secrets.
3. Generate production build/runtime secrets:

```bash
openssl rand -base64 32
openssl rand -base64 48
```

Use these for `SESSION_SECRET` and `CRON_SECRET`.

4. Start services:

```bash
docker compose -f docker-compose.vps.yml up -d --build
docker compose -f docker-compose.vps.yml exec app npm run db:migrate:deploy
```

The compose file provides:

- Next.js app container
- PostgreSQL 16
- Redis 7

Use Cloudflare DNS/proxy once the VPS SSL and health check are verified.

For Vercel/Railway staging, use Railway's public PostgreSQL URL in `DATABASE_URL` (`*.proxy.rlwy.net`). Railway's internal hostname (`*.railway.internal`) only works from Railway services and will fail from Vercel/local machines.

## Handoff Notes

- Client should own GitHub, Vercel, Firebase, database, Cloudflare, Gmail/Workspace, Razorpay, PayPal, and any future email provider accounts.
- Developer accounts should be collaborators only.
- Rotate any secrets that were shared in chat/screenshots before final production.
- Keep `.env`, `.env.local`, and `.env.production` out of git.
