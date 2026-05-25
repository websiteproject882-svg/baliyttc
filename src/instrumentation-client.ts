import * as Sentry from "@sentry/nextjs";
import { captureRouterTransitionStart } from "@sentry/nextjs";
import { getSentryDsn, getSentryEnabled, getSentryTraceSampleRate } from "./sentry.shared";

Sentry.init({
  dsn: getSentryDsn(),
  enabled: getSentryEnabled(),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: getSentryTraceSampleRate(),
  sendDefaultPii: false,
});

export const onRouterTransitionStart = captureRouterTransitionStart;
