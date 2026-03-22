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

export default function App() {
  const { user, loading } = useAuth();
  const { rooms, guests, facilities, invoices } = useFirestoreData(user);
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
        return <RoomsManager rooms={rooms} facilities={facilities} guests={guests} />;
      case ROUTES.GUESTS:
        return <GuestsManager guests={guests} rooms={rooms} />;
      case ROUTES.FACILITIES:
        return <FacilitiesManager facilities={facilities} />;
      case ROUTES.INVOICES:
        return <InvoicesManager rooms={rooms} invoices={invoices} />;
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
