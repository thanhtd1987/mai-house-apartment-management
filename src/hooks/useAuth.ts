import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../services';
import { useAuthStore } from '../stores';

async function ensureSuperAdminConfig() {
  const SUPER_ADMIN_EMAIL = 'thanhtd1987@gmail.com';
  const configRef = doc(db, 'config', 'superAdmins', SUPER_ADMIN_EMAIL);

  try {
    const docSnap = await getDoc(configRef);
    if (!docSnap.exists()) {
      console.log('🔧 Creating super admin config for', SUPER_ADMIN_EMAIL);
      await setDoc(configRef, {
        active: true,
        createdAt: new Date().toISOString(),
        notes: 'Initial super admin - auto-created'
      });
      console.log('✅ Super admin config created');
    }
  } catch (error) {
    console.error('❌ Error ensuring super admin config:', error);
  }
}

export function useAuth() {
  const { setUser, setLoading } = useAuthStore();
  const previousUserRef = useRef<typeof auth.currentUser | null>(null);
  const setupDoneRef = useRef(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      console.log("Auth state changed:", u?.email, u?.emailVerified);
      setUser(u);
      setLoading(false);

      // Auto-create super admin config on first load (only once)
      if (!setupDoneRef.current && !previousUserRef.current) {
        await ensureSuperAdminConfig();
        setupDoneRef.current = true;
      }

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
