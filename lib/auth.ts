import { adminAuth } from './firebase-admin';
import { cookies } from 'next/headers';
import { DecodedIdToken } from 'firebase-admin/auth';

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 1 * 1000; // 1 day in ms

/** Verifies session cookie and returns decoded token, or null if invalid */
export async function verifySession(): Promise<DecodedIdToken | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value ?? '';
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded;
  } catch {
    return null;
  }
}

/** Creates a session cookie string from a Firebase ID token */
export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE });
}

/** Returns user-readable roles from decoded token */
export function getRoles(decoded: DecodedIdToken) {
  return {
    isSuperAdmin: !!decoded.superAdmin,
    isAdmin:      !!decoded.admin,
    isPublisher:  !!decoded.publisher,
    isCreater:    !!decoded.creater,
    company:      decoded.company as string | undefined,
  };
}

/**
 * Verifies session and asserts that user is an admin (either Super Admin or Tenant Admin).
 * Returns decoded token or null.
 */
export async function requireAdmin(): Promise<DecodedIdToken | null> {
  const decoded = await verifySession();
  if (!decoded || (!decoded.admin && !decoded.superAdmin)) return null;
  return decoded;
}

/**
 * Verifies session and asserts that user is a Super Admin.
 * Returns decoded token or null.
 */
export async function requireSuperAdmin(): Promise<DecodedIdToken | null> {
  const decoded = await verifySession();
  if (!decoded || !decoded.superAdmin) return null;
  return decoded;
}

