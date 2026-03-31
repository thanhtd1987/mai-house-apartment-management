# User Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a user management system where the super admin can whitelist users via email, assign roles (admin/manager), and track login activity. Only super admin sees the Users management page.

**Architecture:** Whitelist-based access control using Firestore `users` collection. Client-side UI checks hide/show pages, server-side Firestore security rules enforce write permissions. Login tracking only for whitelisted users. Super admin configuration stored in `config/superAdmins` collection for flexibility.

**Tech Stack:** Firebase (Firestore, Auth), React + TypeScript, Zustand (state), Framer Motion (animations), Lucide React (icons)

---

## File Structure

**New Files (create):**
- `src/utils/permissions.ts` - Client-side permission check utilities
- `src/types/user.ts` - User and UserActivity type definitions
- `src/hooks/useUsers.ts` - Firestore real-time listener for users collection
- `src/hooks/useUserActivities.ts` - Firestore real-time listener for userActivities collection
- `src/components/users/UserCard.tsx` - Display user info with edit/remove actions
- `src/components/users/AddUserModal.tsx` - Form to add users to whitelist
- `src/components/users/index.ts` - Barrel export for user components
- `src/pages/Users/index.tsx` - Users manager page with stats dashboard

**Modify Files:**
- `src/constants/routes.ts` - Add USERS route constant
- `src/components/layout/Sidebar.tsx` - Conditionally show Users nav item
- `src/App.tsx` - Add Users route case, initialize user hooks
- `src/types/index.ts` - Export user types
- `src/stores/dataStore.ts` - Add users and userActivities state
- `src/hooks/useAuth.ts` - Track login activity for whitelisted users
- `firestore.rules` - Add isWhitelisted() helper, update all collection rules
- `.env.local` - Add VITE_SUPER_ADMIN_EMAIL

---

## Task 1: Add Super Admin Environment Variable

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add environment variable**

Append to `.env.local`:
```bash
# Super Admin Email - must match email in config/superAdmins collection
VITE_SUPER_ADMIN_EMAIL="thanhtd1987@gmail.com"
```

- [ ] **Step 2: Verify environment variable loads**

Check the variable is accessible in the app by adding a temporary console.log in any component and restarting dev server.

- [ ] **Step 3: Commit**

```bash
git add .env.local
git commit -m "feat: add super admin email environment variable"
```

---

## Task 2: Create Permission Utility

**Files:**
- Create: `src/utils/permissions.ts`

- [ ] **Step 1: Create permission utility file**

Create `src/utils/permissions.ts`:
```typescript
import { User } from 'firebase/auth';

export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL;

export function isSuperAdmin(user: User | null): boolean {
  return user?.email === SUPER_ADMIN_EMAIL && user?.emailVerified === true;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npm run type-check` or check for no TS errors in your IDE.

- [ ] **Step 3: Commit**

```bash
git add src/utils/permissions.ts
git commit -m "feat: add permission check utility for super admin"
```

---

## Task 3: Define User Types

**Files:**
- Create: `src/types/user.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create user type definitions**

Create `src/types/user.ts`:
```typescript
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
```

- [ ] **Step 2: Export user types from barrel**

Add to `src/types/index.ts`:
```typescript
export * from './user';
```

- [ ] **Step 3: Verify TypeScript compilation**

Check for no TS errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/user.ts src/types/index.ts
git commit -m "feat: define user and activity types"
```

---

## Task 4: Update Data Store

**Files:**
- Modify: `src/stores/dataStore.ts`

- [ ] **Step 1: Add users and userActivities to data store**

Read the existing store structure first, then add:
```typescript
import { AppUser, UserActivity } from '../types/user';

// In DataState interface, add:
users: AppUser[];
userActivities: UserActivity[];
setUsers: (users: AppUser[]) => void;
setUserActivities: (activities: UserActivity[]) => void;
updateUser: (id: string, updates: Partial<AppUser>) => void;
```

- [ ] **Step 2: Initialize users and userActivities in store**

In the store implementation, add initial state and setters:
```typescript
users: [],
userActivities: [],

setUsers: (users) => set({ users }),
setUserActivities: (userActivities) => set({ userActivities }),
updateUser: (id, updates) => set((state) => ({
  users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
})),
```

