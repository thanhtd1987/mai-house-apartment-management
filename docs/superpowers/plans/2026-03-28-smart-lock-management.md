# Smart Lock Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build smart lock management for apartment rooms - track passwords, expiry dates, and battery replacements with in-app notifications.

**Architecture:** Separate SmartLock entity referenced from Room, Firebase Firestore for persistence, React hooks for real-time updates, modal-based UI for management.

**Tech Stack:** React 19, TypeScript, Firebase Firestore, Zustand (useDataStore), Tailwind CSS, Lucide React icons, Motion (Framer Motion)

---

## Task 1: Add SmartLock Type Definition

**Files:**
- Create: `src/types/smartLock.ts`

- [ ] **Step 1: Create SmartLock type definition**

```typescript
export interface SmartLock {
  id: string;
  roomId: string;              // Reference to Room
  password: string;            // Current password
  passwordExpiryDate: string;  // Password expiration date (ISO string)

  // Battery tracking
  batteryReplacementDate: string;      // Last battery replacement date (ISO string)
  nextBatteryReplacementDate: string;  // Next replacement date (ISO string, +45 days)

  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Export from types index**

Add to `src/types/index.ts`:
```typescript
export * from './smartLock';
```

- [ ] **Step 3: Commit**

```bash
git add src/types/smartLock.ts src/types/index.ts
git commit -m "feat: add SmartLock type definition"
```

---

## Task 2: Update Room Type with Smart Lock Fields

**Files:**
- Modify: `src/types/room.ts`

- [ ] **Step 1: Add smart lock fields to Room interface**

Add these two fields to the existing Room interface (after existing fields, before the closing brace):
```typescript
  // ... existing fields

  // Smart lock reference (optional)
  smartLockId?: string;        // Reference to SmartLock
  hasSmartLock?: boolean;      // Quick check without populating
}
```

The Room interface should now look like:
```typescript
export interface Room {
  id: string;
  number: string;
  type: 'single' | 'double';
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance';
  price: number;
  lastElectricityMeter: number;
  meterId?: string;
  paymentStatus: 'paid' | 'unpaid' | 'debt';
  guests?: RoomGuest[];
  currentGuestId?: string;
  facilities?: string[];

