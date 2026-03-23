import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Room, Guest, Facility, Invoice } from '../types';
import { UtilityPricing } from '../types/utilityPricing';
import { ExtraServiceConfig } from '../types/extraService';

interface DataState {
  rooms: Room[];
  guests: Guest[];
  facilities: Facility[];
  invoices: Invoice[];
  utilityPricing: UtilityPricing[];
  extraServices: ExtraServiceConfig[];

  setRooms: (rooms: Room[]) => void;
  setGuests: (guests: Guest[]) => void;
  setFacilities: (facilities: Facility[]) => void;
  setInvoices: (invoices: Invoice[]) => void;
  setUtilityPricing: (pricing: UtilityPricing[]) => void;
  setExtraServices: (services: ExtraServiceConfig[]) => void;

  updateRoom: (id: string, updates: Partial<Room>) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
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

      setRooms: (rooms) => set({ rooms }),
      setGuests: (guests) => set({ guests }),
      setFacilities: (facilities) => set({ facilities }),
      setInvoices: (invoices) => set({ invoices }),
      setUtilityPricing: (pricing) => set({ utilityPricing: pricing }),
      setExtraServices: (services) => set({ extraServices: services }),

      updateRoom: (id, updates) => set((state) => ({
        rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r)
      })),

      updateGuest: (id, updates) => set((state) => ({
        guests: state.guests.map(g => g.id === id ? { ...g, ...updates } : g)
      })),

      updateInvoice: (id, updates) => set((state) => ({
        invoices: state.invoices.map(i => i.id === id ? { ...i, ...updates } : i)
      })),
    }),
    { name: 'DataStore' }
  )
);
