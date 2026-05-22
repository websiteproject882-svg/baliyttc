import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security';
import { verifySessionToken } from '@/lib/session-edge';
import { defaultLocale, locales } from '@/i18n/routing';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
});

function getLocalizedPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0];
  const locale = locales.includes(maybeLocale as any) ? maybeLocale : defaultLocale;
  const pathWithoutLocale = locales.includes(maybeLocale as any)
    ? `/${segments.slice(1).join('/')}`
    : pathname;

  return {
    locale,
    pathWithoutLocale: pathWithoutLocale === '/' ? '/' : pathWithoutLocale.replace(/\/$/, ''),
  };
}

function redirectToLogin(request: NextRequest, locale: string, type?: 'admin' | 'staff') {
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/login`;
  url.search = type ? `?type=${type}` : '';
  return NextResponse.redirect(url);
}

async function requireSession(
  request: NextRequest,
  cookieName: 'admin_session' | 'staff_session' | 'student_session',
  authType: 'admin' | 'staff' | 'student',
  locale: string,
) {
  const session = request.cookies.get(cookieName)?.value;
  if (!session) {
    return redirectToLogin(request, locale, authType === 'student' ? undefined : authType);
  }

  const decrypted = await verifySessionToken(session);
  if (!decrypted || decrypted.authType !== authType) {
    return redirectToLogin(request, locale, authType === 'student' ? undefined : authType);
  }

  return null;
}

export default async function middleware(request: NextRequest) {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  if (segments[0] === 'id') {
    const url = request.nextUrl.clone();
    const rest = segments.slice(1).join('/');
    url.pathname = rest ? `/en/${rest}` : '/en';
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  const { locale, pathWithoutLocale } = getLocalizedPath(request.nextUrl.pathname);

  if (pathWithoutLocale.startsWith('/admin')) {
    const response = await requireSession(request, 'admin_session', 'admin', locale);
    if (response) return applySecurityHeaders(response);
  }

  if (pathWithoutLocale.startsWith('/staff')) {
    const response = await requireSession(request, 'staff_session', 'staff', locale);
    if (response) return applySecurityHeaders(response);
  }

  if (pathWithoutLocale.startsWith('/app')) {
    const response = await requireSession(request, 'student_session', 'student', locale);
    if (response) return applySecurityHeaders(response);
  }

  const response = intlMiddleware(request);
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
