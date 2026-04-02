import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services';
import { Guest } from '../types';
import { useDataStore, useAuthStore } from '../stores';

export function useGuests() {
  const { setGuests } = useDataStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubGuests = onSnapshot(collection(db, 'guests'), (snap) => {
      setGuests(snap.docs.map(d => ({ id: d.id, ...d.data() } as Guest)));
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Guests snapshot error:", err);
      setError(err as Error);
      setLoading(false);
    });

    return () => unsubGuests();
  }, [setGuests, user]);

  return { loading, error };
}
