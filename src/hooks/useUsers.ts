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
    console.log('🔍 useUsers: Setting up listener for users collection');
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      console.log('📊 Users snapshot received:', snap.size, 'documents');
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
      console.log('👥 Users data:', users);
      setUsers(users);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('❌ Error loading users:', err);
      setError(err as Error);
      setLoading(false);
    });

    return () => unsub();
  }, [setUsers]);

  return { loading, error };
}
