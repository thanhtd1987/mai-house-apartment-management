import { User } from 'firebase/auth';

export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL;

export function isSuperAdmin(user: User | null): boolean {
  return user?.email === SUPER_ADMIN_EMAIL && user?.emailVerified === true;
}