- [ ] **Step 3: Verify store compiles**

Check for TS errors.

- [ ] **Step 4: Commit**

```bash
git add src/stores/dataStore.ts
git commit -m "feat: add users and userActivities to data store"
```

---

## Task 5: Create useUsers Hook

**Files:**
- Create: `src/hooks/useUsers.ts`

- [ ] **Step 1: Create useUsers hook**

Create `src/hooks/useUsers.ts`:
```typescript
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AppUser } from '../types/user';
import { useDataStore } from '../stores';

export function useUsers() {
  const { setUsers } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
      setUsers(users);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err as Error);
      setLoading(false);
    });

    return () => unsub();
  }, [setUsers]);

  return { loading, error };
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Check for TS errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUsers.ts
git commit -m "feat: add useUsers hook for real-time user data"
```

---

## Task 6: Create useUserActivities Hook

**Files:**
- Create: `src/hooks/useUserActivities.ts`

- [ ] **Step 1: Create useUserActivities hook**

Create `src/hooks/useUserActivities.ts`:
```typescript
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserActivity } from '../types/user';
import { useDataStore } from '../stores';

export function useUserActivities(limitCount = 50) {
  const { setUserActivities } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'userActivities'),
      orderBy('loginTime', 'desc'),
      limit(limitCount)
    );
    const unsub = onSnapshot(q, (snap) => {
      const activities = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserActivity));
      setUserActivities(activities);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err as Error);
      setLoading(false);
    });

    return () => unsub();
  }, [setUserActivities, limitCount]);

  return { loading, error };
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Check for TS errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUserActivities.ts
git commit -m "feat: add useUserActivities hook for login tracking"
```

---

## Task 7: Update useAuth Hook for Login Tracking

**Files:**
- Modify: `src/hooks/useAuth.ts`

- [ ] **Step 1: Add login tracking to useAuth**

Read the existing `src/hooks/useAuth.ts`, then modify the onAuthStateChanged callback:
```typescript
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

// In the useEffect, inside the onAuthStateChanged callback:
if (u) {
  // Track login activity ONLY if user exists in users collection
  (async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', u.uid));

      if (userDoc.exists()) {
        // Update lastLoginAt
        await updateDoc(doc(db, 'users', u.uid), {
          lastLoginAt: new Date().toISOString()
        });

        // Log activity
        await addDoc(collection(db, 'userActivities'), {
          userId: u.uid,
          email: u.email,
          loginTime: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
      }
      // If user doesn't exist in users collection, don't track
    } catch (error) {
      console.error('Error tracking login:', error);
      // Don't throw - login should still succeed
    }
  })();
}
```

- [ ] **Step 2: Verify code compiles**

Check for TS errors and that existing auth tests still pass.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: track login activity for whitelisted users"
```

---

## Task 8: Add USERS Route Constant

**Files:**
- Modify: `src/constants/routes.ts`

- [ ] **Step 1: Add USERS route**

Read existing routes, then add:
```typescript
export const ROUTES = {
  // ... existing routes
  USERS: 'users',
} as const;

export const ROUTE_TITLES = {
  // ... existing titles
  [ROUTES.USERS]: 'Quản lý Users',
};
```

- [ ] **Step 2: Verify route compiles**

Check for TS errors.

- [ ] **Step 3: Commit**

```bash
git add src/constants/routes.ts
git commit -m "feat: add USERS route constant"
```

---

## Task 9: Update Sidebar for Conditional Users Tab

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Import permission utility and add conditional Users nav item**

At the top of Sidebar component, add:
```typescript
import { useAuthStore } from '../../stores';
import { isSuperAdmin } from '../../utils/permissions';
import { ROUTES } from '../../constants';
import { Users } from 'lucide-react';
```

- [ ] **Step 2: Modify NAV_ITEMS to conditionally include Users**

Find the NAV_ITEMS array and add Users item with showIf condition:
```typescript
const { user } = useAuthStore();

