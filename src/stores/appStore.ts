import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { RouteKey } from '../constants';

interface AppState {
  activeTab: RouteKey;
  sidebarOpen: boolean;
  setActiveTab: (tab: RouteKey) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        activeTab: 'dashboard',
        sidebarOpen: true,
        setActiveTab: (tab) => set({ activeTab: tab }),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
      }),
      { name: 'app-storage' }
    ),
    { name: 'AppStore' }
  )
);
