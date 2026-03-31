export interface AppUser {
  id: string;
  email: string;
  role: 'admin' | 'manager';
  name?: string;
  notes?: string;
  createdAt: string;
  lastLoginAt?: string;
  invitedBy: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  email: string;
  loginTime: string;
  userAgent?: string;
}

export interface SuperAdminConfig {
  email: string;
  active: boolean;
  createdAt: string;
  notes?: string;
}
