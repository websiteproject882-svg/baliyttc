const warned = new Set<string>();

type ValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

function evaluateProviderGroup(params: {
  name: string;
  keys: string[];
  productionMode: boolean;
  requireWhenEnabled?: boolean;
}) {
  const configured = params.keys.filter((key) => !!process.env[key]?.trim());
  const missing = params.keys.filter((key) => !process.env[key]?.trim());
  const partiallyConfigured = configured.length > 0 && missing.length > 0;
  const fullyConfigured = missing.length === 0;

  const errors: string[] = [];
  const warnings: string[] = [];

  if (partiallyConfigured) {
    const message = `${params.name} is partially configured: missing ${missing.join(", ")}`;
    if (params.productionMode || params.requireWhenEnabled) {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  }

  return { errors, warnings, fullyConfigured, partiallyConfigured };
}

function warnOnce(key: string, message: string) {
  if (warned.has(key)) {
    return;
  }
  warned.add(key);
  console.warn(message);
}

function hasValidFirebasePrivateKeyFormat(value: string | undefined) {
  const privateKey = value?.replace(/\\n/g, "\n").trim();
  return Boolean(
    privateKey &&
      privateKey.length >= 1000 &&
      privateKey.includes("-----BEGIN PRIVATE KEY-----") &&
      privateKey.includes("-----END PRIVATE KEY-----"),
  );
}

export function validateRuntimeEnv(): ValidationResult {
  const requiredInAll = ["SESSION_SECRET"];
  const requiredInProduction = ["DATABASE_URL"];
  const firebaseAdminKeys = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const key of requiredInAll) {
    const value = process.env[key];
    if (!value || !value.trim()) {
      errors.push(`${key} is required`);
    }
  }

  if ((process.env.SESSION_SECRET || "").length > 0 && (process.env.SESSION_SECRET || "").length < 32) {
    errors.push("SESSION_SECRET must be at least 32 characters");
  }

  if (process.env.NODE_ENV === "production") {
    for (const key of requiredInProduction) {
      const value = process.env[key];
      if (!value || !value.trim()) {
        errors.push(`${key} is required in production`);
      }
    }
  } else {
    for (const key of requiredInProduction) {
      const value = process.env[key];
      if (!value || !value.trim()) {
        warnings.push(`${key} is not configured`);
      }
    }
  }

  const inProduction = process.env.NODE_ENV === "production";
  const providerGroups = [
    { name: "Razorpay", keys: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"] },
    { name: "PayPal", keys: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"] },
    { name: "Resend", keys: ["RESEND_API_KEY"] },
    { name: "Gmail SMTP", keys: ["GMAIL_EMAIL", "GMAIL_APP_PASSWORD"] },
    { name: "WhatsApp", keys: ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"] },
  ];

  for (const group of providerGroups) {
    const result = evaluateProviderGroup({
      ...group,
      productionMode: inProduction,
      // Only require provider keys in production if all are provided, not when partially configured
      requireWhenEnabled: false,
    });
    // Only add errors in production mode
    if (inProduction) {
      errors.push(...result.errors);
    }
    warnings.push(...result.warnings);
  }

  const firebaseResult = evaluateProviderGroup({
    name: "Firebase Admin",
    keys: firebaseAdminKeys,
    productionMode: false,
  });
  warnings.push(...firebaseResult.warnings);

  if (process.env.CRON_SECRET && process.env.CRON_SECRET.length < 16) {
    errors.push("CRON_SECRET must be at least 16 characters when configured");
  }

  if (
    inProduction &&
    process.env.ENABLE_TEST_LOGIN === "true" &&
    process.env.ALLOW_PRODUCTION_TEST_LOGIN !== "true"
  ) {
    warnings.push("ENABLE_TEST_LOGIN is true, but production test login remains disabled without ALLOW_PRODUCTION_TEST_LOGIN=true");
  }

  if (process.env.FIREBASE_PRIVATE_KEY && !hasValidFirebasePrivateKeyFormat(process.env.FIREBASE_PRIVATE_KEY)) {
    warnings.push("FIREBASE_PRIVATE_KEY does not look like a complete PEM private key");
  }

  if (!process.env.NEXT_PUBLIC_BASE_URL?.trim()) {
    warnings.push("NEXT_PUBLIC_BASE_URL is not configured; using https://baliyttc.com as the public fallback");
  } else {
    try {
      const baseUrl = new URL(process.env.NEXT_PUBLIC_BASE_URL);
      const isLocalHost =
        baseUrl.hostname === "localhost" ||
        baseUrl.hostname === "127.0.0.1" ||
        baseUrl.hostname === "::1";

      if (inProduction && baseUrl.protocol !== "https:" && !isLocalHost) {
        errors.push("NEXT_PUBLIC_BASE_URL must use https in production");
      } else if (inProduction && baseUrl.protocol !== "https:" && isLocalHost) {
        warnings.push("NEXT_PUBLIC_BASE_URL is using http for localhost build/testing");
      }
    } catch {
      errors.push("NEXT_PUBLIC_BASE_URL must be a valid URL");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export function assertRuntimeEnv() {
  const result = validateRuntimeEnv();

  if (!result.ok) {
    const message = `Runtime env validation failed: ${result.errors.join("; ")}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }
    warnOnce("runtime-env-errors", message);
  }

  if (result.warnings.length > 0) {
    warnOnce("runtime-env-warnings", `Runtime env warnings: ${result.warnings.join("; ")}`);
  }

  return result;
}
