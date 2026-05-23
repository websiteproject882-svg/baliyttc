import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security';
import { verifySessionToken } from '@/lib/session-edge';
import { defaultLocale, locales } from '@/i18n/routing';

const ADMIN_PANEL_SESSION_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "STUDENT_MANAGER",
  "SEO_EDITOR",
  "FINANCE_MANAGER",
  "COURSE_MANAGER",
]);

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

async function requireAdminPanelSession(request: NextRequest, locale: string) {
  const adminSession = request.cookies.get('admin_session')?.value;
  if (adminSession) {
    const decrypted = await verifySessionToken(adminSession);
    if (decrypted?.authType === 'admin' && ADMIN_PANEL_SESSION_ROLES.has(String(decrypted.role))) {
      return null;
    }
  }

  const staffSession = request.cookies.get('staff_session')?.value;
  if (staffSession) {
    const decrypted = await verifySessionToken(staffSession);
    if (decrypted?.authType === 'staff' && ADMIN_PANEL_SESSION_ROLES.has(String(decrypted.role))) {
      return null;
    }
  }

  return redirectToLogin(request, locale, 'admin');
}

export default async function middleware(request: NextRequest) {
  const { locale, pathWithoutLocale } = getLocalizedPath(request.nextUrl.pathname);
  const isAdminLogin = pathWithoutLocale === '/admin/login';
  const isStaffLogin = pathWithoutLocale === '/staff/login';

  if (pathWithoutLocale.startsWith('/admin') && !isAdminLogin) {
    const response = await requireAdminPanelSession(request, locale);
    if (response) return applySecurityHeaders(response);
  }

  if (pathWithoutLocale.startsWith('/staff') && !isStaffLogin) {
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
