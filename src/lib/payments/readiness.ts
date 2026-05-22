export type PaymentProviderReadiness = {
  checkoutReady: boolean;
  webhookReady: boolean;
  envReady: boolean;
  requiredEnv: string[];
  checkoutEnv: string[];
  webhookEnv: string[];
  missingEnv: string[];
};

function hasEnv(key: string) {
  return Boolean(process.env[key]?.trim());
}

function readiness(checkoutEnv: string[], webhookEnv: string[] = []): PaymentProviderReadiness {
  const requiredEnv = [...checkoutEnv, ...webhookEnv];
  const missingEnv = requiredEnv.filter((key) => !hasEnv(key));
  const checkoutReady = checkoutEnv.every(hasEnv);
  const webhookReady = webhookEnv.length === 0 || webhookEnv.every(hasEnv);

  return {
    checkoutReady,
    webhookReady,
    envReady: checkoutReady && webhookReady,
    requiredEnv,
    checkoutEnv,
    webhookEnv,
    missingEnv,
  };
}

export function getPaymentProviderReadiness() {
  return {
    paypal: readiness(["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"], ["PAYPAL_WEBHOOK_ID"]),
    razorpay: readiness(["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"], ["RAZORPAY_WEBHOOK_SECRET"]),
    bankTransfer: readiness([]),
  };
}
