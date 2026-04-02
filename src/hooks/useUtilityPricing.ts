import { useEffect, useCallback, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services';
import { UtilityPricing, UtilityPricingFormData, UtilityType } from '../types/utilityPricing';
import { useDataStore, useAuthStore } from '../stores';

export function useUtilityPricing() {
  const { utilityPricing, setUtilityPricing } = useDataStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'utilityPricing'),
      orderBy('effectiveDate', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const pricing = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as UtilityPricing));
        setUtilityPricing(pricing);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching utility pricing:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [setUtilityPricing, user]);

  const getActivePricing = useCallback((type: UtilityType): UtilityPricing | undefined => {
    return utilityPricing.find(u => u.type === type && u.isActive);
  }, [utilityPricing]);

  const getPricingByType = useCallback((type: UtilityType): UtilityPricing[] => {
    return utilityPricing.filter(u => u.type === type);
  }, [utilityPricing]);

  const createPricing = useCallback(async (data: UtilityPricingFormData): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, 'utilityPricing'), {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin' // TODO: Replace with actual user ID
      });
      return docRef.id;
    } catch (err) {
      console.error('Error creating utility pricing:', err);
      throw new Error('Failed to create utility pricing');
    }
  }, []);

  const updatePricing = useCallback(async (id: string, data: Partial<UtilityPricingFormData>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'utilityPricing', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error updating utility pricing:', err);
      throw new Error('Failed to update utility pricing');
    }
  }, []);

  const deletePricing = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'utilityPricing', id));
    } catch (err) {
      console.error('Error deleting utility pricing:', err);
      throw new Error('Failed to delete utility pricing');
    }
  }, []);

  const calculateWaterPrice = useCallback((guestCount: number, pricing?: UtilityPricing): number => {
    const waterPricing = pricing || getActivePricing('water');
    if (!waterPricing || guestCount <= 0) return 0;

    // Simple uniform pricing: guestCount × basePrice
    return guestCount * waterPricing.basePrice;
  }, [getActivePricing]);

  const calculateElectricityPrice = useCallback((kwhUsed: number, pricing?: UtilityPricing): number => {
    const electricityPricing = pricing || getActivePricing('electricity');
    if (!electricityPricing || kwhUsed <= 0) return 0;

    // Simple uniform pricing: kwhUsed × basePrice
    return kwhUsed * electricityPricing.basePrice;
  }, [getActivePricing]);

  return {
    utilityPricing,
    loading,
    error,
    getActivePricing,
    getPricingByType,
    createPricing,
    updatePricing,
    deletePricing,
    calculateWaterPrice,
    calculateElectricityPrice
  };
}
