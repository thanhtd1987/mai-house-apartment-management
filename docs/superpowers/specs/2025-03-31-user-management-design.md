# User Management System Design

**Date:** 2025-03-31
**Author:** Superpowers Brainstorming
**Status:** Approved

## Overview

Add a user management feature that allows the super admin (`thanhtd1987@gmail.com`) to:
- View all users in the system with stats
- Add new users to a whitelist via email only
- Assign roles (admin/manager)
- Track login activity and history
- Only visible to super admin in the UI

**Key Constraint:** Users login with Google Auth only. Super admin adds emails to a whitelist - users cannot self-register.

## User Roles

### Super Admin
- **Email:** `thanhtd1987@gmail.com` (hardcoded in Firestore rules)
- **Permissions:** Full access to all data + manage users
- **UI:** Sees "Quản lý Users" tab in sidebar

### Admin/Manager
- **Identification:** Email exists in `users` collection with role='admin' or 'manager'
- **Permissions:** Full read/write access to all data EXCEPT managing users
- **UI:** Does NOT see "Quản lý Users" tab
- **Note:** Admin and Manager have identical permissions - the role label is for semantic purposes only

### Unauthenticated Users
- **Permissions:** None - only sees login page

## Architecture

### Authentication Flow
1. User logs in with Google Auth
2. System checks if their document exists in `users` collection (whitelist check)
3. **If exists:** Full access to read/write all data collections
4. **If not exists:** Read-only access (can view data but cannot edit/create/delete)
5. Login activity is tracked ONLY for whitelisted users

### Access Control Layers
1. **Client-side (UI):** Permission checks hide/show the Users management page
2. **Server-side (Firestore Rules):** Security rules enforce whitelist validation for all write operations

## Data Model

### Collection: `users`
Stores the whitelist of approved users.

```typescript
{
  id: string;              // Firebase Auth UID
  email: string;           // User's email (Google account)
  role: 'admin' | 'manager';
  name?: string;           // Optional display name
  notes?: string;          // Optional notes for admin reference
  createdAt: string;       // ISO timestamp
  lastLoginAt?: string;    // ISO timestamp, null if never logged in
  invitedBy: string;       // UID of super admin who added them
}
```

**Indexes:** `createdAt` (desc), `email`

### Collection: `userActivities`
Stores login history for auditing.

```typescript
{
  id: string;              // Auto-generated document ID
  userId: string;          // Firebase Auth UID
  email: string;           // User's email
  loginTime: string;       // ISO timestamp
  userAgent?: string;      // Browser/device info
}
```

**Indexes:** `loginTime` (desc)

### Collection: `config/superAdmins`
Stores super admin email whitelist for flexible management.

```typescript
{
  id: string;              // Email address as document ID (e.g., "thanhtd1987@gmail.com")
  active: boolean;         // true = enabled, false = disabled
  createdAt: string;       // ISO timestamp
  notes?: string;          // Optional notes
}
```

**Indexes:** None (document ID = email)

## Firestore Security Rules

### Helper Functions

