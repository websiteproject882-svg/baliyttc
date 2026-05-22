import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales } from './routing';

type Messages = Record<string, unknown>;

function mergeMessages(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === 'object' &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergeMessages(baseValue as Messages, value as Messages);
    } else {
      result[key] = value;
    }
  }

  return result as Messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !locales.includes(locale as any)) notFound();
  const fallbackMessages = (await import('./messages/en.json')).default as Messages;
  const localeMessages = (await import(`./messages/${locale}.json`)).default as Messages;

  return {
    locale,
    messages: mergeMessages(fallbackMessages, localeMessages) as unknown as AbstractIntlMessages
  };
});
