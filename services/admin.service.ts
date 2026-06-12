import 'server-only';
import { adminAuth } from '@/lib/firebase-admin';
import { UserProfile, UserCreateInput, UserUpdateInput } from '@/types/user';

/** Maps a Firebase UserRecord to our internal UserProfile type */
function mapUserRecord(user: any): UserProfile {
  const customClaims = user.customClaims ?? {};
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName,
    photoURL: user.photoURL,
    disabled: user.disabled,
    company: customClaims.company ?? 'Not Assigned',
    admin: !!customClaims.admin,
    creater: !!customClaims.creater,
    publisher: !!customClaims.publisher,
    creationTime: user.metadata?.creationTime,
    lastSignInTime: user.metadata?.lastSignInTime,
    lastRefreshTime: user.metadata?.lastRefreshTime,
  };
}

export async function getAllUsers(maxResults = 100): Promise<UserProfile[]> {
  try {
    const listResult = await adminAuth.listUsers(maxResults);
    return listResult.users.map(mapUserRecord);
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function getUser(uid: string): Promise<UserProfile> {
  try {
    const userRecord = await adminAuth.getUser(uid);
    return mapUserRecord(userRecord);
  } catch (error) {
    console.error(`Error fetching user ${uid}:`, error);
    throw new Error('User not found');
  }
}

export async function createUser(input: UserCreateInput): Promise<string> {
  try {
    const userRecord = await adminAuth.createUser({
      email: input.email,
      emailVerified: input.emailVerified,
      phoneNumber: input.phoneNumber || undefined,
      password: input.password || undefined,
      displayName: input.displayName,
      disabled: input.disabled,
    });
    return userRecord.uid;
  } catch (error) {
    console.error('Error creating new user:', error);
    throw error;
  }
}

export async function updateUser(uid: string, input: UserUpdateInput): Promise<UserProfile> {
  try {
    const updatePayload: any = {
      email: input.email,
      emailVerified: input.emailVerified,
      phoneNumber: input.phoneNumber || null, // null removes the field
      displayName: input.displayName,
      disabled: input.disabled,
    };

    if (input.password) {
      updatePayload.password = input.password;
    }

    if (input.photoURL) {
      updatePayload.photoURL = input.photoURL;
    }

    const userRecord = await adminAuth.updateUser(uid, updatePayload);
    return mapUserRecord(userRecord);
  } catch (error) {
    console.error(`Error updating user ${uid}:`, error);
    throw error;
  }
}

export async function deleteUser(uid: string): Promise<void> {
  try {
    await adminAuth.deleteUser(uid);
  } catch (error) {
    console.error(`Error deleting user ${uid}:`, error);
    throw error;
  }
}

export interface UserRolesInput {
  admin: boolean;
  creater: boolean;
  publisher: boolean;
  company?: string | null;
}

export async function assignRoles(uid: string, roles: UserRolesInput): Promise<void> {
  try {
    const claims = {
      admin: roles.admin,
      creater: roles.creater,
      publisher: roles.publisher,
      company: roles.company || null,
    };
    await adminAuth.setCustomUserClaims(uid, claims);
  } catch (error) {
    console.error(`Error assigning custom claims to user ${uid}:`, error);
    throw error;
  }
}
