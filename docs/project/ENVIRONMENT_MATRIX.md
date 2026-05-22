# Environment Matrix

Date: 2026-05-23

This is the client handoff reference for local development, Vercel/Railway staging, and future VPS production. Keep real values in `.env.local`, Vercel environment variables, Railway variables, or VPS `.env.production`; never commit secrets.

## Required Everywhere

| Variable | Local | Vercel/Railway staging | VPS production | Notes |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | `https://baliyttc.vercel.app` or custom staging domain | `https://baliyttc.com` | Must match the public URL used in emails, sitemap, robots, and callbacks. |
| `SESSION_SECRET` | random 32+ chars | random 32+ chars | random 32+ chars | Generate with `openssl rand -base64 32`. Rotate if shared. |
| `CRON_SECRET` | optional | random 16+ chars if cron is used | random 16+ chars | Required for `/api/cron/communications`. |

## Database

| Variable | Local | Vercel/Railway staging | VPS production | Notes |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Railway public URL or local Postgres | Railway public URL, for example `*.proxy.rlwy.net` | Built by `docker-compose.vps.yml` or set directly | Do not use `*.railway.internal` from Vercel/local; it only works inside Railway services. |
| `POSTGRES_USER` | not needed unless Docker | not needed | required in `.env.production` | Used by VPS Docker Compose Postgres. |
| `POSTGRES_PASSWORD` | not needed unless Docker | not needed | required in `.env.production` | Use a long random password. |
| `POSTGRES_DB` | not needed unless Docker | not needed | required in `.env.production` | Default example: `baliyttc`. |
| `REDIS_URL` | optional | optional | `redis://redis:6379` in compose | Redis service exists for VPS readiness, but current app code does not require it. |

## Firebase

| Variable | Required For | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client Firebase auth | Public client config from Firebase project settings. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client Firebase auth | Usually `<project-id>.firebaseapp.com`. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client Firebase auth | Must match client-owned Firebase project. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client Firebase app | Keep aligned with Firebase app config. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client Firebase app | Public client config. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client Firebase app | Public client config. |
| `FIREBASE_PROJECT_ID` | Server auth/admin checks | Required in production by runtime validation. |
| `FIREBASE_CLIENT_EMAIL` | Server auth/admin checks | From Firebase Admin service account JSON. |
| `FIREBASE_PRIVATE_KEY` | Server auth/admin checks | Store as a single env value with `\n` escaped newlines. Rotate if pasted in chat/screenshots. |

## Login And Test Access

| Variable | Recommendation |
| --- | --- |
| `ENABLE_TEST_LOGIN` | `true` only while testing; `false` before final production handoff. |
| `TEST_ADMIN_PASSWORD` | Local/staging only. Do not use for final production. |
| `TEST_STUDENT_PASSWORD` | Local/staging only. Do not use for final production. |
| `TEST_TEACHER_PASSWORD` | Local/staging only. Do not use for final production. |

## Email

| Variable | Required For | Notes |
| --- | --- | --- |
| `GMAIL_EMAIL` | Gmail SMTP transactional email | Current staging/testing provider. Use client Gmail/Workspace and an app password. |
| `GMAIL_APP_PASSWORD` | Gmail SMTP transactional email | 16-character app password, not normal Gmail password. |
| `ADMIN_EMAIL` | Admin notifications | Defaults to site email when absent. Set to admissions/admin inbox. |
| `RESEND_API_KEY` | Optional future email provider | Leave empty unless client verifies a sending domain. |
| `BREVO_API_KEY` | Optional future email provider | Currently only documented as an alternative. |

## Payments

| Variable | Provider | Notes |
| --- | --- | --- |
| `RAZORPAY_KEY_ID` | Razorpay | Server key ID. Leave empty until client account is ready. |
| `RAZORPAY_KEY_SECRET` | Razorpay | Server secret. Never expose publicly. |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay | Required for webhook signature verification. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay checkout | Public key ID for frontend checkout. |
| `PAYPAL_CLIENT_ID` | PayPal | Server client ID. |
| `PAYPAL_CLIENT_SECRET` | PayPal | Server secret. |
| `PAYPAL_WEBHOOK_ID` | PayPal | Required for webhook verification. |
| `PAYPAL_ENV` | PayPal | `sandbox` for testing, `live` for production. |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal buttons | Public client ID for frontend buttons. |
| `BANK_TRANSFER_ACCOUNT_NAME` | Bank transfer fallback | Visible in payment instructions. |
| `BANK_TRANSFER_BANK_NAME` | Bank transfer fallback | Visible in payment instructions. |
| `BANK_TRANSFER_ACCOUNT_NUMBER` | Bank transfer fallback | Visible in payment instructions. |
| `BANK_TRANSFER_SWIFT` | Bank transfer fallback | Optional, visible when set. |
| `BANK_TRANSFER_IBAN` | Bank transfer fallback | Optional, visible when set. |

Payment rule: if Razorpay/PayPal keys are empty, the app should hide or disable those methods and keep bank transfer available if details are configured.

## WhatsApp

| Variable | Required For | Notes |
| --- | --- | --- |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Cloud API sends | Optional. Not needed for simple floating WhatsApp link. |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Cloud API sends | Optional. Required only for API-driven messages. |

## CI And Vercel

- GitHub Actions `ci.yml` runs lint, typecheck, tests, and build using non-secret demo env values.
- Vercel production deploys through the Git integration on push to `main`.
- `.github/workflows/vercel.yml` is manual-only. Use it only after setting `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` repo secrets.
- Do not duplicate production deploy paths unless there is a clear reason; Git integration is the current source of truth.

## Secret Safety Checklist

Before final handoff:

1. Rotate any Firebase Admin private key, SMTP app password, database URL, or payment secret shared in chat/screenshots.
2. Ensure `.env`, `.env.local`, and `.env.production` are not committed.
3. Confirm Vercel has the public Railway Postgres URL, not the Railway internal hostname.
4. Confirm client owns GitHub, Vercel, Firebase, database, Gmail/Workspace, Cloudflare, Razorpay, and PayPal accounts.
5. Disable test login unless the client explicitly wants a staging-only test account.

