import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services';
import { Invoice } from '../types';
import { useDataStore } from '../stores';

export function useInvoices() {
  const { setInvoices } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
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
  }, [setInvoices]);

  return { loading, error };
}
