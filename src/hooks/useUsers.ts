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
