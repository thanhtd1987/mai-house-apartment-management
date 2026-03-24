import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../services';
import { RoomServiceUsage, ServiceUsage, getCurrentMonth } from '../types/roomServiceUsage';
import { ExtraServiceConfig } from '../types/extraService';

interface UseRoomServiceUsagesParams {
  roomId: string;
  month?: string; // Optional, defaults to current month
}

interface UseRoomServiceUsagesReturn {
  usage: RoomServiceUsage | null;
  services: ServiceUsage[];
  loading: boolean;
  error: Error | null;
  addService: (serviceId: string, quantity: number, notes?: string) => Promise<void>;
  updateService: (createdAt: string, quantity: number, notes?: string) => Promise<void>;
  removeService: (createdAt: string) => Promise<void>;
  markServiceAsPaid: (createdAt: string, paymentMethod: 'cash' | 'transfer' | 'other', paidAmount: number) => Promise<void>;
  getUnpaidTotalForMonth: (month: string) => Promise<number>;
  clearMonthUsage: (month: string) => Promise<void>;
}

/**
 * Hook để quản lý extra services usage cho một phòng
 * Lưu services theo tháng, tự động tạo/clear khi cần
 */
export function useRoomServiceUsages({
  roomId,
  month
}: UseRoomServiceUsagesParams): UseRoomServiceUsagesReturn {
  const [usage, setUsage] = useState<RoomServiceUsage | null>( null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const targetMonth = month || getCurrentMonth();

  // Query room service usage theo roomId + month
  useEffect(() => {
    if (!roomId) {
      setUsage(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'roomServiceUsages'),
      where('roomId', '==', roomId),
      where('month', '==', targetMonth)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // No usage record yet for this month
          setUsage(null);
        } else {
          // Should only have one document per (roomId, month)
          const doc = snapshot.docs[0];
          setUsage({
            id: doc.id,
            ...doc.data()
          } as RoomServiceUsage);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching room service usage:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [roomId, targetMonth]);

  const services = usage?.services || [];

  /**
   * Thêm service vào month hiện tại
   */
  const addService = async (serviceId: string, quantity: number, notes?: string) => {
    try {
      const usageId = `${roomId}_${targetMonth}`;
      const usageRef = doc(db, 'roomServiceUsages', usageId);

      const newService: ServiceUsage = {
        serviceId,
        quantity,
        createdAt: new Date().toISOString(),
        notes,
        status: 'unpaid' // Default unpaid
      };

      await runTransaction(db, async (transaction) => {
        const usageDoc = await transaction.get(usageRef);

        if (usageDoc.exists()) {
          // Document exists, add NEW service entry (không merge)
          // ✅ FIX: Mỗi lần add = entry riêng, không merge
          // Lần 1: { serviceId: 'parking', quantity: 15, paid: true }
          // Lần 2: { serviceId: 'parking', quantity: 15, paid: false } ← Entry riêng
          const existingData = usageDoc.data() as RoomServiceUsage;
          const updatedServices = [...existingData.services, newService];

          transaction.update(usageRef, {
            services: updatedServices,
            updatedAt: serverTimestamp()
          });
        } else {
          // Create new document
          const newUsage: Omit<RoomServiceUsage, 'id'> = {
            roomId,
            month: targetMonth,
            services: [newService],
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any
          };

          transaction.set(usageRef, newUsage);
        }
      });

      console.log(`Added service ${serviceId} to room ${roomId} for month ${targetMonth}`);
    } catch (err) {
      console.error('Error adding service:', err);
      throw err;
    }
  };

  /**
   * Update service (thay đổi quantity) - dùng createdAt làm unique key
   */
  const updateService = async (createdAt: string, quantity: number, notes?: string) => {
    try {
      if (!usage) {
        throw new Error('No usage record found for this month');
      }

      const usageRef = doc(db, 'roomServiceUsages', usage.id);
      const updatedServices = usage.services.map(s =>
        s.createdAt === createdAt
          ? { ...s, quantity, notes: notes || s.notes }
          : s
      );

      await updateDoc(usageRef, {
        services: updatedServices,
        updatedAt: serverTimestamp()
      });

      console.log(`Updated service (created at ${createdAt}) for room ${roomId}`);
    } catch (err) {
      console.error('Error updating service:', err);
      throw err;
    }
  };

  /**
   * Remove service khỏi month hiện tại - dùng createdAt làm unique key
   */
  const removeService = async (createdAt: string) => {
    try {
      if (!usage) {
        throw new Error('No usage record found for this month');
      }

      const usageRef = doc(db, 'roomServiceUsages', usage.id);
      const updatedServices = usage.services.filter(s => s.createdAt !== createdAt);

      if (updatedServices.length === 0) {
        // Delete entire document if no services left
        await deleteDoc(usageRef);
      } else {
        await updateDoc(usageRef, {
          services: updatedServices,
          updatedAt: serverTimestamp()
        });
      }

      console.log(`Removed service (created at ${createdAt}) from room ${roomId}`);
    } catch (err) {
      console.error('Error removing service:', err);
      throw err;
    }
  };

  /**
   * Mark service as paid (thanh toán ngay khi yêu cầu) - dùng createdAt làm unique key
   */
  const markServiceAsPaid = async (
    createdAt: string,
    paymentMethod: 'cash' | 'transfer' | 'other',
    paidAmount: number
  ) => {
    try {
      if (!usage) {
        throw new Error('No usage record found for this month');
      }

      const usageRef = doc(db, 'roomServiceUsages', usage.id);
      const updatedServices = usage.services.map(s =>
        s.createdAt === createdAt
          ? {
              ...s,
              status: 'paid' as const,
              paidAt: new Date().toISOString(),
              paymentMethod,
              paidAmount
            }
          : s
      );

      await updateDoc(usageRef, {
        services: updatedServices,
        updatedAt: serverTimestamp()
      });

      console.log(`Marked service (created at ${createdAt}) as paid (${paymentMethod}, ${paidAmount}đ)`);
    } catch (err) {
      console.error('Error marking service as paid:', err);
      throw err;
    }
  };

  /**
   * Get UNPAID total amount cho một tháng (để tính trong invoice)
   */
  const getUnpaidTotalForMonth = async (month: string): Promise<number> => {
    try {
      const usageId = `${roomId}_${month}`;
      const usageDoc = await getDoc(doc(db, 'roomServiceUsages', usageId));

      if (!usageDoc.exists()) {
        return 0;
      }

      const usageData = usageDoc.data() as RoomServiceUsage;

      // Fetch all services to get current prices (CHỈ tính UNPAID)
      let total = 0;
      for (const serviceUsage of usageData.services) {
        // Bỏ qua services đã paid
        if (serviceUsage.status === 'paid') continue;

        const serviceRef = doc(db, 'extraServices', serviceUsage.serviceId);
        const serviceDoc = await getDoc(serviceRef);

        if (serviceDoc.exists()) {
          const service = serviceDoc.data() as ExtraServiceConfig;
          total += service.price * serviceUsage.quantity;
        }
      }

      return total;
    } catch (err) {
      console.error('Error calculating unpaid total:', err);
      return 0;
    }
  };

  /**
   * Clear usage cho một tháng (sau khi đã tạo invoice)
   */
  const clearMonthUsage = async (month: string) => {
    try {
      const usageId = `${roomId}_${month}`;
      await deleteDoc(doc(db, 'roomServiceUsages', usageId));
      console.log(`Cleared service usage for room ${roomId}, month ${month}`);
    } catch (err) {
      console.error('Error clearing month usage:', err);
      throw err;
    }
  };

  return {
    usage,
    services,
    loading,
    error,
    addService,
    updateService,
    removeService,
    markServiceAsPaid,
    getUnpaidTotalForMonth,
    clearMonthUsage
  };
}

/**
 * Helper để lấy services details cho hiển thị
 */
export async function getServiceDetails(
  serviceUsages: ServiceUsage[]
): Promise<Array<{ usage: ServiceUsage; config: ExtraServiceConfig }>> {
  const details = [];

  for (const usage of serviceUsages) {
    const serviceRef = doc(db, 'extraServices', usage.serviceId);
    const serviceDoc = await getDoc(serviceRef);

    if (serviceDoc.exists()) {
      details.push({
        usage,
        config: {
          id: serviceDoc.id,
          ...serviceDoc.data()
        } as ExtraServiceConfig
      });
    }
  }

  return details;
}
