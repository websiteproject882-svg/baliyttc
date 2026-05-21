import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';
import { requireSameOrigin } from '@/lib/authz';

export async function POST(request: NextRequest) {
  try {
    const sameOriginResponse = requireSameOrigin(request);
    if (sameOriginResponse) {
      return sameOriginResponse;
    }

    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
