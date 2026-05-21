import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export type AuthType = 'student' | 'admin' | 'staff';

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be configured with at least 32 characters in production");
    }

    return "development-session-secret-must-be-overridden";
  }

  return secret;
}

function getSessionKey() {
  return new TextEncoder().encode(getSessionSecret());
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h') // PRD: 8 hours auto logout
    .sign(getSessionKey());
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, getSessionKey(), {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

// Session cookie names for different auth types
const SESSION_COOKIE_NAMES: Record<AuthType, string> = {
  student: 'student_session',
  admin: 'admin_session',
  staff: 'staff_session',
};

export async function createSession(userId: string, role: string, email: string, authType: AuthType = 'student') {
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
  const session = await encrypt({ userId, role, email, authType, expires });

  // Clear all other session types to prevent confusion
  const cookieName = SESSION_COOKIE_NAMES[authType];

  // Set the appropriate session cookie with specific path
  const setCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    sameSite: 'lax' as const,
  };

  cookies().set(cookieName, session, {
    ...setCookieOptions,
    path: '/',
  });

  // Clear other session types
  const otherAuthTypes: AuthType[] = ['student', 'admin', 'staff'].filter(t => t !== authType) as AuthType[];
  for (const type of otherAuthTypes) {
    cookies().set(SESSION_COOKIE_NAMES[type], '', {
      ...setCookieOptions,
      expires: new Date(0),
      path: '/',
    });
  }
}

export async function createTwoFactorChallenge(userId: string, role: string, email: string, authType: AuthType = 'student') {
  return await new SignJWT({ userId, role, email, authType, purpose: '2fa' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(getSessionKey());
}

// Get session for a specific auth type
export async function getSession(authType?: AuthType) {
  if (authType) {
    const session = cookies().get(SESSION_COOKIE_NAMES[authType])?.value;
    if (!session) return null;
    return await decrypt(session);
  }

  // Check all session types in priority order: admin, staff, student
  for (const type of ['admin', 'staff', 'student'] as AuthType[]) {
    const session = cookies().get(SESSION_COOKIE_NAMES[type])?.value;
    if (session) {
      const decrypted = await decrypt(session);
      if (decrypted) {
        return { ...decrypted, authType: type };
      }
    }
  }

  return null;
}

// Get session specifically for admin routes
export async function getAdminSession() {
  return getSession('admin');
}

// Get session specifically for staff routes
export async function getStaffSession() {
  return getSession('staff');
}

// Get session specifically for student/app routes
export async function getStudentSession() {
  return getSession('student');
}

export async function destroySession(authType?: AuthType) {
  if (authType) {
    cookies().set(SESSION_COOKIE_NAMES[authType], '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      sameSite: 'lax',
      path: '/',
    });
  } else {
    // Destroy all sessions
    for (const type of ['student', 'admin', 'staff'] as AuthType[]) {
      cookies().set(SESSION_COOKIE_NAMES[type], '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0),
        sameSite: 'lax',
        path: '/',
      });
    }
  }
}

export async function updateSession(request: NextRequest, authType?: AuthType) {
  const cookieName = authType ? SESSION_COOKIE_NAMES[authType] : SESSION_COOKIE_NAMES.student;
  const session = request.cookies.get(cookieName)?.value;
  if (!session) return;

  // Refresh the session so it doesn't expire if the user is active
  const parsed = await decrypt(session);
  if (!parsed) return;

  parsed.expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: cookieName,
    value: await encrypt(parsed),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: parsed.expires,
    sameSite: 'lax',
    path: '/',
  });
  return res;
}
