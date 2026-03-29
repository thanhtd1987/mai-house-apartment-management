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
