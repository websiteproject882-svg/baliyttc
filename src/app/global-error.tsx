"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-[#f8f3ec] px-6 text-center text-[#1f1f1b]">
          <div className="max-w-md rounded-[10px] border border-stone-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f05a28]">Bali YTTC</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              The page could not load correctly. Our team has been notified if monitoring is enabled.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-full bg-[#f05a28] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d94b1e]"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
