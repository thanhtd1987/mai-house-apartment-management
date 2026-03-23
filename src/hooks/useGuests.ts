import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services';
import { Guest } from '../types';
import { useDataStore } from '../stores';

export function useGuests() {
  const { setGuests } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
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
  }, [setGuests]);

  return { loading, error };
}
