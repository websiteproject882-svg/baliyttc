"use client";

import { useMessages } from "next-intl";
import { defaultHomeCopy, type HomeCopy } from "@/lib/home-localized";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (Array.isArray(base)) {
    return (Array.isArray(override) ? override : base) as T;
  }

  if (!isPlainObject(base)) {
    return (override ?? base) as T;
  }

  const output: Record<string, unknown> = { ...base };
  if (!isPlainObject(override)) return output as T;

  for (const [key, value] of Object.entries(override)) {
    output[key] = key in output ? deepMerge(output[key], value) : value;
  }

  return output as T;
}

export function useHomeCopy(): HomeCopy {
  const messages = useMessages() as { HomeCopy?: Partial<HomeCopy> };
  return deepMerge(defaultHomeCopy, messages.HomeCopy);
}
