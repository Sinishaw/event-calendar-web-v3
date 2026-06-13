import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });

  const cookiesToClear = [
    SESSION_COOKIE, 'displayName', 'email', 'uid',
    'company', 'admin', 'publisher', 'creater',
  ];

  cookiesToClear.forEach((name) => {
    response.cookies.set(name, '', { maxAge: 0, path: '/' });
  });

  return response;
}
