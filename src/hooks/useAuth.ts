import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../services';
import { useAuthStore } from '../stores';

export function useAuth() {
  const { setUser, setLoading } = useAuthStore();
  const previousUserRef = useRef<typeof auth.currentUser | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      console.log("Auth state changed:", u?.email, u?.emailVerified);
      setUser(u);
      setLoading(false);

      // Only track login activity when going from null to user (actual login, not page refresh)
      if (u && !previousUserRef.current) {
        // Track login activity ONLY if user exists in users collection
        (async () => {
          try {
            const userDoc = await getDoc(doc(db, 'users', u.uid));

            if (userDoc.exists()) {
              // Update lastLoginAt
              await updateDoc(doc(db, 'users', u.uid), {
                lastLoginAt: new Date().toISOString()
              });

              // Log activity
              await addDoc(collection(db, 'userActivities'), {
                userId: u.uid,
                email: u.email,
                loginTime: new Date().toISOString(),
                userAgent: navigator.userAgent
              });
            }
            // If user doesn't exist in users collection, don't track
          } catch (error) {
            console.error('Error tracking login:', error);
            // Don't throw - login should still succeed
          }
        })();
      }

      // Update ref for next comparison
      previousUserRef.current = u;
    });
    return () => unsubAuth();
  }, []);
}