  // Smart lock reference (optional)
  smartLockId?: string;
  hasSmartLock?: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/room.ts
git commit -m "feat: add smart lock fields to Room type"
```

---

## Task 3: Add Date Calculation Utilities

**Files:**
- Modify: `src/utils/date.ts`

- [ ] **Step 1: Add date calculation functions**

Add these functions to the end of `src/utils/date.ts`:
```typescript
/**
 * Add days to a date
 * @param dateString - Base date string or Date object
 * @param days - Number of days to add (can be negative)
 * @returns New date with days added
 */
export function addDays(dateString: string | Date, days: number): Date {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 * @param dateString - Base date string or Date object
 * @param months - Number of months to add (can be negative)
 * @returns New date with months added
 */
export function addMonths(dateString: string | Date, months: number): Date {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Check if a date is within N days from now
 * @param dateString - Date string or Date object to check
 * @param days - Number of days threshold
 * @returns True if date is within the threshold
 */
export function isWithinDays(dateString: string | Date, days: number): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

/**
 * Check if a date is before today
 * @param dateString - Date string or Date object to check
 * @returns True if date is in the past
 */
export function isBeforeToday(dateString: string | Date): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/date.ts
git commit -m "feat: add date calculation utilities for smart lock management"
```

---

## Task 4: Create SmartLock Firebase Service

**Files:**
- Create: `src/services/smartLockService.ts`
- Modify: `src/services/index.ts`

- [ ] **Step 1: Create smart lock service**

Create `src/services/smartLockService.ts`:
```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { SmartLock } from '../types';

const COLLECTION_NAME = 'smartLocks';

/**
 * Create a new smart lock
 */
export async function createSmartLock(roomId: string, data: Omit<SmartLock, 'id' | 'roomId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    roomId,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
}

/**
 * Update an existing smart lock
 */
export async function updateSmartLock(lockId: string, data: Partial<SmartLock>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, lockId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Delete a smart lock
 */
export async function deleteSmartLock(lockId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, lockId);
  await deleteDoc(docRef);
}

/**
 * Get smart lock by room ID
 */
export async function getSmartLockByRoom(roomId: string): Promise<SmartLock | null> {
  const q = query(collection(db, COLLECTION_NAME), where('roomId', '==', roomId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as SmartLock;
}

/**
 * Get all smart locks
 */
export async function getAllSmartLocks(): Promise<SmartLock[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SmartLock));
}

/**
 * Get smart locks with passwords expiring within threshold days
 */
export async function getExpiringPasswords(daysThreshold: number = 7): Promise<SmartLock[]> {
  const allLocks = await getAllSmartLocks();
  const now = new Date();
  const thresholdDate = new Date(now);
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  return allLocks.filter(lock => {
    const expiryDate = new Date(lock.passwordExpiryDate);
    return expiryDate <= thresholdDate;
  });
}

/**
 * Get smart locks needing battery replacement (today or past due)
 */
export async function getLocksNeedingBatteryReplacement(): Promise<SmartLock[]> {
  const allLocks = await getAllSmartLocks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return allLocks.filter(lock => {
    const replacementDate = new Date(lock.nextBatteryReplacementDate);
    replacementDate.setHours(0, 0, 0, 0);
    return replacementDate <= today;
  });
}
```

- [ ] **Step 2: Export from services index**

Add to `src/services/index.ts`:
```typescript
export * from './smartLockService';
```

- [ ] **Step 3: Commit**

```bash
git add src/services/smartLockService.ts src/services/index.ts
git commit -m "feat: add SmartLock Firebase service"
```

---

## Task 5: Create useSmartLocks Hook

**Files:**
- Create: `src/hooks/useSmartLocks.ts`
- Modify: `src/hooks/index.ts`

- [ ] **Step 1: Create useSmartLocks hook**

Create `src/hooks/useSmartLocks.ts`:
```typescript
import { useEffect, useState, useCallback } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../services';
import { SmartLock } from '../types';
import { useDataStore } from '../stores';
import * as smartLockService from '../services/smartLockService';

export function useSmartLocks() {
  const { setSmartLocks } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Real-time subscription to all smart locks
  useEffect(() => {
    const unsubLocks = onSnapshot(collection(db, 'smartLocks'), (snap) => {
      const locks = snap.docs.map(d => ({ id: d.id, ...d.data() } as SmartLock));
      setSmartLocks(locks);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Smart locks snapshot error:', err);
      setError(err as Error);
      setLoading(false);
    });

    return () => unsubLocks();
  }, [setSmartLocks]);

  // Create lock for a room
  const createLock = useCallback(async (roomId: string, data: Omit<SmartLock, 'id' | 'roomId' | 'createdAt' | 'updatedAt'>) => {
    return await smartLockService.createSmartLock(roomId, data);
  }, []);

  // Update lock password
  const updatePassword = useCallback(async (lockId: string, password: string, passwordExpiryDate: string) => {
    await smartLockService.updateSmartLock(lockId, { password, passwordExpiryDate });
  }, []);

  // Update lock battery
  const updateBattery = useCallback(async (lockId: string, batteryReplacementDate: string, nextBatteryReplacementDate: string) => {
    await smartLockService.updateSmartLock(lockId, { batteryReplacementDate, nextBatteryReplacementDate });
  }, []);

  // Delete lock
  const deleteLock = useCallback(async (lockId: string) => {
    await smartLockService.deleteSmartLock(lockId);
  }, []);

  // Get lock by room ID
  const getLockByRoomId = useCallback(async (roomId: string): Promise<SmartLock | null> => {
    return await smartLockService.getSmartLockByRoom(roomId);
  }, []);

  // Check for locks needing attention
  const checkExpiringLocks = useCallback(async () => {
    const [expiringPasswords, batteryIssues] = await Promise.all([
      smartLockService.getExpiringPasswords(7),
      smartLockService.getLocksNeedingBatteryReplacement()
    ]);
    return { expiringPasswords, batteryIssues };
  }, []);

  return {
    loading,
    error,
    createLock,
    updatePassword,
    updateBattery,
    deleteLock,
    getLockByRoomId,
    checkExpiringLocks
  };
}
```

- [ ] **Step 2: Export from hooks index**

Add to `src/hooks/index.ts`:
```typescript
export * from './useSmartLocks';
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSmartLocks.ts src/hooks/index.ts
git commit -m "feat: add useSmartLocks hook"
```

---

## Task 6: Update dataStore with SmartLocks State

**Files:**
- Modify: `src/stores/dataStore.ts`

- [ ] **Step 1: Add smartLocks to dataStore**

Add `smartLocks` state and setter to the existing dataStore.

Read the file first to see the current structure, then add:

```typescript
// In the store interface definition
interface DataStore {
  // ... existing fields
  smartLocks: SmartLock[];
  setSmartLocks: (locks: SmartLock[]) => void;
}

// In the store implementation
export const useDataStore = create<DataStore>((set) => ({
  // ... existing state
  smartLocks: [],

  // ... existing setters
  setSmartLocks: (locks) => set({ smartLocks: locks }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/dataStore.ts
git commit -m "feat: add smartLocks state to dataStore"
```

---

## Task 7: Create SetupSmartLockModal Component

**Files:**
- Create: `src/components/smartLocks/SetupSmartLockModal.tsx`
- Create: `src/components/smartLocks/index.ts`

- [ ] **Step 1: Create SetupSmartLockModal component**

Create `src/components/smartLocks/SetupSmartLockModal.tsx`:
```typescript
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Calendar } from 'lucide-react';
import { addDays } from '../../utils';

interface SetupSmartLockModalProps {
  roomId: string;
  roomNumber: string;
  onSubmit: (data: {
    password: string;
    passwordExpiryDate: string;
    batteryReplacementDate?: string;
    nextBatteryReplacementDate?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function SetupSmartLockModal({ roomId, roomNumber, onSubmit, onClose }: SetupSmartLockModalProps) {
  const [password, setPassword] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [batteryDate, setBatteryDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim() || !expiryDate) {
      alert('Vui lòng nhập mật khẩu và ngày hết hạn');
      return;
    }

    setSubmitting(true);

    try {
      const data: any = {
        password: password.trim(),
        passwordExpiryDate: new Date(expiryDate).toISOString()
      };

      if (batteryDate) {
        data.batteryReplacementDate = new Date(batteryDate).toISOString();
        data.nextBatteryReplacementDate = addDays(batteryDate, 45).toISOString();
      }

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error setting up smart lock:', error);
      alert('Không thể thiết lập khóa cửa. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Lock size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Thêm Smart Lock</h2>
                <p className="text-white/80 text-sm">Phòng {roomNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mật khẩu khóa *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          {/* Password Expiry Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ngày hết hạn mật khẩu *
            </label>
            <div className="relative">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Battery Replacement Date (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ngày thay pin gần nhất (tùy chọn)
            </label>
            <div className="relative">
              <input
                type="date"
                value={batteryDate}
                onChange={(e) => setBatteryDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            {batteryDate && (
              <p className="text-xs text-slate-500 mt-1">
                Ngày cần thay tiếp theo: {new Date(addDays(batteryDate, 45)).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Create smartLocks component index**

Create `src/components/smartLocks/index.ts`:
```typescript
export * from './SetupSmartLockModal';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/smartLocks/SetupSmartLockModal.tsx src/components/smartLocks/index.ts
git commit -m "feat: add SetupSmartLockModal component"
```

---

## Task 8: Create UpdatePasswordModal Component

**Files:**
- Modify: `src/components/smartLocks/index.ts`
- Create: `src/components/smartLocks/UpdatePasswordModal.tsx`

- [ ] **Step 1: Create UpdatePasswordModal component**

Create `src/components/smartLocks/UpdatePasswordModal.tsx`:
```typescript
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Lock } from 'lucide-react';

interface UpdatePasswordModalProps {
  lockId: string;
  currentPassword: string;
  onSubmit: (lockId: string, password: string, expiryDate: string) => Promise<void>;
  onClose: () => void;
}

export function UpdatePasswordModal({ lockId, currentPassword, onSubmit, onClose }: UpdatePasswordModalProps) {
  const [password, setPassword] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryType, setExpiryType] = useState<'date' | '3months' | '6months'>('date');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim() || !expiryDate) {
      alert('Vui lòng nhập mật khẩu và ngày hết hạn');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(lockId, password.trim(), new Date(expiryDate).toISOString());
      onClose();
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Không thể cập nhật mật khẩu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateExpiryDate = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  };

  const handleExpiryTypeChange = (type: 'date' | '3months' | '6months') => {
    setExpiryType(type);
    if (type === '3months') {
      setExpiryDate(calculateExpiryDate(3));
    } else if (type === '6months') {
      setExpiryDate(calculateExpiryDate(6));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Lock size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Cập nhật Password</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mật khẩu mới *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                placeholder="Nhập mật khẩu mới"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          {/* Expiry Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Loại ngày hết hạn
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleExpiryTypeChange('date')}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  expiryType === 'date'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Ngày cụ thể
              </button>
              <button
                type="button"
                onClick={() => handleExpiryTypeChange('3months')}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  expiryType === '3months'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                3 tháng
              </button>
              <button
                type="button"
                onClick={() => handleExpiryTypeChange('6months')}
                className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                  expiryType === '6months'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                6 tháng
              </button>
            </div>
          </div>

          {/* Expiry Date */}
          {expiryType === 'date' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Ngày hết hạn *
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                required
              />
            </div>
          )}

          {expiryType !== 'date' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Ngày hết hạn ({expiryType === '3months' ? '3' : '6'} tháng)
              </label>
              <input
                type="date"
                value={expiryDate}
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Export from index**

Add to `src/components/smartLocks/index.ts`:
```typescript
export * from './UpdatePasswordModal';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/smartLocks/UpdatePasswordModal.tsx src/components/smartLocks/index.ts
git commit -m "feat: add UpdatePasswordModal component"
```

---

## Task 9: Create UpdateBatteryModal Component

**Files:**
- Modify: `src/components/smartLocks/index.ts`
- Create: `src/components/smartLocks/UpdateBatteryModal.tsx`

- [ ] **Step 1: Create UpdateBatteryModal component**

Create `src/components/smartLocks/UpdateBatteryModal.tsx`:
```typescript
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Battery } from 'lucide-react';
import { addDays } from '../../utils';

interface UpdateBatteryModalProps {
  lockId: string;
  onSubmit: (lockId: string, batteryDate: string, nextBatteryDate: string) => Promise<void>;
  onClose: () => void;
}

export function UpdateBatteryModal({ lockId, onSubmit, onClose }: UpdateBatteryModalProps) {
  const [batteryDate, setBatteryDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!batteryDate) {
      alert('Vui lòng chọn ngày thay pin');
      return;
    }

    setSubmitting(true);

    try {
      const nextDate = addDays(batteryDate, 45);
      await onSubmit(lockId, new Date(batteryDate).toISOString(), nextDate.toISOString());
      onClose();
    } catch (error) {
      console.error('Error updating battery:', error);
      alert('Không thể cập nhật thông tin pin. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const nextDate = batteryDate ? addDays(batteryDate, 45) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Battery size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Cập nhật Pin</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Pin cần được thay thế sau mỗi 45 ngày. Hệ thống sẽ tự động tính toán ngày cần thay tiếp theo.
          </p>

          {/* Battery Replacement Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ngày thay pin gần nhất *
            </label>
            <input
              type="date"
              value={batteryDate}
              onChange={(e) => setBatteryDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              required
            />
          </div>

          {/* Next Replacement Date (Auto-calculated) */}
          {nextDate && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm font-semibold text-blue-700 mb-1">
                Ngày cần thay tiếp theo
              </p>
              <p className="text-lg font-bold text-blue-900">
                {nextDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                (45 ngày sau ngày thay pin)
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Export from index**

Add to `src/components/smartLocks/index.ts`:
```typescript
export * from './UpdateBatteryModal';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/smartLocks/UpdateBatteryModal.tsx src/components/smartLocks/index.ts
git commit -m "feat: add UpdateBatteryModal component"
```

---

## Task 10: Create DeleteLockConfirmationModal Component

**Files:**
- Modify: `src/components/smartLocks/index.ts`
- Create: `src/components/smartLocks/DeleteLockConfirmationModal.tsx`

- [ ] **Step 1: Create DeleteLockConfirmationModal component**

Create `src/components/smartLocks/DeleteLockConfirmationModal.tsx`:
```typescript
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteLockConfirmationModalProps {
  roomNumber: string;
  hasActiveGuests: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function DeleteLockConfirmationModal({ roomNumber, hasActiveGuests, onConfirm, onClose }: DeleteLockConfirmationModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (hasActiveGuests) {
      alert('Không thể xóa khóa khi phòng đang có khách.');
      return;
    }

    setSubmitting(true);

    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting lock:', error);
      alert('Không thể xóa khóa. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Xác nhận xóa</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
            <p className="text-rose-800 font-semibold">
              ⚠️ Bạn có chắc chắn muốn xóa smart lock của phòng {roomNumber}?
            </p>
            <p className="text-rose-700 text-sm mt-2">
              Thao tác này sẽ xóa toàn bộ thông tin mật khẩu và lịch sử pin. Hành động này không thể hoàn tác.
            </p>
          </div>

          {hasActiveGuests && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-amber-800 font-semibold">
                🚫 Phòng hiện đang có khách lưu trú
              </p>
              <p className="text-amber-700 text-sm mt-2">
                Vui lòng checkout khách trước khi xóa khóa.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting || hasActiveGuests}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-semibold hover:from-rose-700 hover:to-red-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Đang xóa...' : 'Xóa khóa'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Export from index**

Add to `src/components/smartLocks/index.ts`:
```typescript
export * from './DeleteLockConfirmationModal';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/smartLocks/DeleteLockConfirmationModal.tsx src/components/smartLocks/index.ts
git commit -m "feat: add DeleteLockConfirmationModal component"
```

---

## Task 11: Update RoomCard with Smart Lock Indicator

**Files:**
- Modify: `src/components/rooms/RoomCard.tsx`

- [ ] **Step 1: Add smart lock indicator to RoomCard**

Add the smart lock indicator after the room status badge in the header section. Find this section (around line 43-50):

```tsx
<div className="flex items-center gap-3 mb-2">
  <h3 className="text-2xl font-bold text-slate-800">Phòng {room.number}</h3>
  <span className={cn(
    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
    config.color
  )}>
    {config.label}
  </span>
</div>
```

Add the lock indicator after the status badge:

```tsx
<div className="flex items-center gap-3 mb-2">
  <h3 className="text-2xl font-bold text-slate-800">Phòng {room.number}</h3>
  <span className={cn(
    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
    config.color
  )}>
    {config.label}
  </span>
  {room.hasSmartLock && (
    <span title="Có smart lock">
      🔒
    </span>
  )}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/rooms/RoomCard.tsx
git commit -m "feat: add smart lock indicator to RoomCard"
```

---

## Task 12: Update RoomDetails with Smart Lock Tab

**Files:**
- Modify: `src/components/rooms/RoomDetails.tsx`

- [ ] **Step 1: Add smart lock tab type to TabType**

Add 'smartLock' to the TabType union (around line 31):

```typescript
type TabType = 'overview' | 'services' | 'facilities' | 'history' | 'smartLock';
```

- [ ] **Step 2: Add smart lock tab to tabs array**

Add smart lock tab to the tabs array (around line 51-56):

```typescript
const tabs: { key: TabType; label: string; icon: any }[] = [
  { key: 'overview', label: 'Tổng quan', icon: Home },
  { key: 'services', label: 'Dịch vụ thêm', icon: Receipt },
  { key: 'facilities', label: 'Cơ sở vật chất', icon: Building2 },
  { key: 'smartLock', label: 'Smart Lock', icon: Shield },
  { key: 'history', label: 'Lịch sử', icon: History }
];
```

- [ ] **Step 3: Add Shield icon import**

Add Shield to the imports (around line 3):

```typescript
import { X, Users, Calendar, ChevronDown, ChevronUp, UserPlus, ArrowRight, LogOut, Home, Settings, History, Building2, Crown, Shield, Edit3, Trash2, Receipt, FileText } from 'lucide-react';
```

- [ ] **Step 4: Add smart lock tab content**

Add the smart lock tab content in the AnimatePresence section (before the closing `</AnimatePresence>` tag, around line 500):

```tsx
{activeTab === 'smartLock' && (
  <motion.div
    key="smartLock"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="space-y-6"
  >
    <SmartLockTabContent room={room} guests={guests} />
  </motion.div>
)}
```

- [ ] **Step 5: Create SmartLockTabContent component**

Add this component before the RoomDetails component (around line 30, after the interfaces):

```typescript
interface SmartLockTabContentProps {
  room: Room;
  guests: Guest[];
}

function SmartLockTabContent({ room, guests }: SmartLockTabContentProps) {
  const { smartLocks } = useDataStore();
  const { updatePassword, updateBattery, deleteLock, createLock } = useSmartLocks();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
  const [showUpdateBatteryModal, setShowUpdateBatteryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const lock = smartLocks.find(l => l.roomId === room.id);
  const hasGuests = room.guests && room.guests.length > 0;

  if (!room.hasSmartLock || !lock) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl">
        <Shield size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600 font-semibold text-lg mb-2">Phòng chưa có Smart Lock</p>
        <p className="text-slate-500 mb-6">Thêm khóa cửa thông minh để quản lý password và pin</p>
        <button
          onClick={() => setShowSetupModal(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-colors"
        >
          <Shield size={18} />
          Thêm Smart Lock
        </button>
        {showSetupModal && (
          <SetupSmartLockModal
            roomId={room.id}
            roomNumber={room.number}
            onSubmit={async (data) => {
              await createLock(room.id, data);
              await updateDoc(doc(db, 'rooms', room.id), { hasSmartLock: true });
            }}
            onClose={() => setShowSetupModal(false)}
          />
        )}
      </div>
    );
  }

  const expiryDate = new Date(lock.passwordExpiryDate);
  const isExpired = expiryDate < new Date();
  const isExpiringSoon = !isExpired && isWithinDays(lock.passwordExpiryDate, 7);

  const nextBatteryDate = new Date(lock.nextBatteryReplacementDate);
  const needsBattery = nextBatteryDate <= new Date();

  return (
    <div className="space-y-6">
      {/* Password Section */}
      <div className={cn(
        "rounded-3xl p-6 border",
        isExpired ? "bg-rose-50 border-rose-200" :
        isExpiringSoon ? "bg-amber-50 border-amber-200" :
        "bg-green-50 border-green-200"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Mật khẩu khóa</h3>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold",
            isExpired ? "bg-rose-200 text-rose-800" :
            isExpiringSoon ? "bg-amber-200 text-amber-800" :
            "bg-green-200 text-green-800"
          )}>
            {isExpired ? 'Đã hết hạn' : isExpiringSoon ? 'Sắp hết hạn' : 'Hợp lệ'}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <input
            type="password"
            value={lock.password}
            readOnly
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white font-mono text-lg"
          />
          <button
            onClick={() => navigator.clipboard.writeText(lock.password)}
            className="px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
          >
            Sao chép
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Ngày hết hạn:</span>
          <span className={cn(
            "font-semibold",
            isExpired ? "text-rose-700" : isExpiringSoon ? "text-amber-700" : "text-green-700"
          )}>
            {formatDate(lock.passwordExpiryDate)}
          </span>
        </div>

        <div className="mt-4">
          <button
            onClick={() => setShowUpdatePasswordModal(true)}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Cập nhật password
          </button>
        </div>
      </div>

      {/* Battery Section */}
      <div className={cn(
        "rounded-3xl p-6 border",
        needsBattery ? "bg-rose-50 border-rose-200" : "bg-blue-50 border-blue-200"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Pin</h3>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold",
            needsBattery ? "bg-rose-200 text-rose-800" : "bg-blue-200 text-blue-800"
          )}>
            {needsBattery ? 'Cần thay thế' : 'OK'}
          </span>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Ngày thay gần nhất:</span>
            <span className="font-semibold text-slate-800">
              {formatDate(lock.batteryReplacementDate)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Ngày cần thay tiếp:</span>
            <span className={cn(
              "font-semibold",
              needsBattery ? "text-rose-700" : "text-blue-700"
            )}>
              {formatDate(lock.nextBatteryReplacementDate)}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowUpdateBatteryModal(true)}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Cập nhật ngày thay pin
        </button>
      </div>

      {/* Delete Section */}
      <div className="rounded-3xl p-6 border border-slate-200 bg-slate-50">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Xóa Smart Lock</h3>
        <p className="text-slate-600 text-sm mb-4">
          Xóa khóa cửa thông minh khỏi phòng này
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full px-4 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors"
        >
          Xóa khóa
        </button>
      </div>

      {/* Modals */}
      {showUpdatePasswordModal && (
        <UpdatePasswordModal
          lockId={lock.id}
          currentPassword={lock.password}
          onSubmit={updatePassword}
          onClose={() => setShowUpdatePasswordModal(false)}
        />
      )}

      {showUpdateBatteryModal && (
        <UpdateBatteryModal
          lockId={lock.id}
          onSubmit={updateBattery}
          onClose={() => setShowUpdateBatteryModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteLockConfirmationModal
          roomNumber={room.number}
          hasActiveGuests={hasGuests}
          onConfirm={async () => {
            await deleteLock(lock.id);
            await updateDoc(doc(db, 'rooms', room.id), {
              hasSmartLock: false,
              smartLockId: null
            });
          }}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Add required imports**

Add these imports at the top of the file (around line 1-8):

```typescript
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Shield } from 'lucide-react';
import { useSmartLocks } from '../../hooks';
import { useDataStore } from '../../stores';
import { cn, formatDate, isWithinDays } from '../../utils';
import { SetupSmartLockModal, UpdatePasswordModal, UpdateBatteryModal, DeleteLockConfirmationModal } from '../../components/smartLocks';
```

- [ ] **Step 7: Commit**

```bash
git add src/components/rooms/RoomDetails.tsx
git commit -m "feat: add smart lock tab to RoomDetails"
```

---

## Task 13: Add SMART_LOCKS Route

**Files:**
- Modify: `src/constants/routes.ts`

- [ ] **Step 1: Add SMART_LOCKS route constant**

Add SMART_LOCKS to the ROUTES object (after SERVICES, before the closing brace):

```typescript
export const ROUTES = {
  DASHBOARD: 'dashboard',
  ROOMS: 'rooms',
  GUESTS: 'guests',
  FACILITIES: 'facilities',
  INVOICES: 'invoices',
  UTILITY_PRICING: 'utility-pricing',
  SERVICES: 'services',
  SMART_LOCKS: 'smart-locks'
} as const;
```

- [ ] **Step 2: Add SMART_LOCKS title**

Add SMART_LOCKS title to ROUTE_TITLES (after SERVICES):

```typescript
export const ROUTE_TITLES = {
  [ROUTES.DASHBOARD]: 'Tổng quan',
  [ROUTES.ROOMS]: 'Phòng & Trạng thái',
  [ROUTES.GUESTS]: 'Khách lưu trú',
  [ROUTES.FACILITIES]: 'Cơ sở vật chất',
  [ROUTES.INVOICES]: 'Hóa đơn & Thanh toán',
  [ROUTES.UTILITY_PRICING]: 'Giá Dịch Vụ',
  [ROUTES.SERVICES]: 'Dịch Vụ Thêm',
  [ROUTES.SMART_LOCKS]: 'Smart Locks'
} as const;
```

- [ ] **Step 3: Commit**

```bash
git add src/constants/routes.ts
git commit -m "feat: add SMART_LOCKS route"
```

---

## Task 14: Update Sidebar with Smart Locks Link

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add Lock icon import**

Add Lock to the imports (around line 2):

```typescript
import { Home, ChevronRight, LayoutDashboard, Bed, Users, Settings, FileText, DollarSign, Sparkles, Lock } from 'lucide-react';
```

- [ ] **Step 2: Add smart locks nav item**

Add smart locks item to NAV_ITEMS array (after SERVICES):

```typescript
const NAV_ITEMS = [
  { id: ROUTES.DASHBOARD, icon: <LayoutDashboard size={20} />, label: ROUTE_TITLES[ROUTES.DASHBOARD] },
  { id: ROUTES.ROOMS, icon: <Bed size={20} />, label: ROUTE_TITLES[ROUTES.ROOMS] },
  { id: ROUTES.GUESTS, icon: <Users size={20} />, label: ROUTE_TITLES[ROUTES.GUESTS] },
  { id: ROUTES.FACILITIES, icon: <Settings size={20} />, label: ROUTE_TITLES[ROUTES.FACILITIES] },
  { id: ROUTES.INVOICES, icon: <FileText size={20} />, label: ROUTE_TITLES[ROUTES.INVOICES] },
  { id: ROUTES.UTILITY_PRICING, icon: <DollarSign size={20} />, label: ROUTE_TITLES[ROUTES.UTILITY_PRICING] },
  { id: ROUTES.SERVICES, icon: <Sparkles size={20} />, label: ROUTE_TITLES[ROUTES.SERVICES] },
  { id: ROUTES.SMART_LOCKS, icon: <Lock size={20} />, label: ROUTE_TITLES[ROUTES.SMART_LOCKS] },
] as const;
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: add smart locks link to sidebar"
```

---

## Task 15: Create SmartLocks Page

**Files:**
- Create: `src/pages/SmartLocks/index.tsx`

- [ ] **Step 1: Create SmartLocks page component**

Create `src/pages/SmartLocks/index.tsx`:
```typescript
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, AlertCircle, CheckCircle, Clock, Calendar, Battery, Filter } from 'lucide-react';
import { useDataStore, useSmartLocks, useRooms } from '../../hooks';
import { cn, formatDate, isWithinDays, isBeforeToday } from '../../utils';

type FilterType = 'all' | 'expiring' | 'battery' | 'expired';

export function SmartLocks() {
  const { smartLocks, rooms } = useDataStore();
  const { checkExpiringLocks } = useSmartLocks();
  const [filter, setFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState<{ expiring: number; battery: number }>({ expiring: 0, battery: 0 });

  useEffect(() => {
    checkExpiringLocks().then(({ expiringPasswords, batteryIssues }) => {
      setNotifications({ expiring: expiringPasswords.length, battery: batteryIssues.length });
    });
  }, [checkExpiringLocks]);

  const getLockStatus = (lock: SmartLock) => {
    const expiryDate = new Date(lock.passwordExpiryDate);
    const nextBatteryDate = new Date(lock.nextBatteryReplacementDate);
    const isExpired = expiryDate < new Date();
    const isExpiringSoon = !isExpired && isWithinDays(lock.passwordExpiryDate, 7);
    const needsBattery = nextBatteryDate <= new Date();

    if (isExpired || needsBattery) return 'critical';
    if (isExpiringSoon) return 'warning';
    return 'ok';
  };

  const filteredLocks = smartLocks.filter(lock => {
    const status = getLockStatus(lock);
    switch (filter) {
      case 'expiring': return status === 'warning';
      case 'battery': return new Date(lock.nextBatteryReplacementDate) <= new Date();
      case 'expired': return status === 'critical';
      default: return true;
    }
  });

  const FilterButton = ({ type, label }: { type: FilterType; label: string }) => (
    <button
      onClick={() => setFilter(type)}
      className={cn(
        "px-4 py-2 rounded-xl font-medium transition-all",
        filter === type
          ? "bg-blue-600 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Smart Locks</h1>
        <p className="text-slate-600">Quản lý khóa cửa thông minh</p>
      </div>

      {/* Notifications */}
      {(notifications.expiring > 0 || notifications.battery > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
            <AlertCircle size={20} />
            <span>Cần chú ý</span>
          </div>
          <div className="text-sm text-amber-700">
            {notifications.expiring > 0 && (
              <div>• {notifications.expiring} khóa sắp hết hạn hoặc đã hết hạn password</div>
            )}
            {notifications.battery > 0 && (
              <div>• {notifications.battery} khóa cần thay pin</div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton type="all" label="Tất cả" />
        <FilterButton type="expiring" label="Sắp hết hạn" />
        <FilterButton type="battery" label="Cần thay pin" />
        <FilterButton type="expired" label="Đã hết hạn" />
      </div>

      {/* Locks List */}
      {filteredLocks.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <Lock size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 font-semibold">Không có khóa nào</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLocks.map((lock) => {
            const status = getLockStatus(lock);
            const room = rooms.find(r => r.id === lock.roomId);

            const statusConfig = {
              critical: { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertCircle, label: 'Cần chú ý' },
              warning: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Sắp hết hạn' },
              ok: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Bình thường' }
            };
            const config = statusConfig[status];
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={lock.id}
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "rounded-2xl p-6 border transition-all",
                  config.color
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <Lock size={24} />
                      <h3 className="text-xl font-bold">Phòng {room?.number || 'N/A'}</h3>
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold", config.color)}>
                        {config.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Password Info */}
                      <div className="bg-white/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock size={16} />
                          <span className="font-semibold text-sm">Mật khẩu</span>
                        </div>
                        <p className="font-mono text-lg mb-1">{lock.password}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar size={12} />
                          <span>Hết hạn: {formatDate(lock.passwordExpiryDate)}</span>
                        </div>
                      </div>

                      {/* Battery Info */}
                      <div className="bg-white/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Battery size={16} />
                          <span className="font-semibold text-sm">Pin</span>
                        </div>
                        <p className="text-sm mb-1">
                          Thay: {formatDate(lock.batteryReplacementDate)}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar size={12} />
                          <span>
                            Tiếp theo: {formatDate(lock.nextBatteryReplacementDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusIcon size={20} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add SmartLocks page to pages index**

Update `src/pages/index.ts`:
```typescript
export * from './SmartLocks';
```

- [ ] **Step 3: Add SmartLocks route to App**

Update the routing in App.tsx to include the SmartLocks page. Look for the route rendering section and add:

```tsx
{activeTab === ROUTES.SMART_LOCKS && <SmartLocks />}
```

Also import SmartLocks:
```tsx
import { Dashboard, Rooms, Guests, Facilities, Invoices, UtilityPricing, Services, SmartLocks } from './pages';
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/SmartLocks/index.tsx src/pages/index.ts src/App.tsx
git commit -m "feat: add SmartLocks management page"
```

---

## Task 16: Add Smart Lock Notifications to Dashboard

**Files:**
- Modify: `src/pages/Dashboard/index.tsx`

- [ ] **Step 1: Add smart lock notification check**

Add the smart lock notification check and card to the Dashboard. After the StatCard imports (around line 4), add:

```typescript
import { useSmartLocks } from '../../hooks';
```

Inside the Dashboard component, after the `const { rooms, invoices } = useDataStore();` line, add:

```typescript
const { checkExpiringLocks } = useSmartLocks();
const [lockAlerts, setLockAlerts] = useState<{ expiring: number; battery: number }>({ expiring: 0, battery: 0 });

useEffect(() => {
  checkExpiringLocks().then(({ expiringPasswords, batteryIssues }) => {
    if (expiringPasswords.length > 0 || batteryIssues.length > 0) {
      setLockAlerts({ expiring: expiringPasswords.length, battery: batteryIssues.length });
    }
  });
}, [checkExpiringLocks]);
```

- [ ] **Step 2: Add smart lock alert card**

Add a smart lock alert card to the stats grid (after the unpaidCount StatCard):

```tsx
{lockAlerts.expiring > 0 || lockAlerts.battery > 0 ? (
  <StatCard
    icon={<Lock className="text-rose-600" />}
    label="Smart Lock cần chú ý"
    value={lockAlerts.expiring + lockAlerts.battery}
    subValue={lockAlerts.expiring > 0 ? `${lockAlerts.expiring} hết hạn` : `${lockAlerts.battery} cần pin`}
  />
) : null}
```

- [ ] **Step 3: Add Lock and useState imports**

Update the imports at the top:

```typescript
import { useState, useEffect } from 'react';
import { useDataStore } from '../../stores';
import { useSmartLocks } from '../../hooks';
import { StatCard } from '../../components';
import { formatCurrency } from '../../utils';
import { DollarSign, Bed, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard/index.tsx
git commit -m "feat: add smart lock notifications to Dashboard"
```

---

## Task 17: Update Smart Locks Page with Room Loading

**Files:**
- Modify: `src/pages/SmartLocks/index.tsx`

- [ ] **Step 1: Fix SmartLocks imports and loading**

Update the SmartLocks page to handle loading states properly:

```typescript
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, AlertCircle, CheckCircle, Clock, Calendar, Battery } from 'lucide-react';
import { useDataStore, useSmartLocks } from '../../hooks';
import { SmartLock } from '../../types';
import { cn, formatDate, isWithinDays, isBeforeToday } from '../../utils';
import { ROUTES } from '../../constants';
import { useAppStore } from '../../stores';
```

- [ ] **Step 2: Update imports to include SmartLock type**

Make sure SmartLock is properly imported. Update the imports section:

```typescript
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, AlertCircle, CheckCircle, Clock, Calendar, Battery } from 'lucide-react';
import { useDataStore, useSmartLocks } from '../../hooks';
import { SmartLock } from '../../types';
import { cn, formatDate, isWithinDays } from '../../utils';
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/SmartLocks/index.tsx
git commit -m "fix: update SmartLocks page imports"
```

---

## Task 18: Fix RoomDetails SmartLockTabContent Imports

**Files:**
- Modify: `src/components/rooms/RoomDetails.tsx`

- [ ] **Step 1: Add missing import for SmartLock type**

Ensure SmartLock is imported in the type imports:

```typescript
import { Room, Guest, Facility, SmartLock } from '../../types';
```

- [ ] **Step 2: Commit**

```bash
git add src/components/rooms/RoomDetails.tsx
git commit -m "fix: add SmartLock type import to RoomDetails"
```

---

## Task 19: Final Testing and Verification

**Files:**
- No files modified - testing task

- [ ] **Step 1: Build the project**

Run:
```bash
npm run build
```

Expected: Build completes successfully with no errors

- [ ] **Step 2: Check for TypeScript errors**

Run:
```bash
npm run lint
```

Expected: No TypeScript errors

- [ ] **Step 3: Start dev server**

Run:
```bash
npm run dev
```

Expected: Dev server starts on port 3000

- [ ] **Step 4: Test the following flows manually:**

1. Go to Rooms page, click on a room
2. Verify "Smart Lock" tab appears in RoomDetails
3. In Smart Lock tab, click "Thêm Smart Lock"
4. Fill in password and expiry date, submit
5. Verify lock indicator (🔒) appears on room card
6. Update password using the modal
7. Update battery information
8. Go to Smart Locks page from sidebar
9. Verify lock appears in the list
10. Check Dashboard for smart lock notifications
11. Delete smart lock from a room
12. Verify lock indicator disappears

- [ ] **Step 5: Commit any fixes**

If any issues were found and fixed during testing:

```bash
git add .
git commit -m "fix: resolve issues found during testing"
```

---

## Summary

This implementation plan adds complete smart lock management functionality to the Mai House apartment management system:

**✅ Created:**
- SmartLock type definition
- Date calculation utilities
- SmartLock Firebase service with CRUD operations
- useSmartLocks hook for real-time updates
- 4 modal components (Setup, Update Password, Update Battery, Delete Confirmation)
- SmartLocks management page
- Smart lock tab in RoomDetails
- Dashboard notifications

**✅ Modified:**
- Room type to include smart lock references
- RoomCard to show lock indicator
- RoomDetails with smart lock management tab
- Routes to include SMART_LOCKS
- Sidebar with Smart Locks navigation
- Dashboard with lock alerts
- dataStore to hold smart locks state

**Key Features:**
- Track passwords and expiry dates per room
- 45-day battery replacement tracking with auto-calculation
- In-app notifications for expiring passwords and battery issues
- Flexible add/remove locks from any room
- Visual indicators (🔒 icon, color-coded badges)
- Filtered view of all locks with status filtering
