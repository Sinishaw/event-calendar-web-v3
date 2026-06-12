import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { assignRoles } from '@/services/admin.service';
import { z } from 'zod';

const rolesSchema = z.object({
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { uid } = await params;
  try {
    const body = await req.json();
    const result = rolesSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { admin, creater, publisher, company } = result.data;
    await assignRoles(uid, {
      admin,
      creater,
      publisher,
      company: company || null,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`API POST roles for user ${uid} error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to assign roles' }, { status: 500 });
  }
}
