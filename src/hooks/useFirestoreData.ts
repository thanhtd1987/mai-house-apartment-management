import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services';
import { Room, Guest, Facility, Invoice } from '../types';

export function useFirestoreData(user: any) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

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

    return () => {
      unsubRooms();
      unsubGuests();
      unsubFacilities();
      unsubInvoices();
    };
  }, [user]);

  return { rooms, guests, facilities, invoices };
}
