import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services';
import { Invoice } from '../types';
import { useDataStore, useAuthStore } from '../stores';

export function useInvoices() {
  const { setInvoices } = useDataStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice)));
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Invoices snapshot error:", err);
      setError(err as Error);
      setLoading(false);
    });

    return () => unsubInvoices();
  }, [setInvoices, user]);

  return { loading, error };
}
