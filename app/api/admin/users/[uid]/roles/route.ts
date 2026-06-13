import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getRoles } from '@/lib/auth';
import { assignRoles, getUser } from '@/services/admin.service';
import { z } from 'zod';

const rolesSchema = z.object({
  superAdmin: z.boolean().default(false),
  admin: z.boolean().default(false),
  creater: z.boolean().default(false),
  publisher: z.boolean().default(false),
  company: z.string().nullable().optional(),
});

interface RouteParams {
  params: Promise<{ uid: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const adminSession = await requireAdmin();
  if (!adminSession) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const roles = getRoles(adminSession);
  const { uid } = await params;

  // Tenant admins can only manage users in their company
  if (!roles.isSuperAdmin) {
    try {
      const targetUser = await getUser(uid);
      if (targetUser.company !== roles.company) {
        return NextResponse.json({ error: 'Forbidden: not in your tenant' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  }

  try {
    const body = await req.json();
    const result = rolesSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const { superAdmin: superAdminGrant, admin, creater, publisher, company } = result.data;

    // Only Super Admins can grant the superAdmin role; also only they can change company
    await assignRoles(uid, {
      superAdmin: roles.isSuperAdmin ? superAdminGrant : false,
      admin,
      creater,
      publisher,
      company: roles.isSuperAdmin ? (company || null) : (roles.company ?? null),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API POST roles for user ${uid} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to assign roles' }, { status: 500 });
  }
}
