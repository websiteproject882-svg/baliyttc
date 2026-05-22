# Bali YTTC 100-Phase Execution Plan

This is the operating plan for taking the project from current working state to client-ready production. Each phase must end with a measurable result, tests where applicable, and a deploy/rollback note when code changes are shipped.

## Foundation And Safety

1. Baseline audit: record current git state, deployment URLs, env status, and failing/passing checks.
2. Repository hygiene: classify dirty files into keep, discard, generated, and review buckets without reverting user work.
3. CI gate audit: verify lint, typecheck, test, build, Prisma generate, and migration deploy jobs.
4. Environment matrix: document required local, Vercel, Railway/VPS, Firebase, SMTP, and payment variables.
5. Secret safety: ensure no private keys, service account JSON, SMTP passwords, or DB URLs are committed.
6. Error logging baseline: standardize API error responses and request IDs for production debugging.
7. Health endpoint completion: expose database, env, runtime, build commit, and provider readiness safely.
8. Database migration audit: verify all Prisma migrations match current schema and Railway Postgres.
9. Seed data audit: ensure seed creates admin, student, teacher, courses, batches, modules, resources, and settings.
10. File structure audit: identify obsolete `src/views`, `src/view-pages`, previews, and duplicated route-era files.

## Authentication And Access

11. Student login workflow: verify Firebase/test-login, session creation, role routing, and logout.
12. Admin login workflow: verify Firebase admin session, TOTP challenge, and super-admin-only access.
13. Staff login workflow: verify staff session, role home path, and permission-limited navigation.
14. Teacher login workflow: verify teacher dashboard access does not depend on student layout.
15. Session isolation: ensure student, admin, and staff cookies cannot cross-open the wrong portal.
16. Middleware authorization: confirm middleware is convenience only and APIs revalidate auth server-side.
17. RBAC model cleanup: align role permissions with every admin/staff route.
18. TOTP setup UX: make first admin/staff login show setup state clearly.
19. Password reset path: replace placeholder links with actual support/reset workflow.
20. Auth tests: add route-handler tests for student/admin/staff unauthorized and forbidden paths.

## Student Journey

21. Student dashboard: verify enrollment, payment summary, tasks, schedule, resources, and announcements.
22. Pre-arrival checklist: validate task creation, update, refresh, and error states.
23. Student profile: validate save, photo handling, field limits, and admin visibility.
24. Student notes: validate autosave, manual save, error recovery, and audit logging.
25. Lessons: validate full-access gating and protected resource links.
26. Progress: validate module completion, notes save, derived hours, and certificate eligibility.
27. Schedule: validate batch fallback, teacher info, ceremony blocking, and empty states.
28. Announcements: validate reactions, replies, batch visibility, and unread counts.
29. Notifications: validate preferences, mark-read authorization, individual/batch/audience targeting.
30. Certificates: validate eligibility, issued certificate list, PDF download, and locked states.
31. Reviews/testimonials: validate student submission, status display, and admin approval flow.
32. Support: validate email, WhatsApp, client-configured contact details, and helpful defaults.
33. Alumni transition: verify FULL to ALUMNI changes access without breaking certificate/resources.
34. Mobile student app: audit bottom nav, quick links, text fit, scroll, and PWA status.
35. Student end-to-end test: login as test student, complete pre-arrival, view lessons, update progress, submit review.

## Payment And Enrollment

36. Application modal workflow: validate course, batch, accommodation, coupon, payment option, and submission.
37. Payment provider readiness: expose Razorpay, PayPal, bank transfer, deposit/full toggles accurately.
38. Bank transfer workflow: verify enrollment creation, instructions, admin verification, and student access upgrade.
39. Razorpay create order: validate amount, currency conversion, metadata, and disabled-provider behavior.
40. Razorpay verify payment: validate signature, duplicate events, enrollment update, and student access.
41. PayPal create/capture: validate order creation, capture, duplicate handling, and enrollment update.
42. Webhook security: verify signatures, idempotency, replay safety, and provider payload storage.
43. Coupon workflow: validate active/expired/limit/min/max discount paths.
44. Payment status API: ensure frontend never offers unavailable methods/options.
45. Refund/admin payment management: validate refund fields and finance page behavior.
46. Payment tests: add unit/integration tests for pricing, status, provider readiness, and completion.
47. Payment UX: show clear pending, confirmed, failed, and disabled states in modal and student app.
48. Enrollment lifecycle: define PENDING, DEPOSIT_PAID, FULL_PAID, FAILED, REFUNDED access mapping.
49. Email confirmations: verify SMTP messages for lead, enrollment, payment, and admin notification.
50. Payment end-to-end test: application to payment to admin verification to student portal access.

