import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { User, signOut } from 'firebase/auth';
import { auth } from '../services';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      logout: async () => {
        try {
          await signOut(auth);
          set({ user: null });
        } catch (error) {
          console.error('Error signing out:', error);
          // Still clear local state even if Firebase signout fails
          set({ user: null });
        }
      },
    }),
    { name: 'AuthStore' }
  )
);
