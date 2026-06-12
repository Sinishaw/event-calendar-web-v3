import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

export async function GET() {
  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
  );

  const cookiesToClear = [
    SESSION_COOKIE, 'displayName', 'email', 'uid',
    'company', 'admin', 'publisher', 'creater',
  ];

  cookiesToClear.forEach((name) => {
    response.cookies.set(name, '', { maxAge: 0, path: '/' });
  });

  return response;
}
