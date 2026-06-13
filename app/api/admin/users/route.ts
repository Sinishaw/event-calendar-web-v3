import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getRoles } from '@/lib/auth';
import { getAllUsers, createUser, updateUser, assignRoles } from '@/services/admin.service';
import { uploadToGCS } from '@/lib/upload';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  emailVerified: z.boolean().default(false),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (must start with +)').optional().or(z.literal('')),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  disabled: z.boolean().default(false),
});

export async function GET() {
  const adminSession = await requireAdmin();
  if (!adminSession) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const roles = getRoles(adminSession);

  try {
    const allUsers = await getAllUsers();

    // Super Admins see all users; Tenant Admins see only users of their company
    const users = roles.isSuperAdmin
      ? allUsers
      : allUsers.filter((u) => u.company === roles.company);

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('API GET users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminSession = await requireAdmin();
  if (!adminSession) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const roles = getRoles(adminSession);

  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const displayName = formData.get('displayName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const password = formData.get('password') as string;
    const emailVerified = formData.get('emailVerified') === 'true';
    const disabled = formData.get('disabled') === 'true';
    const photoFile = formData.get('photo') as File | null;

    // Roles from form
    const isSuperAdminGrant = formData.get('superAdmin') === 'true';
    const isAdminGrant = formData.get('admin') === 'true';
    const isCreaterGrant = formData.get('creater') === 'true';
    const isPublisherGrant = formData.get('publisher') === 'true';
    let company = formData.get('company') as string | null;

    // Non-super-admins can only create users in their own company
    if (!roles.isSuperAdmin) {
      company = roles.company ?? null;
    }

    // Only Super Admins can grant superAdmin role
    const superAdminClaim = roles.isSuperAdmin ? isSuperAdminGrant : false;

    const dataObj = { email, displayName, phoneNumber, password, emailVerified, disabled };
    const result = createUserSchema.safeParse(dataObj);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }

    // 1. Create user
    const uid = await createUser({
      email,
      emailVerified,
      phoneNumber: phoneNumber || undefined,
      displayName,
      password,
      disabled,
    });

    // 2. Assign roles atomically
    await assignRoles(uid, {
      superAdmin: superAdminClaim,
      admin: isAdminGrant,
      creater: isCreaterGrant,
      publisher: isPublisherGrant,
      company: company || null,
    });

    // 3. Upload photo if present
    if (photoFile && photoFile.size > 0) {
      try {
        const bytes = await photoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = photoFile.name.split('.').pop() || 'png';
        const destinationPath = `BackendUsersProfilePictures/${uid}.${ext}`;
        const photoURL = await uploadToGCS(buffer, destinationPath, photoFile.type);
        await updateUser(uid, { photoURL });
      } catch (uploadError) {
        console.error('Failed to upload user profile photo during creation:', uploadError);
      }
    }

    return NextResponse.json({ success: true, data: { uid } });
  } catch (error: any) {
    console.error('API POST user error:', error);
    const message = error.message || 'Failed to create user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
