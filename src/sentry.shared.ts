export function getSentryDsn() {
  return process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "";
}

export function getSentryEnabled() {
  return Boolean(getSentryDsn());
}

export function getSentryTraceSampleRate() {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE || process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
  const parsed = raw ? Number(raw) : 0.1;

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0.1;
  }

  return Math.min(parsed, 1);
}
