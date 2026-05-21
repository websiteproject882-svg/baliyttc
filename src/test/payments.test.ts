import crypto from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculatePrice, formatCurrency, toMinorUnits } from "../lib/payments/pricing";
import { getPayPalBaseUrl, getPayPalEnvironment, isPayPalConfigured } from "../lib/payments/paypal";
import {
  isRazorpayConfigured,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "../lib/payments/razorpay";

const originalEnv = { ...process.env };

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...originalEnv };
});

describe("payment pricing", () => {
  it("calculates final, deposit, and remaining amount", () => {
    expect(
      calculatePrice({
        coursePrice: 1200,
        accommodationPrice: 400,
        couponDiscount: 10,
      }),
    ).toEqual({
      basePrice: 1200,
      accommodationUpgrade: 400,
      couponDiscount: 160,
      finalPrice: 1440,
      depositAmount: 288,
      remainingAmount: 1152,
    });
  });

  it("uses minimum deposit and minor currency units", () => {
    expect(calculatePrice({ coursePrice: 500 }).depositAmount).toBe(200);
    expect(calculatePrice({ coursePrice: 150 }).depositAmount).toBe(150);
    expect(toMinorUnits(12.34)).toBe(1234);
    expect(formatCurrency(1200, "INR")).toBe("Rs. 1,200");
  });
});

describe("razorpay helpers", () => {
  it("detects configuration and verifies checkout signatures", () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_key";
    process.env.RAZORPAY_KEY_SECRET = "secret";

    const orderId = "order_123";
    const paymentId = "pay_123";
    const signature = crypto
      .createHmac("sha256", "secret")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(isRazorpayConfigured()).toBe(true);
    expect(verifyRazorpayPaymentSignature({ orderId, paymentId, signature })).toBe(true);
    expect(verifyRazorpayPaymentSignature({ orderId, paymentId, signature: "bad" })).toBe(false);
  });

  it("verifies webhook signatures against raw body", () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "webhook_secret";
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = crypto.createHmac("sha256", "webhook_secret").update(body).digest("hex");

    expect(verifyRazorpayWebhookSignature(body, signature)).toBe(true);
    expect(verifyRazorpayWebhookSignature(body, null)).toBe(false);
  });
});

describe("paypal helpers", () => {
  it("selects sandbox by default and live only when requested", () => {
    process.env.PAYPAL_CLIENT_ID = "client";
    process.env.PAYPAL_CLIENT_SECRET = "secret";
    delete process.env.PAYPAL_ENV;

    expect(isPayPalConfigured()).toBe(true);
    expect(getPayPalEnvironment()).toBe("sandbox");
    expect(getPayPalBaseUrl()).toBe("https://api-m.sandbox.paypal.com");

    process.env.PAYPAL_ENV = "live";
    expect(getPayPalEnvironment()).toBe("live");
    expect(getPayPalBaseUrl()).toBe("https://api-m.paypal.com");
  });
});
