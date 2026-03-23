import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services';
import { Room, Guest, Facility, Invoice } from '../types';
import { UtilityPricing } from '../types/utilityPricing';
import { ExtraServiceConfig } from '../types/extraService';

export function useFirestoreData(user: any) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [utilityPricing, setUtilityPricing] = useState<UtilityPricing[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraServiceConfig[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snap) => {
      console.log("Rooms snapshot received:", snap.docs.length, "rooms");
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() } as Room)));
    }, (err) => {
      console.error("Rooms snapshot error:", err);
    });

    const unsubGuests = onSnapshot(collection(db, 'guests'), (snap) => {
      setGuests(snap.docs.map(d => ({ id: d.id, ...d.data() } as Guest)));
    });

    const unsubFacilities = onSnapshot(collection(db, 'facilities'), (snap) => {
      setFacilities(snap.docs.map(d => ({ id: d.id, ...d.data() } as Facility)));
    });

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice)));
    });

    const unsubUtilityPricing = onSnapshot(
      query(collection(db, 'utilityPricing'), orderBy('effectiveDate', 'desc')),
      (snap) => {
        setUtilityPricing(snap.docs.map(d => ({ id: d.id, ...d.data() } as UtilityPricing)));
      },
      (err) => {
        console.error("Utility pricing snapshot error:", err);
      }
    );

    const unsubExtraServices = onSnapshot(
      query(collection(db, 'extraServices'), orderBy('createdAt', 'desc')),
      (snap) => {
        setExtraServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExtraServiceConfig)));
      },
      (err) => {
        console.error("Extra services snapshot error:", err);
      }
    );

    return () => {
      unsubRooms();
      unsubGuests();
      unsubFacilities();
      unsubInvoices();
      unsubUtilityPricing();
      unsubExtraServices();
    };
  }, [user]);

  return { rooms, guests, facilities, invoices, utilityPricing, extraServices };
}
