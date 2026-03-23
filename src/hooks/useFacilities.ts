import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services';
import { Facility } from '../types';
import { useDataStore } from '../stores';

export function useFacilities() {
  const { setFacilities } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubFacilities = onSnapshot(collection(db, 'facilities'), (snap) => {
      setFacilities(snap.docs.map(d => ({ id: d.id, ...d.data() } as Facility)));
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Facilities snapshot error:", err);
      setError(err as Error);
      setLoading(false);
    });

    return () => unsubFacilities();
  }, [setFacilities]);

  return { loading, error };
}
