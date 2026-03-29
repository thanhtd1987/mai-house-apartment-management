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