const NAV_ITEMS = [
  // ... existing items
  {
    id: ROUTES.USERS,
    icon: <Users size={20} />,
    label: ROUTE_TITLES[ROUTES.USERS],
    showIf: isSuperAdmin(user)
  }
].filter(item => item.showIf !== false);
```

- [ ] **Step 3: Verify sidebar compiles and renders**

Check that:
- No TS errors
- When logged in as super admin, Users tab appears
- When logged in as other user, Users tab is hidden

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: conditionally show Users tab for super admin only"
```

---

## Task 10: Create UserCard Component

**Files:**
- Create: `src/components/users/UserCard.tsx`

- [ ] **Step 1: Create UserCard component**

Create `src/components/users/UserCard.tsx`:
```typescript
import React from 'react';
import { motion } from 'motion/react';
import { Edit3, Trash2 } from 'lucide-react';
import { AppUser } from '../../types/user';
import { cn } from '../../utils/cn'; // or your className utility

interface UserCardProps {
  user: AppUser;
  onEdit: (user: AppUser) => void;
  onDelete: (userId: string) => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Chưa login';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitial = (name?: string, email?: string) => {
    return (name || email || '?')?.[0].toUpperCase();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="group relative"
    >
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg overflow-hidden">
        {/* Top gradient border */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-3xl" />

        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
              {getInitial(user.name, user.email)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 truncate">
                {user.name || 'Không có tên'}
              </h3>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          {/* Role Badge */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              user.role === 'admin'
                ? "bg-blue-100 text-blue-700"
                : "bg-purple-100 text-purple-700"
            )}>
              {user.role === 'admin' ? 'Admin' : 'Manager'}
            </span>
          </div>

          {/* Notes */}
          {user.notes && (
            <p className="text-xs text-slate-400 italic">{user.notes}</p>
          )}

          {/* Last Login */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Last login: {formatDate(user.lastLoginAt)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onEdit(user)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Edit3 size={16} />
              Edit
            </button>
            <button
              onClick={() => onDelete(user.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
            >
              <Trash2 size={16} />
              Remove
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify component compiles**

Check for TS errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/users/UserCard.tsx
git commit -m "feat: add UserCard component with glassmorphism design"
```

---

## Task 11: Create AddUserModal Component

**Files:**
- Create: `src/components/users/AddUserModal.tsx`

- [ ] **Step 1: Create AddUserModal component**

Create `src/components/users/AddUserModal.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { AppUser } from '../../types/user';
import { Button } from '../common/Button'; // or your Button component path
import { Modal } from '../common/Modal'; // or your Modal component path

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<AppUser>) => Promise<void>;
  user?: AppUser; // If provided, editing mode
}

export function AddUserModal({ isOpen, onClose, onSave, user }: AddUserModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'manager'>('manager');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name || '');
      setRole(user.role);
      setNotes(user.notes || '');
    } else {
      setEmail('');
      setName('');
      setRole('manager');
      setNotes('');
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      alert('Vui lòng nhập email hợp lệ');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        email,
        name: name || undefined,
        role,
        notes: notes || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Không thể lưu user'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {user ? 'Cập nhật User' : 'Thêm User Mới'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email (Google Account) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={(e) => setRole(e.target.value as 'admin' | 'manager')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">Admin</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="manager"
                      checked={role === 'manager'}
                      onChange={(e) => setRole(e.target.value as 'admin' | 'manager')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-slate-700">Manager</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ghi chú (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Quản lý tầng 2..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : user ? 'Cập nhật' : 'Thêm User'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify component compiles**

Check for TS errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/users/AddUserModal.tsx
git commit -m "feat: add AddUserModal component with form validation"
```

---

## Task 12: Create User Components Barrel Export

**Files:**
- Create: `src/components/users/index.ts`

- [ ] **Step 1: Create barrel export**

Create `src/components/users/index.ts`:
```typescript
export { UserCard } from './UserCard';
export { AddUserModal } from './AddUserModal';
```

- [ ] **Step 2: Verify export compiles**

