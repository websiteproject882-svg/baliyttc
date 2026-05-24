import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/routing';
import '../globals.css';
import SupportBot from '@/components/shared/SupportBot';
import { createPublicMetadata } from '@/lib/public-metadata';

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata('home', params.locale, '/');
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
      <SupportBot />
    </NextIntlClientProvider>
  );
}
