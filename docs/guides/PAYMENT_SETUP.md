# Payment Setup

This project uses Razorpay, PayPal, and optional bank transfer. Stripe is intentionally removed.

Current status (May 21, 2026): Razorpay, PayPal, bank transfer, coupon validation, webhook routes, and admin payment actions are wired in code. Razorpay/PayPal should remain disabled or pending until live/sandbox client credentials are supplied and smoke-tested.

## Current Testing Mode

Razorpay and PayPal can remain unconfigured during the internal testing phase. When their credentials are missing, checkout keeps bank transfer available and shows Razorpay/PayPal as pending instead of failing with a broken payment flow.

When the client provides real or sandbox credentials, add them in:

```text
Vercel Dashboard -> baliyytc -> Settings -> Environment Variables -> Production
```

Then redeploy production and verify `https://baliyytc.vercel.app/api/health`.

## Razorpay

Add these values locally and in Vercel:

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

Webhook endpoint for this deployed app:

```text
https://baliyytc.vercel.app/api/payments/webhook?provider=razorpay
```

Recommended webhook events:

- `payment.captured`
- `payment.failed`

## PayPal

Add these values locally and in Vercel:

```env
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_ENV=sandbox
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
```

Use `PAYPAL_ENV=live` only after production credentials and webhook verification are ready.

Webhook endpoint for this deployed app:

```text
https://baliyytc.vercel.app/api/payments/webhook?provider=paypal
```

Recommended webhook events:

- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`

## Server Routes

- `POST /api/payments/create` creates Razorpay or PayPal orders.
- `POST /api/payments/razorpay/verify` verifies Razorpay checkout signatures.
- `POST /api/payments/paypal/capture` captures approved PayPal orders.
- `POST /api/payments/webhook?provider=razorpay` verifies Razorpay webhooks.
- `POST /api/payments/webhook?provider=paypal` verifies PayPal webhooks.

## Bank Transfer

Add these optional values if finance wants bank details shown during checkout:

```env
BANK_TRANSFER_ACCOUNT_NAME=
BANK_TRANSFER_BANK_NAME=
BANK_TRANSFER_ACCOUNT_NUMBER=
BANK_TRANSFER_SWIFT=
BANK_TRANSFER_IBAN=
```

Bank transfer payments stay pending until an admin marks the payment as paid.
