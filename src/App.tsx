/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { useAuth, useRooms, useGuests, useFacilities, useInvoices, useExtraServices, useUtilityPricing, useUsers, useUserActivities } from './hooks';
import { useAuthStore, useAppStore, useDataStore } from './stores';
import { Sidebar, Header } from './components/layout';
import { Dashboard, RoomsManager, GuestsManager, FacilitiesManager, InvoicesManager, SmartLocks } from './pages';
import { ErrorBoundary, LoginPage, AppLoading } from './components';
import { ROUTES } from './constants';
import { UtilityPricingPage } from './pages/UtilityPricing';
import { ServicesManager } from './pages/Services';
import { UsersManager } from './pages/Users';
import { doc, updateDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { db } from './services';

export default function App() {
  const { user, loading } = useAuthStore();
  useAuth();

  const { activeTab } = useAppStore();
  const { rooms, guests, facilities, invoices, utilityPricing, extraServices } = useDataStore();

  useRooms();
  useGuests();
  useFacilities();
  useInvoices();
  useExtraServices();
  useUtilityPricing();
  useUsers();
  useUserActivities();

  if (loading) {
    return <AppLoading />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case ROUTES.DASHBOARD:
        return <Dashboard />;
      case ROUTES.ROOMS:
        return <RoomsManager />;
      case ROUTES.GUESTS:
        return <GuestsManager />;
      case ROUTES.FACILITIES:
        return <FacilitiesManager />;
      case ROUTES.INVOICES:
        return <InvoicesManager />;
      case ROUTES.UTILITY_PRICING:
        return <UtilityPricingPage
          onUpdatePricing={async (id, data) => {
            try {
              await updateDoc(doc(db, 'utilityPricing', id), {
                ...data,
                updatedAt: new Date().toISOString()
              });
              console.log('✓ Pricing updated:', id);
            } catch (err) {
              console.error('Error updating pricing:', err);
              alert('Không thể cập nhật giá!');
            }
          }}
          onCreatePricing={async (data) => {
            try {
              const docRef = await addDoc(collection(db, 'utilityPricing'), {
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user?.uid || 'admin'
              });
              console.log('✓ Pricing created:', docRef.id);
            } catch (err) {
              console.error('Error creating pricing:', err);
              alert('Không thể tạo giá!');
            }
          }}
          onDeletePricing={async (id) => {
            try {
              await deleteDoc(doc(db, 'utilityPricing', id));
              console.log('✓ Pricing deleted:', id);
            } catch (err) {
              console.error('Error deleting pricing:', err);
              alert('Không thể xóa giá!');
            }
          }}
        />;
      case ROUTES.SERVICES:
        return <ServicesManager
          onUpdateServices={() => {
            console.log('Services updated');
          }}
        />;
      case ROUTES.SMART_LOCKS:
        return <SmartLocks />;
      case ROUTES.USERS:
        return <UsersManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto relative">
          <Header />

          <div className="p-8 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
