# API Observability Audit

Date: 2026-05-23

## Result

The project already has request-id helpers in `src/lib/security.ts`:

- `getRequestId`
- `withRequestId`
- `jsonWithRequestId`
- `logApiError`

Several high-risk flows already use these helpers, including auth, payments, lead creation, certificates, cron, and health checks.

## Improvement Added

This phase added `createApiErrorResponse`, which standardizes common API error responses with:

- JSON `{ error }` shape
- `X-Request-Id`
- basic hardening headers from `applySecurityHeaders`

The shared same-origin guard now uses this helper, so every route protected by `requireSameOrigin` returns traceable 403 responses. Rate-limit responses can now also carry request IDs when the caller passes the request.

## Current Health Endpoint

`/api/health` reports:

- overall status
- timestamp and duration
- runtime commit/region
- database check
- env validation check
- provider readiness for Razorpay, PayPal, email, and WhatsApp
- warnings and errors

## Remaining Work

Many route handlers still return direct `NextResponse.json({ error })` responses. They should be migrated gradually to `jsonWithRequestId` or `createApiErrorResponse` as each module is touched, instead of doing a large noisy rewrite.

