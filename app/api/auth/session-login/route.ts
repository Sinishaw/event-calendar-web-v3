import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Missing ID token' }, { status: 400 });
    }

    // Create session cookie
    const sessionCookie = await createSessionCookie(idToken);

    // Verify and fetch additional user data
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userRecord = await adminAuth.getUser(decoded.uid);

    const response = NextResponse.json({ status: 'success' });

    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      maxAge: SESSION_MAX_AGE / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    // Set non-sensitive user info cookies (readable by client for display)
    const cookieOptions = { path: '/', sameSite: 'strict' as const };
    response.cookies.set('displayName', userRecord.displayName ?? '', cookieOptions);
    response.cookies.set('email', userRecord.email ?? '', cookieOptions);
    response.cookies.set('uid', decoded.uid, cookieOptions);
    response.cookies.set('company', decoded.company ?? '', cookieOptions);
    response.cookies.set('admin', String(!!decoded.admin), cookieOptions);
    response.cookies.set('publisher', String(!!decoded.publisher), cookieOptions);
    response.cookies.set('creater', String(!!decoded.creater), cookieOptions);

    return response;
  } catch (error) {
    console.error('Session login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