```javascript
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

### Collection Rules

#### Data Collections (rooms, guests, facilities, invoices, extraServices, utilityPricing, roomServiceUsages, smartLocks)
```javascript
match /{collection}/{documentId} {
  allow read: if isAuthenticated();
  allow create, update, delete: if isWhitelisted();
}
```

#### Users Collection (Super Admin Only)
```javascript
match /users/{userId} {
  allow read: if isSuperAdmin();
  allow create: if isSuperAdmin();
  allow update: if isSuperAdmin();
  allow delete: if isSuperAdmin();
}
```

#### User Activities Collection
```javascript
match /userActivities/{activityId} {
  allow read: if isSuperAdmin();
  allow create: if isAuthenticated();  // Any user can log their own login
  allow update, delete: if isSuperAdmin();
}
```

#### Config/SuperAdmins Collection (Super Admin Only)
```javascript
match /config/superAdmins/{email} {
  allow read: if isSuperAdmin();
  allow create: if isSuperAdmin();
  allow update: if isSuperAdmin();
  allow delete: if isSuperAdmin();
}
```

## UI Components

### Users Manager Page (`src/pages/Users/index.tsx`)

**Layout:**
1. Stats Dashboard (3 cards):
   - Total Users count
   - Active Users (logged in within last 7 days)
   - Never Logged In count

2. Add User Button (top-right)

3. Users Grid (responsive: 1/2/3 columns)
   - UserCard component for each user

4. Add User Modal

### UserCard Component (`src/components/users/UserCard.tsx`)

**Display:**
- User avatar (first letter of name/email)
- Name (or email if name not provided)
- Email address
- Role badge (Admin = blue, Manager = purple)
- Last login time (if available)

**Actions:**
- Edit role (Admin ↔ Manager)
- Remove user (with confirmation)

**Styling:**
- Glassmorphism card design matching existing cards
- Gradient top border
- Framer Motion hover effects

### AddUserModal Component (`src/components/users/AddUserModal.tsx`)

**Fields:**
- Email (required, must be valid email format)
- Name (optional)
- Role selection: Admin or Manager (radio buttons)
- Notes (optional textarea)

**Behavior:**
- Form validation (email required)
- Creates document in `users` collection
- Does NOT create Firebase Auth account
- Success message + close modal on success
- Error handling with user-friendly messages

## Implementation Details

### Permission Utility (`src/utils/permissions.ts`)

```typescript
import { User } from 'firebase/auth';

export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL;

export function isSuperAdmin(user: User | null): boolean {
  return user?.email === SUPER_ADMIN_EMAIL && user?.emailVerified === true;
}
```

### Environment Variables (`.env.local`)

```bash
# Super Admin Email - must match email in config/superAdmins collection
VITE_SUPER_ADMIN_EMAIL="thanhtd1987@gmail.com"
```

**Note:** This environment variable is used for client-side UI checks only. Server-side security is enforced by Firestore rules using the `config/superAdmins` collection.

### Sidebar Conditional Rendering (`src/components/layout/Sidebar.tsx`)

```typescript
const { user } = useAuthStore();

