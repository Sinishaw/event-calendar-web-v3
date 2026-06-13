export interface UserProfile {
  uid: string;
  email?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  displayName?: string;
  photoURL?: string;
  disabled: boolean;
  company?: string;
  superAdmin: boolean;
  admin: boolean;
  creater: boolean;
  publisher: boolean;
  creationTime?: string;
  lastSignInTime?: string;
  lastRefreshTime?: string;
}

export interface UserCreateInput {
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  password?: string;
  displayName: string;
  disabled: boolean;
}

export interface UserUpdateInput {
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  password?: string;
  displayName?: string;
  disabled?: boolean;
  photoURL?: string;
}
