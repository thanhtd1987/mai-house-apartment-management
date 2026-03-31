import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Room, Guest, Facility, Invoice } from '../types';
import { SmartLock } from '../types/smartLock';
import { UtilityPricing } from '../types/utilityPricing';
import { ExtraServiceConfig } from '../types/extraService';
import { AppUser, UserActivity } from '../types/user';

interface DataState {
  rooms: Room[];
  guests: Guest[];
  facilities: Facility[];
  invoices: Invoice[];
  utilityPricing: UtilityPricing[];
  extraServices: ExtraServiceConfig[];
  smartLocks: SmartLock[];
  users: AppUser[];
  userActivities: UserActivity[];

  setRooms: (rooms: Room[]) => void;
  setGuests: (guests: Guest[]) => void;
  setFacilities: (facilities: Facility[]) => void;
  setInvoices: (invoices: Invoice[]) => void;
  setUtilityPricing: (pricing: UtilityPricing[]) => void;
  setExtraServices: (services: ExtraServiceConfig[]) => void;
  setSmartLocks: (locks: SmartLock[]) => void;
  setUsers: (users: AppUser[]) => void;
  setUserActivities: (activities: UserActivity[]) => void;

  updateRoom: (id: string, updates: Partial<Room>) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  updateUser: (id: string, updates: Partial<AppUser>) => void;
}

export const useDataStore = create<DataState>()(
  devtools(
    (set) => ({
      rooms: [],
      guests: [],
      facilities: [],
      invoices: [],
      utilityPricing: [],
      extraServices: [],
      smartLocks: [],
      users: [],
      userActivities: [],

      setRooms: (rooms) => set({ rooms }),
      setGuests: (guests) => set({ guests }),
      setFacilities: (facilities) => set({ facilities }),
      setInvoices: (invoices) => set({ invoices }),
      setUtilityPricing: (pricing) => set({ utilityPricing: pricing }),
      setExtraServices: (services) => set({ extraServices: services }),
      setSmartLocks: (locks) => set({ smartLocks: locks }),
      setUsers: (users) => set({ users }),
      setUserActivities: (userActivities) => set({ userActivities }),

      updateRoom: (id, updates) => set((state) => ({
        rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r)
      })),

      updateGuest: (id, updates) => set((state) => ({
        guests: state.guests.map(g => g.id === id ? { ...g, ...updates } : g)
      })),

      updateInvoice: (id, updates) => set((state) => ({
        invoices: state.invoices.map(i => i.id === id ? { ...i, ...updates } : i)
      })),

      updateUser: (id, updates) => set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
      })),
    }),
    { name: 'DataStore' }
  )
);
