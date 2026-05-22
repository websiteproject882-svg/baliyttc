# Phase 2 Dirty Worktree Classification

Date: 2026-05-23

Goal: classify all current uncommitted files before making more fixes. This prevents useful work from being mixed with risky design deletions, generated files, or accidental cleanup.

## Current Baseline

- Branch: `main`
- Remote: `https://github.com/websiteproject882-svg/baliyttc.git`
- Last pushed commit: `bf4f6e5 Add 100-phase execution plan`
- Latest production Git deployment was ready on Vercel after the plan commit.
- Baseline checks before this classification:
  - `npm run typecheck`: passing
  - `npm run test`: passing

## Keep Candidate: Config And Documentation

These changes are low-risk and align with production setup, but should still be committed separately.

- `.env.production.example`
  - Adds notes for Docker/VPS versus direct Vercel/Railway style `DATABASE_URL` setup.
- `.github/workflows/ci.yml`
  - Adds non-secret demo build environment values for CI.
  - Should be verified with `npm run build` locally/CI before shipping.
- `README.md`
  - Adds lint to verification commands and clarifies production secret setup.
- `package.json`
  - Changes lint script to `eslint .`.
- `eslint.config.js`
  - Adds generated/build folders to ignores.
  - Risk note: it also relaxes several TypeScript lint rules. Keep only if lint currently blocks valid code; otherwise tighten later.

## Keep Candidate: Admin And Staff Workflow Fixes

These changes improve broken buttons, stale data, and locale-safe routing. Commit after review and verification.

- `src/app/[locale]/admin/AdminSidebar.tsx`
  - Cleaner active route matching and chevron handling.
  - Removes the FAQ Bot nav item from the sidebar.
- `src/app/[locale]/admin/announcements/page.tsx`
  - Uses `cache: "no-store"` for fresh admin data.
- `src/app/[locale]/admin/enrollments/page.tsx`
  - Adds error state, export CSV, mail action, and disables placeholder payment/access actions with clear titles.
- `src/app/[locale]/admin/finance/page.tsx`
  - Adds error state and CSV export.
- `src/app/[locale]/admin/leads/page.tsx`
  - Adds no-store fetch, CSV export, mailto, and WhatsApp actions.
- `src/app/[locale]/admin/resources/page.tsx`
  - Adds no-store fetch and fixes async delete click handling.
- `src/app/[locale]/admin/students/page.tsx`
  - Adds error state, no-store fetch, CSV export, mailto, WhatsApp, and explicit disabled Add Student behavior.
- `src/app/api/admin/leads/route.ts`
  - Loosens `followUpAt` parsing to support form datetime-local values.

## Keep Candidate: Portal Routing And RBAC Fixes

These are focused fixes for staff/teacher navigation and admin role routing.

- `src/app/[locale]/app/teacher/dashboard/page.tsx`
  - Uses locale from route params and no-store API fetch.
- `src/app/[locale]/login/page.tsx`
  - Preserves locale for Apply link and replaces dead forgot-password action with a support mail link.
- `src/app/[locale]/staff/StaffSidebar.tsx`
  - Preserves locale in staff nav links.
- `src/app/[locale]/staff/dashboard/page.tsx`
  - Preserves locale in staff dashboard action links.
- `src/app/api/health/route.ts`
  - Adds safe runtime/build metadata.
- `src/lib/rbac.ts`
  - Adds waitlist permissions to student/course manager roles.
  - Updates admin role home route to `/admin/overview`.
- `src/test/rbac.test.ts`
  - Updates expected admin home route.

## Review Bucket: Public Marketing Changes

Do not commit these until the design intent is confirmed. They may undo previously approved public-site cleanup.

- `src/app/[locale]/page.tsx`
  - Removes `SanctuaryIntro` from the homepage.
- `src/components/home/SanctuaryIntro.tsx`
  - Deletes the component.
- `src/lib/home-localized.ts`
  - Removes intro content.
- `src/components/home/Testimonials.tsx`
  - Changes the testimonial section styling away from the cleaner compact reference direction.

Decision needed: either restore and improve the intro/testimonial sections, or intentionally remove them as part of a refreshed homepage layout.

## Review Bucket: Deleted Design Previews

These files are under `design/previews` and are currently deleted. They are ignored by lint/build, but they may be useful visual references.

- `design/previews/design-preview-featured-courses-v2.html`
- `design/previews/design-preview-featured-courses.html`
- `design/previews/design-preview-homepage-hero.html`
- `design/previews/design-preview-login.html`
- `design/previews/design-preview-pillars-6-better.html`
- `design/previews/design-preview-pillars-6.html`
- `design/previews/design-preview-pillars-clean.html`
- `design/previews/design-preview-pillars-simple.html`
- `design/previews/design-preview-pillars-unique.html`
- `design/previews/design-preview-pillars.html`

Decision needed: keep these as reference assets until Phase 89/90 design cleanup, then delete in one intentional commit if still obsolete.

## Generated Or Do Not Commit

- `tsconfig.typecheck.tsbuildinfo`
  - TypeScript incremental cache. Do not commit.
- `ChatGPT Image May 21, 2026, 12_43_28 AM.png`
  - Untracked image. Do not commit unless it becomes a named public asset with a usage reference.

## Needs Import Audit

- `src/view-pages/Activities.tsx`
- `src/view-pages/CoursePage.tsx`

These untracked files look like duplicate/legacy view-page files. Run an import audit before deleting or committing them.

## Recommended Commit Order

1. Commit this classification document only.
2. Commit admin/staff/RBAC fixes after `npm run typecheck`, `npm run test`, and targeted browser smoke.
3. Commit CI/docs/lint config after `npm run lint` and `npm run build`.
4. Revisit public marketing changes separately so homepage design decisions are not mixed with admin workflow fixes.
5. Clean generated/untracked files only after confirming they are not user-owned work.

