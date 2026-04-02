import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserActivity } from '../types/user';
import { useDataStore, useAuthStore } from '../stores';
import { isSuperAdmin } from '../utils/permissions';

export function useUserActivities(limitCount = 50) {
  const { setUserActivities } = useDataStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only fetch user activities if user is authenticated and is superAdmin
    if (!user || !isSuperAdmin(user)) {
      setLoading(false);
      return;
    }

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
  }, [setUserActivities, limitCount, user]);

  return { loading, error };
}
