import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services';
import { Room } from '../types';
import { useDataStore, useAuthStore } from '../stores';

export function useRooms() {
  const { setRooms } = useDataStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snap) => {
      console.log("Rooms snapshot received:", snap.docs.length, "rooms");
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() } as Room)));
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Rooms snapshot error:", err);
      setError(err as Error);
      setLoading(false);
    });

    return () => unsubRooms();
  }, [setRooms, user]);

  return { loading, error };
}
