/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, useFirestoreData } from './hooks';
import { Sidebar, Header } from './components/layout';
import { Dashboard, RoomsManager, GuestsManager, FacilitiesManager, InvoicesManager } from './pages';
import { ErrorBoundary, LoginPage, AppLoading } from './components';
import { ROUTES, ROUTE_TITLES, RouteKey } from './constants';
import { UtilityPricingPage } from './pages/UtilityPricing';
import { ServicesManager } from './pages/Services';
import { doc, updateDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { db } from './services';

export default function App() {
  const { user, loading } = useAuth();
  const { rooms, guests, facilities, invoices, utilityPricing, extraServices } = useFirestoreData(user);
  const [activeTab, setActiveTab] = useState<RouteKey>(ROUTES.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (loading) {
    return <AppLoading />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case ROUTES.DASHBOARD:
        return <Dashboard rooms={rooms} invoices={invoices} />;
      case ROUTES.ROOMS:
        return <RoomsManager
          rooms={rooms}
          facilities={facilities}
          guests={guests}
          utilityPricing={utilityPricing}
          extraServices={extraServices}
        />;
      case ROUTES.GUESTS:
        return <GuestsManager guests={guests} rooms={rooms} facilities={facilities} />;
      case ROUTES.FACILITIES:
        return <FacilitiesManager facilities={facilities} />;
      case ROUTES.INVOICES:
        return <InvoicesManager rooms={rooms} invoices={invoices} />;
      case ROUTES.UTILITY_PRICING:
        return <UtilityPricingPage
          utilityPricing={utilityPricing}
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
          services={extraServices}
          onUpdateServices={() => {
            // Force re-fetch by triggering useEffect
            console.log('Services updated');
          }}
        />;
      default:
        return <Dashboard rooms={rooms} invoices={invoices} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <main className="flex-1 overflow-y-auto relative">
          <Header activeTab={activeTab} />

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
