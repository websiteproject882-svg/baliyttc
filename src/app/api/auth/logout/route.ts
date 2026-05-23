import { NextRequest } from 'next/server';
import { destroySession } from '@/lib/session';
import { requireSameOrigin } from '@/lib/authz';
import { jsonWithRequestId, logApiError } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const sameOriginResponse = requireSameOrigin(request);
    if (sameOriginResponse) {
      return sameOriginResponse;
    }

    await destroySession();
    return jsonWithRequestId({ success: true }, undefined, request);
  } catch (error) {
    logApiError('auth.logout', error, request);
    return jsonWithRequestId({ error: 'Internal server error' }, { status: 500 }, request);
  }
}