## Admin Panel Control

51. Admin overview: verify metrics, latest items, and broken links.
52. Admin sidebar: verify active states, grouping, collapse behavior, and role filtering.
53. Courses manager: verify CRUD, localization fields, course modules, and frontend sync.
54. Batches manager: verify capacity, dates, status, accommodation, waitlist, and price data.
55. Enrollments manager: verify approval, rejection, payment status changes, and student linking.
56. Students manager: verify access level update, profile view, batch assignment, and communication actions.
57. Leads manager: verify status, notes, follow-up, source, and conversion to enrollment.
58. Waitlist manager: verify batch waitlist, capacity overflow, and admissions workflow.
59. Finance manager: verify payments, methods, provider IDs, refunds, and reporting.
60. Coupons manager: verify create/edit/active/expiry/usage limits.
61. Resources manager: verify pre-arrival/full/alumni resources and protected redirects.
62. Announcements manager: verify publish, audience, batch targeting, replies, and reactions.
63. Notifications manager: verify individual, batch, audience, action URL, and receipt behavior.
64. Gallery manager: verify images, order, active state, alt text, and public sync.
65. Testimonials manager: verify approval, rejection, privacy, public display, and student submissions.
66. Blog/templates manager: verify content creation, template sending, and public pages.
67. Settings manager: add useful toggles for payments, contact, scarcity banner, hero CTA, social proof, and support links.
68. Audit log: verify every sensitive admin/student mutation writes useful before/after records.
69. Admin API tests: add authorization and mutation tests for major admin APIs.
70. Admin workflow test: admin creates course/batch/resource/announcement, verifies payment, and upgrades student.

## Marketing Website

71. Typography system: settle simple, clean font scale inspired by the reference site.
72. Homepage hero: verify content, CTA, mobile crop, logo position, and scroll behavior.
73. Featured courses: refine card layout, images, badges, prices, and mobile scanning.
74. Gallery: improve mosaic quality, admin-backed content, mobile rail, and image performance.
75. Testimonials: improve trust layout and keep emails/privacy hidden.
76. Teachers: verify cards, carousel behavior, images, and public instructor page sync.
77. FAQ: connect admin FAQ where appropriate and keep public copy translated.
78. CTA and scarcity banner: make admin-controlled and non-overlapping on mobile.
79. Course detail pages: verify all course slugs, pricing, batches, CTAs, and SEO.
80. Pricing/visa/retreats/workshops pages: clean duplicate constants and hardcoded copy.
81. Contact page: verify map, form, SMTP, WhatsApp, and response states.
82. Blog pages: verify list, detail, metadata, and empty/error states.
83. i18n parity: ensure all public locales load and key public sections translate.
84. Public mobile QA: test 360px, 390px, 768px, desktop, and wide screens.
85. Public performance: optimize images, bundle size, layout shift, and repeated client components.

## Code Quality And Architecture

86. Shared API helpers: standardize route error handling, zod validation, same-origin checks, and pagination.
87. Shared frontend fetch helpers: standardize loading/error/success states for client pages.
88. Remove duplicates: retire unused `src/views` or `src/view-pages` after confirming no imports.
89. Component boundaries: split very large admin pages into focused modules without changing behavior.
90. Data model cleanup: normalize settings, content, and payment provider state where duplication exists.
91. Type cleanup: eliminate unsafe casts where practical and add typed response models.
92. Lint cleanup: reduce remaining Fast Refresh/noise warnings without risky shadcn rewrites.
93. Accessibility pass: labels, focus states, alt text, keyboard nav, dialog semantics.
94. Security pass: CSRF, same-origin, rate limits, webhook verification, admin-only routes, secret leaks.
95. Performance pass: dynamic imports for heavy admin pages, image dimensions, cache headers, no-store only where needed.

## Release, VPS, And Handoff

96. Vercel production gate: deploy from Git only, verify aliases, and document stuck CLI deployment workaround.
97. Railway/Postgres gate: migrate, seed, backup, and document client account ownership.
98. VPS migration plan: Docker compose, env files, Postgres backup restore, Nginx/SSL, and rollback.
99. Client handoff pack: credentials checklist, env matrix, admin guide, payment setup, Firebase setup, SMTP guide.
100. Final acceptance test: public application, payment path, admin approval, student portal, alumni/certificate, email, and deploy rollback all verified.

## Execution Rules

- Do not mix unrelated phases in one commit.
- Every code phase must run at least `npm run typecheck`, relevant tests, and `npm run build` unless explicitly blocked.
- Every deploy phase must verify the production URL and the exact deployment URL.
- Do not commit secrets or local `.env` files.
- Preserve unrelated dirty work unless explicitly asked to clean it.