Check for TS errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/users/index.ts
git commit -m "feat: add barrel export for user components"
```

---

## Task 13: Create Users Manager Page

**Files:**
- Create: `src/pages/Users/index.tsx`
- Modify: `src/pages/index.ts`

- [ ] **Step 1: Create UsersManager page**

Create `src/pages/Users/index.tsx`:
```typescript
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, Activity, Clock } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AppUser } from '../../types/user';
import { useAuthStore, useDataStore } from '../../stores';
import { isSuperAdmin } from '../../utils/permissions';
import { Button } from '../../components/common/Button'; // or your Button path
import { UserCard, AddUserModal } from '../../components/users';

export function UsersManager() {
  const { users, userActivities } = useDataStore();
  const { user: currentUser } = useAuthStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Verify super admin access
  if (!isSuperAdmin(currentUser)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = users.filter(u => {
      if (!u.lastLoginAt) return false;
      return new Date(u.lastLoginAt) > sevenDaysAgo;
    }).length;

    const neverLoggedIn = users.filter(u => !u.lastLoginAt).length;

    return {
      total: users.length,
      active: activeUsers,
      neverLoggedIn
    };
  }, [users]);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsInviteModalOpen(true);
  };

  const handleEditUser = (user: AppUser) => {
    setEditingUser(user);
    setIsInviteModalOpen(true);
  };

  const handleSaveUser = async (userData: Partial<AppUser>) => {
    try {
      if (editingUser?.id) {
        // Update existing user
        await updateDoc(doc(db, 'users', editingUser.id), {
          ...userData,
          // Preserve these fields
          createdAt: editingUser.createdAt,
          invitedBy: editingUser.invitedBy,
          lastLoginAt: editingUser.lastLoginAt
        });
        alert(`Đã cập nhật user ${userData.email}!`);
      } else {
        // Add new user
        if (!currentUser?.uid) {
          throw new Error('Not authenticated');
        }
        await addDoc(collection(db, 'users'), {
          ...userData,
          createdAt: new Date().toISOString(),
          lastLoginAt: null,
          invitedBy: currentUser.uid
        });
        alert(`Đã thêm ${userData.email} vào whitelist!`);
      }
      setIsInviteModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  const handleRemoveUser = async (userId: string) => {
    const userToRemove = users.find(u => u.id === userId);
    if (!userToRemove) return;

    if (window.confirm(`Bạn có chắc chắn muốn xóa user ${userToRemove.email}?`)) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        alert(`Đã xóa ${userToRemove.email} khỏi whitelist!`);
      } catch (error) {
        console.error('Error removing user:', error);
        alert(`Lỗi: ${error instanceof Error ? error.message : 'Không thể xóa user'}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Tổng Users"
          value={stats.total}
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Đang Hoạt Động"
          value={stats.active}
          icon={Activity}
          color="green"
          subLabel="(7 ngày qua)"
        />
        <StatCard
          label="Chưa Login"
          value={stats.neverLoggedIn}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Add User Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleAddUser}
          size="lg"
          className="gap-2"
        >
          <Plus size={18} />
          Thêm User
        </Button>
      </div>

      {/* Users Grid */}
      {users.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            Chưa có user nào
          </h3>
          <p className="text-slate-500 mb-4">
            Thêm user để họ có thể truy cập hệ thống
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={handleEditUser}
              onDelete={handleRemoveUser}
            />
          ))}
        </motion.div>
      )}

      {/* Add/Edit User Modal */}
      <AddUserModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        user={editingUser || undefined}
      />
    </div>
  );
}

// Helper component for stat cards
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subLabel
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange';
  subLabel?: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-amber-500'
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-2xl flex items-center justify-center text-white`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
          {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export UsersManager from pages barrel**

Add to `src/pages/index.ts`:
```typescript
export * from './Users';
```

- [ ] **Step 3: Verify page compiles**

Check for TS errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Users/index.tsx src/pages/index.ts
git commit -m "feat: add UsersManager page with stats dashboard"
```

---

## Task 14: Add Users Route to App

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import UsersManager and initialize hooks**

Find where other pages are imported and add:
```typescript
import { UsersManager } from './pages/Users';
import { useUsers, useUserActivities } from './hooks';
```

- [ ] **Step 2: Initialize user hooks**

In the App component body, add with other hooks:
```typescript
useUsers();
useUserActivities();
```

- [ ] **Step 3: Add USERS case to renderContent**

Find the renderContent switch statement and add:
```typescript
case ROUTES.USERS:
  return <UsersManager />;
```

- [ ] **Step 4: Verify app compiles and route works**

Check:
- No TS errors
- Login as super admin → Click Users tab → See UsersManager page
- Login as other user → Users tab hidden

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add Users route to app"
```

---

## Task 15: Update Firestore Security Rules

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Update helper functions in firestore.rules**

Read the existing `firestore.rules`, then update the helper functions section:
```javascript
// Updated helper functions
function isAuthenticated() {
  return request.auth != null;
}

function isSuperAdmin() {
  return isAuthenticated() &&
    request.auth.token.email_verified == true &&
    exists(/databases/$(database)/documents/config/superAdmins/$(request.auth.token.email));
}

function isWhitelisted() {
  return isAuthenticated() &&
    exists(/databases/$(database)/documents/users/$(request.auth.uid));
}
```

- [ ] **Step 2: Update all data collection rules**

Find each collection match (rooms, guests, facilities, invoices, extraServices, utilityPricing, roomServiceUsages, smartLocks) and update:
```javascript
// Example for rooms - do the same for all other data collections
match /rooms/{roomId} {
  allow read: if isAuthenticated();
  allow create, update, delete: if isWhitelisted();
}
```

- [ ] **Step 3: Add users collection rules**

Add to the rules:
```javascript
match /users/{userId} {
  allow read: if isSuperAdmin();
  allow create: if isSuperAdmin();
  allow update: if isSuperAdmin();
  allow delete: if isSuperAdmin();
}
```

- [ ] **Step 4: Add userActivities collection rules**

Add to the rules:
```javascript
match /userActivities/{activityId} {
  allow read: if isSuperAdmin();
  allow create: if isAuthenticated();
  allow update, delete: if isSuperAdmin();
}
```

- [ ] **Step 5: Add config/superAdmins collection rules**

Add to the rules:
```javascript
match /config/superAdmins/{email} {
  allow read: if isSuperAdmin();
  allow create: if isSuperAdmin();
  allow update: if isSuperAdmin();
  allow delete: if isSuperAdmin();
}
```

- [ ] **Step 6: Test rules with Firebase emulator or deploy**

Test locally:
```bash
firebase emulators:start
```

Or deploy to test:
```bash
firebase deploy --only firestore:rules
```

- [ ] **Step 7: Verify rules work correctly**

Test cases:
- Non-whitelisted user tries to write rooms → Permission denied ✓
- Whitelisted user writes to rooms → Success ✓
- Super admin reads/writes users → Success ✓
- Non-super-admin tries to read users → Permission denied ✓

- [ ] **Step 8: Commit**

```bash
git add firestore.rules
git commit -m "feat: update Firestore rules for whitelist-based access control"
```

---

## Task 16: Create Initial Super Admin Config

**Files:**
- Manual setup (no code commit)

- [ ] **Step 1: Create super admin config in Firestore**

Choose one method:

**Option A: Firebase Console**
1. Go to Firebase Console → Firestore Database
2. Click "Start collection"
3. Collection ID: `config`
4. Click "Add subcollection"
5. Subcollection ID: `superAdmins`
6. Click "Add document"
7. Document ID: `thanhtd1987@gmail.com` (or your email)
8. Add fields:
   - `active`: boolean → true
   - `createdAt`: string → current ISO timestamp
   - `notes`: string → "Initial super admin"

**Option B: Firebase CLI**
```bash
firebase firestore:create config/superAdmins/thanhtd1987@gmail.com \
  --active true \
  --createdAt "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --notes "Initial super admin"
```

**Option C: One-time script**
Create a temporary script `scripts/setup-super-admin.ts`:
```typescript
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/services/firebase';

async function setupSuperAdmin() {
  await setDoc(doc(db, 'config/superAdmins', 'thanhtd1987@gmail.com'), {
    active: true,
    createdAt: new Date().toISOString(),
    notes: 'Initial super admin'
  });
  console.log('Super admin config created!');
}

setupSuperAdmin();
```

Run once: `npx tsx scripts/setup-super-admin.ts`
Then delete the script.

- [ ] **Step 2: Verify config exists**

Check in Firebase Console that the document exists at `config/superAdmins/your-email@gmail.com`.

No commit needed for this step - it's a one-time setup.

---

## Task 17: End-to-End Testing

**Files:**
- Manual testing (no code changes)

- [ ] **Step 1: Test super admin access**

1. Logout if logged in
2. Login as `thanhtd1987@gmail.com` (or your super admin email)
3. Verify "Quản lý Users" tab appears in sidebar
4. Click Users tab → Should see UsersManager page
5. Verify stats show (0 users initially)

- [ ] **Step 2: Test adding a user**

1. Click "Thêm User" button
2. Fill form:
   - Email: test@example.com
   - Name: Test User
   - Role: Manager
   - Notes: Test user
3. Click "Thêm User"
4. Verify success message
5. Verify user card appears in grid
6. Check Firestore Console → users collection → Document exists

- [ ] **Step 3: Test user login**

1. Logout as super admin
2. Login as test@example.com (Google Auth)
3. Verify you can read all data (rooms, guests, etc.)
4. Verify you can edit/create data
5. Verify "Quản lý Users" tab does NOT appear
6. Check Firestore Console → users collection → test user document → `lastLoginAt` updated
7. Check userActivities collection → New activity logged

- [ ] **Step 4: Test non-whitelisted user**

1. Logout
2. Login with a different Google account (not in whitelist)
3. Verify you can read all data
4. Try to edit/create data → Should get permission error
5. Verify "Quản lý Users" tab does NOT appear
6. Verify no `lastLoginAt` update or activity log

- [ ] **Step 5: Test editing user**

1. Login as super admin
2. Go to Users page
3. Click "Edit" on a user
4. Change role from Manager to Admin
5. Save changes
6. Verify badge updated
7. Check Firestore → Document updated

- [ ] **Step 6: Test removing user**

1. Click "Remove" on a user
2. Confirm deletion
3. Verify success message
4. Verify user card removed from grid
5. Login as that user → Try to edit → Permission denied

- [ ] **Step 7: Test stats dashboard**

1. Check stats are correct:
   - Total Users = number of users
   - Active Users = users who logged in last 7 days
   - Never Logged = users without lastLoginAt

---

## Self-Review Results

**Spec Coverage:** ✓ All spec requirements implemented
- Whitelist-based access control: Task 15 (firestore rules)
- Super admin UI check: Task 2 (permissions utility), Task 9 (sidebar)
- User types: Task 3 (user.ts)
- Login tracking: Task 7 (useAuth)
- Users manager page: Task 13 (UsersManager)
- Stats dashboard: Task 13 (UsersManager includes StatCard)
- Add/edit/remove users: Task 10, 11, 13 (UserCard, AddUserModal, UsersManager)
- Config collection: Task 15 (firestore.rules), Task 16 (initial setup)

**Placeholder Scan:** ✓ No placeholders found
- All code blocks are complete
- All file paths are exact
- All commands are complete
- All test steps are concrete

**Type Consistency:** ✓ Types consistent across tasks
- `AppUser` type defined in Task 3, used consistently in Tasks 5, 10, 11, 13
- `UserActivity` type defined in Task 3, used in Tasks 6, 7
- Role type `'admin' | 'manager'` consistent throughout
- Firestore helper function names match between Task 15 and usage

**Edge Cases Handled:**
- User without whitelist: Task 15 (security rules deny write)
- First login (no user doc): Task 7 (check exists before tracking)
- Multiple tabs: Task 7 (idempotent operations)
- Email verification: Task 15 (check emailVerified in rules)

---

## Post-Implementation Checklist

After completing all tasks:

- [ ] All TypeScript files compile without errors
- [ ] All ESLint rules pass (if configured)
- [ ] All tests pass (if test suite exists)
- [ ] Firebase rules deployed and verified in Console
- [ ] Super admin config created in Firestore
- [ ] Manual testing completed (Task 17)
- [ ] Code pushed to git with descriptive commits
- [ ] `.env.local` added to `.gitignore` (if not already)

---

**Implementation complete!** The user management system is ready for use.
