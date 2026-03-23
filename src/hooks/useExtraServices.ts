import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services';
import { ExtraServiceConfig } from '../types/extraService';
import { useDataStore } from '../stores';

export function useExtraServices() {
  const { setExtraServices } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubExtraServices = onSnapshot(
      query(collection(db, 'extraServices'), orderBy('createdAt', 'desc')),
      (snap) => {
        setExtraServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExtraServiceConfig)));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Extra services snapshot error:", err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubExtraServices();
  }, [setExtraServices]);

  return { loading, error };
}
