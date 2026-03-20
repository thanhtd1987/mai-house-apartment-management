/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Home } from 'lucide-react';
import { auth } from './services';
import { useAuth, useFirestoreData } from './hooks';
import { Sidebar, Header } from './components/layout';
import { Dashboard, RoomsManager, GuestsManager, FacilitiesManager, InvoicesManager } from './pages';

type TabType = 'dashboard' | 'rooms' | 'guests' | 'facilities' | 'invoices';

export default function App() {
  const { user, loading } = useAuth();
  const { rooms, guests, facilities, invoices } = useFirestoreData(user);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    try {
      console.log("Attempting Google Sign-In...");
      const result = await signInWithPopup(auth, provider);
      console.log("Sign-in successful:", result.user);
    } catch (err: any) {
      console.error("Login Error:", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      alert(`Lỗi đăng nhập: ${err.message}\n\nCode: ${err.code}`);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white mb-6">
          <Home size={32} />
        </div>
        <h1 className="text-3xl font-black mb-2">Mai House</h1>
        <p className="text-gray-500 mb-8">Hệ thống quản lý căn hộ vận hành thông minh</p>
        <button
          onClick={handleLogin}
          className="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center gap-3"
        >
          Đăng nhập với Google
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard rooms={rooms} invoices={invoices} />;
      case 'rooms':
        return <RoomsManager rooms={rooms} facilities={facilities} guests={guests} />;
      case 'guests':
        return <GuestsManager guests={guests} />;
      case 'facilities':
        return <FacilitiesManager facilities={facilities} />;
      case 'invoices':
        return <InvoicesManager rooms={rooms} invoices={invoices} />;
      default:
        return <Dashboard rooms={rooms} invoices={invoices} />;
    }
  };

  return (
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
  );
}
