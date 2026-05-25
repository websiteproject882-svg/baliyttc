import * as Sentry from "@sentry/nextjs";
import { getSentryDsn, getSentryEnabled, getSentryTraceSampleRate } from "./sentry.shared";

Sentry.init({
  dsn: getSentryDsn(),
  enabled: getSentryEnabled(),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: getSentryTraceSampleRate(),
  sendDefaultPii: false,
});
