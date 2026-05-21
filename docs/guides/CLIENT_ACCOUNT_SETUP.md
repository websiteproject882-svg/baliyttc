# Bali YTTC Client Account Setup

Use this checklist when moving from the current staging setup to client-owned accounts.

## Current Phase

- Vercel is staging/testing only.
- The `.com` domain should stay unpointed until the final VPS is ready.
- Payments can stay disabled or bank-transfer-only during testing.
- Test data can be reset before production handover.

## Client-Owned Accounts To Create

1. Google account / Google Workspace
   - Owns Firebase, GA4, Search Console, Google Business links.

2. Firebase
   - Plan: Spark during testing.
   - Enable Authentication providers: Email/Password and Google.
   - Create a Web app and copy client env values.
   - Create a service account key and add admin env values.
   - Do not use Phone Auth unless the client accepts billing risk.

3. Vercel
   - Use as staging only while the final app is still in development.
   - Hobby can be used for staging/testing.
   - Final commercial production should move to VPS as planned.

4. Database
   - Testing: Railway/Neon/Supabase Postgres is acceptable.
   - Final VPS: use the `postgres` service from root `docker-compose.vps.yml`, or use managed Postgres if the client prefers lower maintenance.
   - Do not use laptop Postgres for production.

5. Email
   - Resend: transactional emails.
   - Brevo: newsletters and marketing campaigns.
   - Verify the client domain before real sending.

6. Payments
   - Final stack: PayPal + Razorpay + Bank Transfer.
   - Stripe is intentionally not used.
   - Checkout priority: PayPal first, Razorpay second, Bank Transfer third.
   - Public pricing: EUR primary, USD secondary.
   - Razorpay: charge in INR and show the EUR/INR conversion before opening checkout.
   - Add live keys only in production env.
   - Env names:
     - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_ENV`, `PAYPAL_WEBHOOK_ID`
     - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET`
   - Admin settings page controls provider visibility. A provider becomes usable only when both admin toggle and env keys are ready.

7. Cloudflare
   - Move DNS to Cloudflare Free when the domain is ready.
   - Point `baliyttc.com` and `www.baliyttc.com` to the VPS.
   - Use Cloudflare proxy/WAF after SSL is verified.

8. Monitoring
   - UptimeRobot: monitor `https://baliyttc.com/api/health`.
   - Sentry: add when final production env is ready.

## Production Hosting Decision

- Current Vercel deployment is staging/testing only.
- Final production hosting will be a Hetzner VPS.
- Target VPS: 4 vCPU / 8 GB RAM.
- Final VPS stack: Docker Compose, app container, PostgreSQL 16, Redis 7.
- Final production database should be fresh and clean; do not migrate testing/fake records unless explicitly selected.

## Handover Rule

The client should be owner of every final account. The developer should only be invited as admin/developer, never be the only owner.
