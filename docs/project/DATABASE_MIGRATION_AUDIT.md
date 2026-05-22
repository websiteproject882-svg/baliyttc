# Database Migration Audit

Date: 2026-05-23

## Result

The Prisma schema and migration state are currently healthy.

Commands run:

```bash
npx prisma validate
npx prisma migrate status
```

Result:

- Prisma schema is valid.
- 14 migrations are present in `prisma/migrations`.
- The configured PostgreSQL database schema is up to date.

## Current Migration Set

- `20260511182511_init`
- `20260512052055_add_leads_tasks`
- `20260512071511_add_payment_plans`
- `20260512071836_add_waitlist`
- `20260512170000_replace_stripe_with_razorpay_paypal`
- `20260513105000_add_staff_totp_fields`
- `20260513184500_add_student_personal_notes`
- `20260513235000_add_prearrival_resources`
- `20260514000500_add_testimonials`
- `20260514013000_add_communication_logs`
- `20260514030000_add_notifications`
- `20260515130000_student_pwa_interactions`
- `20260515165000_add_site_settings`
- `20260516093000_localized_admin_content`

## Workflow Rules

Local development:

```bash
npm run db:migrate
npm run db:seed
```

Production or VPS:

```bash
npm run db:migrate:deploy
```

Seed production only when intentionally resetting or initializing a fresh client database. The current seed creates test/admin/demo data and should not be run blindly against a live production database after real enrollments exist.

## CI Coverage

CI now runs:

```bash
npm run db:validate
```

This validates `prisma/schema.prisma` without needing database credentials. `prisma migrate status` is intentionally not run in CI because it requires a live database connection and should be checked against the target environment during deploy/handoff.

## Railway And VPS Notes

- Vercel/local machines must use the Railway public PostgreSQL URL, not `*.railway.internal`.
- VPS Docker Compose builds `DATABASE_URL` from `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`.
- Before moving from Railway to VPS, take a Railway Postgres backup and restore it into the VPS Postgres volume before running `npm run db:migrate:deploy`.

