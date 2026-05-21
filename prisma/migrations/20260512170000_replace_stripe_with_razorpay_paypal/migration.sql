-- Replace Stripe-specific storage with Razorpay and PayPal provider fields.
-- Existing STRIPE values are mapped to RAZORPAY so old pending rows remain queryable.

ALTER TABLE "Payment" ADD COLUMN "razorpayOrderId" TEXT;
ALTER TABLE "Payment" RENAME COLUMN "stripePaymentId" TO "razorpayPaymentId";
ALTER TABLE "Payment" ADD COLUMN "razorpaySignature" TEXT;
ALTER TABLE "Payment" ADD COLUMN "paypalCaptureId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "providerEventId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "providerPayload" JSONB;

ALTER TABLE "PaymentPlanInstallment" RENAME COLUMN "stripePaymentId" TO "providerPaymentId";

CREATE TYPE "PaymentMethod_new" AS ENUM ('RAZORPAY', 'PAYPAL', 'BANK_TRANSFER');

ALTER TABLE "Payment"
  ALTER COLUMN "method" DROP DEFAULT,
  ALTER COLUMN "method" TYPE "PaymentMethod_new"
  USING (
    CASE "method"::text
      WHEN 'STRIPE' THEN 'RAZORPAY'
      ELSE "method"::text
    END
  )::"PaymentMethod_new";

DROP TYPE "PaymentMethod";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
