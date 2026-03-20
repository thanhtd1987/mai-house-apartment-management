import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      console.log("Auth state changed:", u?.email, u?.emailVerified);
      setUser(u);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  return { user, loading };
}
