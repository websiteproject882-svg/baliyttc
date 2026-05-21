# Bali YTTC Production Roadmap

Current update (May 21, 2026): Phase 0 through major parts of Phase 5 are implemented in the Next.js codebase. The repo has also been reorganized into `docs/`, `design/`, `assets/source/`, `src/views/`, and `src/i18n/messages/`. Remaining roadmap work is mostly final credentials, live provider smoke tests, production VPS handoff, observability, backups, and manual QA.

## Locked Decisions

- Brand: Bali YTTC
- Final domain: `baliyttc.com`
- Current deployment: Vercel staging/testing
- Final deployment: Hetzner VPS
- VPS target: 4 vCPU / 8 GB RAM
- VPS stack: Docker Compose, Node.js 20, PostgreSQL 16, Redis 7
- Database handoff: fresh clean production DB
- Payments: PayPal, Razorpay, Bank Transfer
- Payment priority: PayPal first, Razorpay second, Bank Transfer third
- Stripe: not used
- Public pricing currency: EUR primary, USD secondary
- Razorpay charging: INR, with EUR estimate and INR conversion shown at checkout
- Audience: Europe plus Korea, Japan, China; mostly English-speaking
- Languages: EN, ES, DE, KO, ZH, JA, FR, RU
- Enrollment flow: apply -> payment -> automatic student portal access
- Student app: full production PWA required
- Admin model: client Super Admin, developer temporary Super Admin
- Maintenance: 3 months including bug fixes, small changes, server monitoring, email/payment support

## Phase 0: Foundation

- Status: mostly complete in the current Next.js app.
- Locale routing/messages exist under `src/i18n`.
- Middleware supports locale-prefixed protected areas.
- Dynamic sitemap/robots exist under `src/app`.
- Admin/settings foundations and environment examples are in place.

## Phase 1: Website Production Flow

- Move public course pages from static data to database-backed content.
- Add live batch widget with next batch, seats left, and countdown.
- Add day-by-day clickable syllabus using admin-managed schedule/module data.
- Make pricing database-driven.
- Implement EUR primary and USD display toggle.
- Show Razorpay INR conversion at checkout.
- Mount schema markup: Organization, Course, Article, Batch availability.
- Add cookie consent, privacy policy, and data deletion request flow.

## Phase 2: Enrollment And Payments

- Finalize course -> batch -> accommodation -> coupon -> payment flow.
- Add admin toggles for PayPal, Razorpay, Bank Transfer, deposit, and full payment.
- PayPal charges EUR/USD.
- Razorpay charges INR after conversion.
- Bank transfer remains manual fallback.
- Successful payment unlocks student access automatically.
- Failed payment sends retry email to student and alert to admin.
- Admin can manually mark payment as paid.

## Phase 3: Student PWA

- Deposit access: pre-arrival portal.
- Full payment access: full PWA.
- Alumni access: certificate and alumni feed.
- Student features: dashboard, videos, course manual PDFs, travel guide, packing checklist, schedule, progress, notes, announcements, notifications, reviews, testimonials, profile photo, certificate download.
- All sensitive auth remains in httpOnly cookies.

## Phase 4: Admin Panel

- Role permissions: Super Admin, Student Manager, Finance Manager, Course Manager, SEO/Blog Editor, Teacher.
- Manage courses, batches, prices, accommodation, coupons.
- Manage manuals, videos, resources, teacher photos/bios, logo/assets.
- Manage certificate template and certificate approvals.
- Manage Google/TripAdvisor review URLs.
- Manage gallery and testimonial approvals.
- Manage payment provider toggles and currency/conversion settings.
- Manage email campaigns and reminders.
- Keep audit logs.

## Phase 5: Email And Marketing

- Resend transactional emails: enrollment, payment success, failed payment retry, visa guide, pre-arrival reminder, review request, certificate issued.
- Brevo marketing: PDF lead magnet, newsletter, early bird announcements.
- Abandoned enrollment recovery.
- Review request automation.

## Phase 6: VPS Production

- Provision Hetzner VPS.
- Install Docker and Docker Compose.
- Deploy app, Postgres, Redis using `docker-compose.vps.yml`.
- Configure Cloudflare DNS and SSL.
- Run migrations against fresh production DB.
- Add client-owned env keys.
- Add backup cron.
- Add UptimeRobot and Sentry.
- Run final smoke test.

## Phase 7: Handover

- Client owns all final accounts.
- Client receives Super Admin login.
- Developer keeps temporary Super Admin during maintenance.
- Provide account list, deployment docs, env variable inventory, backup/recovery doc, and admin usage doc.