const NAV_ITEMS = [
  // ... existing items
  {
    id: ROUTES.USERS,
    icon: <Users size={20} />,
    label: ROUTE_TITLES[ROUTES.USERS],
    showIf: isSuperAdmin(user)  // Only show for super admin
  }
].filter(item => item.showIf !== false);
```

### Login Activity Tracking (`src/hooks/useAuth.ts`)

When user logs in:
1. Check if user document exists in `users` collection
2. **If exists:**
   - Update `lastLoginAt` field
   - Create entry in `userActivities` collection
3. **If not exists:**
   - Do nothing (don't track unapproved users)

```typescript
if (u) {
  try {
    const userDoc = await getDoc(doc(db, 'users', u.uid));

    if (userDoc.exists()) {
      await updateDoc(doc(db, 'users', u.uid), {
        lastLoginAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'userActivities'), {
        userId: u.uid,
        email: u.email,
        loginTime: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    }
  } catch (error) {
    console.error('Error tracking login:', error);
    // Don't throw - login should still succeed
  }
}
```

## Edge Cases & Handling

### User Logs In Without Whitelist
- **Result:** Can read data, cannot write
- **UI Experience:** Normal app functionality, but edit/add/delete buttons show permission errors
- **Resolution:** Super admin must add them to whitelist first

### Super Admin Deletes User
- User document removed from `users` collection
- User loses write permissions immediately on next operation
- Previously created data remains (not cascade deleted)
- User still authenticated via Firebase Auth, but can only read

### Role Change (Admin ↔ Manager)
- Simple field update in `users` collection
- Permissions remain identical (both have full data access)
- Role badge updates in UI

### Never Logged In Users
- `lastLoginAt` field is `null`
- Dashboard shows count separately
- No entries in `userActivities`

### Multiple Tab Logins
- Each tab triggers `onAuthStateChanged`
- Firestore operations are idempotent (safe to run multiple times)
- No duplicate issues

### Email Verification
- Google Auth automatically verifies emails
- `emailVerified` always `true` for Google provider
- Security rules check this for extra safety

## Initial Setup

### 1. Create Super Admin Config Document

Before deploying the feature, create the initial super admin document in Firestore:

**Option A: Firebase Console**
1. Go to Firebase Console → Firestore Database
2. Create collection: `config`
3. Create sub-collection: `superAdmins`
4. Add document with ID = your email: `thanhtd1987@gmail.com`
5. Document data:
```javascript
{
  active: true,
  createdAt: "2025-03-31T10:00:00Z",
  notes: "Initial super admin"
}
```

**Option B: Firebase CLI**
```bash
firebase firestore:create config/superAdmins/thanhtd1987@gmail.com \
  --active true \
  --createdAt "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --notes "Initial super admin"
```

**Option C: Via App Code (one-time script)**
```typescript
import { doc, setDoc } from 'firebase/firestore';
import { db } from './services/firebase';

await setDoc(doc(db, 'config/superAdmins', 'thanhtd1987@gmail.com'), {
  active: true,
  createdAt: new Date().toISOString(),
  notes: 'Initial super admin'
});
```

### 2. Update Environment Variable

Add to `.env.local`:
```bash
VITE_SUPER_ADMIN_EMAIL="thanhtd1987@gmail.com"
```

### 3. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

Verify rules are active in Firebase Console → Firestore → Rules.

## Files to Create

### New Files
- `src/utils/permissions.ts` - Permission check utilities
- `src/types/user.ts` - User and UserActivity type definitions
- `src/hooks/useUsers.ts` - Users data fetching hook
- `src/hooks/useUserActivities.ts` - Activities data fetching hook
- `src/components/users/UserCard.tsx` - User card component
- `src/components/users/AddUserModal.tsx` - Add user modal
- `src/components/users/index.ts` - Barrel export
- `src/pages/Users/index.tsx` - Users manager page

## Files to Modify

### Routes & Navigation
- `src/constants/routes.ts` - Add USERS route and title
- `src/components/layout/Sidebar.tsx` - Conditional Users nav item
- `src/App.tsx` - Add Users route case, initialize hooks

### Types & State
- `src/types/index.ts` - Export user types
- `src/stores/dataStore.ts` - Add users and userActivities state

### Authentication
- `src/hooks/useAuth.ts` - Track login activity for whitelisted users

### Security
- `firestore.rules` - Add `isWhitelisted()` helper and update all collection rules

## Testing Checklist

### Access Control
- [ ] Login as super admin → "Quản lý Users" tab visible
- [ ] Login as whitelisted user → Tab hidden, can read/write data
- [ ] Login as non-whitelisted user → Tab hidden, can only read data
- [ ] Direct URL access to /users as non-super-admin → Access denied

### User Management
- [ ] Add new user → Document created in `users` collection
- [ ] Add user with invalid email → Validation error
- [ ] Change user role → Document updated, badge changes
- [ ] Remove user → Document deleted, user loses write access

### Login Tracking
- [ ] Whitelisted user logs in → `lastLoginAt` updated, activity logged
- [ ] Non-whitelisted user logs in → No tracking occurs
- [ ] View activity table → Shows recent logins
- [ ] Stats dashboard → Shows correct counts

### Security Rules
- [ ] Non-whitelisted user tries to write rooms → Permission denied
- [ ] Non-whitelisted user tries to write guests → Permission denied
- [ ] Whitelisted user writes to any collection → Success
- [ ] Non-super-admin tries to read `users` collection → Permission denied
- [ ] Non-super-admin tries to write to `users` collection → Permission denied
- [ ] Non-super-admin tries to read `config/superAdmins` → Permission denied
- [ ] Non-super-admin tries to write to `config/superAdmins` → Permission denied
- [ ] Super admin can access `config/superAdmins` → Success

## Future Enhancements (Out of Scope)

- Email notifications when user is added
- User-request workflow (users can request access)
- Role-based permissions (manager vs admin differences)
- Bulk user import from CSV
- User deactivation (soft delete)
- Audit log for all admin actions
- Session management (force logout)
- Password reset for non-Google auth (if added later)

## Dependencies

No additional dependencies required. Uses existing:
- `firebase` (Firestore, Auth)
- `zustand` (state management)
- `motion` / `framer-motion` (animations)
- `lucide-react` (icons)
- Existing UI components (Button, Modal, etc.)
