/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Bed, 
  Users, 
  Settings, 
  FileText, 
  Plus, 
  Search, 
  Camera, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Home,
  Trash2,
  Edit3,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper, { Area as CropArea } from 'react-easy-crop';
import { getCroppedImg } from './utils/cropImage';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { toPng } from 'html-to-image';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './firebase';
import { GoogleGenAI } from "@google/genai";
import { Room, Guest, Facility, Invoice, OperationType, FirestoreErrorInfo } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId || undefined,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// EVN Tiers (approximate)
const EVN_TIERS = [
  { limit: 50, price: 1806 },
  { limit: 100, price: 1866 },
  { limit: 200, price: 2167 },
  { limit: 300, price: 2729 },
  { limit: 400, price: 3050 },
  { limit: Infinity, price: 3151 }
];

const calculateElectricity = (used: number) => {
  let total = 0;
  let remaining = used;
  let prevLimit = 0;

  for (const tier of EVN_TIERS) {
    const tierLimit = tier.limit - prevLimit;
    const currentUsed = Math.min(remaining, tierLimit);
    total += currentUsed * tier.price;
    remaining -= currentUsed;
    prevLimit = tier.limit;
    if (remaining <= 0) break;
  }
  return total;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rooms' | 'guests' | 'facilities' | 'invoices'>('dashboard');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      console.log("Auth state changed:", u?.email, u?.emailVerified);
      setUser(u);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

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
      case 'dashboard': return <Dashboard rooms={rooms} invoices={invoices} />;
      case 'rooms': return <RoomsManager rooms={rooms} facilities={facilities} guests={guests} />;
      case 'guests': return <GuestsManager guests={guests} />;
      case 'facilities': return <FacilitiesManager facilities={facilities} />;
      case 'invoices': return <InvoicesManager rooms={rooms} invoices={invoices} />;
      default: return <Dashboard rooms={rooms} invoices={invoices} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-gray-200 flex flex-col z-20"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shrink-0">
            <Home size={24} />
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-xl tracking-tight"
            >
              Mai House
            </motion.span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Tổng quan" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<Bed size={20} />} 
            label="Phòng & Trạng thái" 
            active={activeTab === 'rooms'} 
            onClick={() => setActiveTab('rooms')} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Khách lưu trú" 
            active={activeTab === 'guests'} 
            onClick={() => setActiveTab('guests')} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Cơ sở vật chất" 
            active={activeTab === 'facilities'} 
            onClick={() => setActiveTab('facilities')} 
            collapsed={!isSidebarOpen}
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Hóa đơn & Thanh toán" 
            active={activeTab === 'invoices'} 
            onClick={() => setActiveTab('invoices')} 
            collapsed={!isSidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <ChevronRight className="rotate-180" size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-bottom border-gray-200 p-6 flex justify-between items-center z-10">
          <h1 className="text-2xl font-bold capitalize">
            {activeTab === 'dashboard' ? 'Tổng quan hệ thống' : 
             activeTab === 'rooms' ? 'Quản lý phòng' :
             activeTab === 'guests' ? 'Quản lý khách lưu trú' :
             activeTab === 'facilities' ? 'Cơ sở vật chất' : 'Hóa đơn & Thanh toán'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-black transition-all w-64"
              />
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 overflow-hidden">
              <img src="https://picsum.photos/seed/admin/100/100" alt="Admin" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

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

function NavItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
        active ? "bg-black text-white shadow-lg shadow-black/10" : "text-gray-500 hover:bg-gray-100"
      )}
    >
      <div className={cn("shrink-0", active ? "text-white" : "text-gray-400 group-hover:text-black")}>
        {icon}
      </div>
      {!collapsed && (
        <span className="font-medium text-sm whitespace-nowrap overflow-hidden">
          {label}
        </span>
      )}
    </button>
  );
}

// --- Components ---

function Dashboard({ rooms, invoices }: { rooms: Room[], invoices: Invoice[] }) {
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.totalPrice, 0);
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const availableCount = rooms.filter(r => r.status === 'available').length;
  const unpaidCount = rooms.filter(r => r.paymentStatus !== 'paid').length;

  const chartData = [
    { name: 'Tháng 1', revenue: 45000000 },
    { name: 'Tháng 2', revenue: 52000000 },
    { name: 'Tháng 3', revenue: 48000000 },
    { name: 'Tháng 4', revenue: 61000000 },
    { name: 'Tháng 5', revenue: 55000000 },
    { name: 'Tháng 6', revenue: totalRevenue || 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<DollarSign className="text-emerald-600" />} label="Tổng doanh thu" value={formatCurrency(totalRevenue)} trend="+12.5%" />
        <StatCard icon={<Bed className="text-blue-600" />} label="Phòng đang ở" value={occupiedCount} subValue={`/${rooms.length} phòng`} />
        <StatCard icon={<CheckCircle2 className="text-amber-600" />} label="Phòng trống" value={availableCount} />
        <StatCard icon={<AlertCircle className="text-rose-600" />} label="Chưa thanh toán" value={unpaidCount} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Biểu đồ doanh thu</h3>
            <select className="bg-gray-50 border-none rounded-lg text-xs p-2">
              <option>6 tháng qua</option>
              <option>Năm nay</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999'}} tickFormatter={(v) => `${v/1000000}M`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(v: number) => [formatCurrency(v), 'Doanh thu']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#000" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Trạng thái phòng</h3>
          <div className="space-y-4">
            {rooms.slice(0, 5).map(room => (
              <div key={room.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    room.status === 'available' ? "bg-emerald-500" : 
                    room.status === 'occupied' ? "bg-blue-500" : "bg-gray-400"
                  )} />
                  <span className="font-medium">Phòng {room.number}</span>
                </div>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full font-medium",
                  room.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700" : 
                  room.paymentStatus === 'unpaid' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                )}>
                  {room.paymentStatus === 'paid' ? 'Đã thanh toán' : room.paymentStatus === 'unpaid' ? 'Chưa thanh toán' : 'Nợ cũ'}
                </span>
              </div>
            ))}
            <button className="w-full text-center text-sm text-gray-500 font-medium mt-4 hover:text-black">Xem tất cả phòng</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, trend }: { icon: React.ReactNode, label: string, value: string | number, subValue?: string, trend?: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-50 rounded-2xl">
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
          {subValue && <span className="text-sm text-gray-400 font-medium">{subValue}</span>}
        </div>
      </div>
    </div>
  );
}

function RoomsManager({ rooms, facilities, guests }: { rooms: Room[], facilities: Facility[], guests: Guest[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const roomData = {
      number: formData.get('number') as string,
      meterId: formData.get('meterId') as string,
      type: formData.get('type') as 'single' | 'double',
      status: formData.get('status') as 'available' | 'occupied' | 'maintenance',
      price: Number(formData.get('price')),
      lastElectricityMeter: Number(formData.get('lastElectricityMeter')),
      paymentStatus: formData.get('paymentStatus') as 'paid' | 'unpaid' | 'debt',
      facilities: Array.from(formData.getAll('facilities')) as string[]
    };

    try {
      if (editingRoom?.id) {
        await updateDoc(doc(db, 'rooms', editingRoom.id), roomData);
        console.log("Room updated successfully:", editingRoom.id);
      } else {
        const docRef = await addDoc(collection(db, 'rooms'), roomData);
        console.log("Room created successfully:", docRef.id);
      }
      setIsModalOpen(false);
      setEditingRoom(null);
    } catch (err) {
      console.error("Error saving room:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm">Quản lý danh sách {rooms.length} phòng trong hệ thống.</p>
        <button 
          onClick={() => { setEditingRoom({}); setIsModalOpen(true); }}
          className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-gray-800 transition-all"
        >
          <Plus size={18} /> Thêm phòng mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <div key={room.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Phòng {room.number}</h3>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    {room.type === 'single' ? 'Phòng đơn (1-2 người)' : 'Phòng đôi (3-4 người)'}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingRoom(room); setIsModalOpen(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => deleteDoc(doc(db, 'rooms', room.id))} className="p-2 hover:bg-rose-50 rounded-lg text-rose-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Trạng thái</p>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      room.status === 'available' ? "bg-emerald-500" : 
                      room.status === 'occupied' ? "bg-blue-500" : "bg-gray-400"
                    )} />
                    <span className="text-xs font-bold capitalize">{room.status}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Giá thuê</p>
                  <span className="text-xs font-bold">{formatCurrency(room.price)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Thanh toán:</span>
                  <span className={cn(
                    "font-bold",
                    room.paymentStatus === 'paid' ? "text-emerald-600" : 
                    room.paymentStatus === 'unpaid' ? "text-rose-600" : "text-amber-600"
                  )}>
                    {room.paymentStatus === 'paid' ? 'Đã xong' : room.paymentStatus === 'unpaid' ? 'Chưa đóng' : 'Nợ cũ'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Số điện cũ:</span>
                  <span className="font-bold">{room.lastElectricityMeter} kWh</span>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <div className="flex -space-x-2">
                {room.facilities?.slice(0, 3).map(fid => (
                  <div key={fid} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold">
                    {facilities.find(f => f.id === fid)?.name.charAt(0)}
                  </div>
                ))}
                {(room.facilities?.length || 0) > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-200 flex items-center justify-center text-[10px] font-bold">
                    +{(room.facilities?.length || 0) - 3}
                  </div>
                )}
              </div>
              <button className="text-xs font-bold text-gray-400 hover:text-black flex items-center gap-1">
                Chi tiết <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Room Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingRoom?.id ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveRoom} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Mã đồng hồ điện (No.)</label>
                    <input name="meterId" defaultValue={editingRoom?.meterId} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Số phòng</label>
                    <input name="number" defaultValue={editingRoom?.number} required className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Loại phòng</label>
                    <select name="type" defaultValue={editingRoom?.type || 'single'} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black">
                      <option value="single">Phòng đơn (1-2 người)</option>
                      <option value="double">Phòng đôi (3-4 người)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Trạng thái</label>
                    <select name="status" defaultValue={editingRoom?.status || 'available'} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black">
                      <option value="available">Còn trống</option>
                      <option value="occupied">Đang ở</option>
                      <option value="maintenance">Đang sửa chữa</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Giá thuê (VND)</label>
                    <input name="price" type="number" defaultValue={editingRoom?.price} required className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Số điện hiện tại</label>
                    <input name="lastElectricityMeter" type="number" defaultValue={editingRoom?.lastElectricityMeter || 0} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Thanh toán</label>
                    <select name="paymentStatus" defaultValue={editingRoom?.paymentStatus || 'paid'} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black">
                      <option value="paid">Đã thanh toán</option>
                      <option value="unpaid">Chưa thanh toán</option>
                      <option value="debt">Nợ cũ</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Cơ sở vật chất</label>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                    {facilities.map(f => (
                      <label key={f.id} className="flex items-center gap-2 text-sm">
                        <input 
                          type="checkbox" 
                          name="facilities" 
                          value={f.id} 
                          defaultChecked={editingRoom?.facilities?.includes(f.id)}
                          className="rounded border-gray-300 text-black focus:ring-black" 
                        />
                        {f.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all">
                    {editingRoom?.id ? 'Cập nhật phòng' : 'Tạo phòng mới'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CropModal({ image, onCropComplete, onClose }: { image: string, onCropComplete: (croppedImage: string) => void, onClose: () => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropChange = (crop: any) => setCrop(crop);
  const onZoomChange = (zoom: number) => setZoom(zoom);
  const onCropCompleteHandler = (_: CropArea, croppedAreaPixels: CropArea) => setCroppedAreaPixels(croppedAreaPixels);

  const handleCrop = async () => {
    if (croppedAreaPixels) {
      setLoading(true);
      try {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels);
        onCropComplete(croppedImage);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white p-6 rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="relative h-80 w-full">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button 
            onClick={handleCrop} 
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Đang cắt ảnh...' : 'Cắt ảnh'}
          </button>
          <button onClick={onClose} disabled={loading} className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function GuestsManager({ guests }: { guests: Guest[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [croppedFace, setCroppedFace] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.idNumber.includes(searchQuery) ||
    g.phone.includes(searchQuery)
  );

  const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleScanID = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      
      // Compress the image
      const compressedBase64 = await compressImage(base64, 800, 800, 0.7);
      setScannedImage(compressedBase64);
      setShowCropModal(true); // Trigger crop modal
      
      try {
        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{
            parts: [
              { text: "Hãy trích xuất thông tin từ ảnh CCCD/Passport này. Trả về JSON gồm: name (họ tên), idNumber (số CCCD), phone (nếu có), email (nếu có). Chỉ trả về JSON." },
              { inlineData: { mimeType: 'image/jpeg', data: compressedBase64.split(',')[1] } }
            ]
          }]
        });
        
        const text = result.text;
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          // Fill form with data
          const form = document.getElementById('guest-form') as HTMLFormElement;
          if (form) {
            (form.elements.namedItem('name') as HTMLInputElement).value = data.name || '';
            (form.elements.namedItem('idNumber') as HTMLInputElement).value = data.idNumber || '';
            (form.elements.namedItem('phone') as HTMLInputElement).value = data.phone || '';
            (form.elements.namedItem('email') as HTMLInputElement).value = data.email || '';
          }
        }
      } catch (err) {
        console.error("OCR Error:", err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const guestData = {
      name: formData.get('name') as string,
      idNumber: formData.get('idNumber') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      idPhoto: croppedFace || scannedImage || editingGuest?.idPhoto || '',
      checkInDate: editingGuest?.checkInDate || new Date().toISOString().split('T')[0]
    };

    try {
      if (editingGuest) {
        await updateDoc(doc(db, 'guests', editingGuest.id), guestData);
      } else {
        await addDoc(collection(db, 'guests'), guestData);
      }
      
      setIsModalOpen(false);
      setEditingGuest(null);
      setScannedImage(null);
      setCroppedFace(null);
    } catch (err) {
      handleFirestoreError(err, editingGuest ? OperationType.UPDATE : OperationType.CREATE, 'guests');
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khách này?')) {
      try {
        await deleteDoc(doc(db, 'guests', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'guests');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm">Quản lý danh sách {guests.length} khách lưu trú.</p>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm khách..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black transition-all w-64"
            />
          </div>
          <button 
            onClick={() => { setEditingGuest(null); setIsModalOpen(true); }}
            className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-gray-800 transition-all"
          >
            <Plus size={18} /> Đăng ký khách mới
          </button>
        </div>
      </div>

      {filteredGuests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold">Không tìm thấy khách</h3>
          <p className="text-gray-500 text-sm">Thử tìm kiếm với từ khóa khác hoặc đăng ký khách mới.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Khách hàng</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">CCCD/Passport</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Liên hệ</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Ngày vào</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGuests.map(guest => (
                <tr key={guest.id} className="hover:bg-gray-50 transition-colors group relative">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                        {guest.idPhoto ? (
                          <img src={guest.idPhoto} alt={guest.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                            {guest.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="font-bold">{guest.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{guest.idNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    <p className="font-medium">{guest.phone}</p>
                    <p className="text-gray-400 text-xs">{guest.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{guest.checkInDate}</td>
                  <td className="px-6 py-4 text-right relative">
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-lg rounded-lg p-1 border border-gray-100">
                      <button 
                        onClick={() => { setEditingGuest(guest); setIsModalOpen(true); }}
                        className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCropModal && scannedImage && (
        <CropModal
          image={scannedImage}
          onCropComplete={(cropped) => {
            setCroppedFace(cropped);
            setShowCropModal(false);
          }}
          onClose={() => setShowCropModal(false)}
        />
      )}

      {/* Guest Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingGuest ? 'Chỉnh sửa thông tin khách' : 'Đăng ký khách lưu trú'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex gap-6">
                  <div className="w-24 h-32 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {croppedFace ? (
                      <img src={croppedFace} alt="Cropped Face" className="w-full h-full object-cover" />
                    ) : editingGuest?.idPhoto ? (
                      <img src={editingGuest.idPhoto} alt="ID Photo" className="w-full h-full object-cover" />
                    ) : scannedImage ? (
                      <img src={scannedImage} alt="Scanned ID" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="text-gray-400" size={32} />
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <input type="file" ref={fileInputRef} onChange={handleScanID} className="hidden" accept="image/*" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-100 py-3 rounded-xl font-bold hover:bg-gray-200">
                      {isScanning ? 'Đang quét thông tin...' : 'Tải lên ảnh CCCD/Passport'}
                    </button>
                    {(scannedImage || editingGuest?.idPhoto) && (
                      <button type="button" onClick={() => setShowCropModal(true)} className="w-full bg-gray-100 py-3 rounded-xl font-bold hover:bg-gray-200">
                        Cắt ảnh mặt
                      </button>
                    )}
                  </div>
                </div>

                <form id="guest-form" onSubmit={handleSaveGuest} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Họ và tên</label>
                      <input name="name" defaultValue={editingGuest?.name} required className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Số CCCD/Passport</label>
                      <input name="idNumber" defaultValue={editingGuest?.idNumber} required className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Số điện thoại</label>
                      <input name="phone" defaultValue={editingGuest?.phone} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                      <input name="email" type="email" defaultValue={editingGuest?.email} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all">
                      {editingGuest ? 'Cập nhật thông tin' : 'Lưu thông tin khách'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FacilitiesManager({ facilities }: { facilities: Facility[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Partial<Facility> | null>(null);

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const facilityData = {
      name: formData.get('name') as string,
      compensationPrice: Number(formData.get('compensationPrice'))
    };

    if (editingFacility?.id) {
      await updateDoc(doc(db, 'facilities', editingFacility.id), facilityData);
    } else {
      await addDoc(collection(db, 'facilities'), facilityData);
    }
    setIsModalOpen(false);
    setEditingFacility(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm">Quản lý danh sách cơ sở vật chất và giá đền bù.</p>
        <button 
          onClick={() => { setEditingFacility({}); setIsModalOpen(true); }}
          className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-gray-800 transition-all"
        >
          <Plus size={18} /> Thêm thiết bị
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {facilities.map(f => (
          <div key={f.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-50 rounded-2xl">
                <Settings className="text-gray-400" size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingFacility(f); setIsModalOpen(true); }} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => deleteDoc(doc(db, 'facilities', f.id))} className="p-1 hover:bg-rose-50 rounded-lg text-rose-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h4 className="font-bold text-lg mb-1">{f.name}</h4>
            <p className="text-xs text-gray-400 font-bold uppercase mb-3">Giá đền bù</p>
            <p className="text-emerald-600 font-bold">{formatCurrency(f.compensationPrice)}</p>
          </div>
        ))}
      </div>

      {/* Facility Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingFacility?.id ? 'Sửa thiết bị' : 'Thêm thiết bị'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveFacility} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Tên thiết bị</label>
                  <input name="name" defaultValue={editingFacility?.name} required className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Giá đền bù (VND)</label>
                  <input name="compensationPrice" type="number" defaultValue={editingFacility?.compensationPrice} required className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all">
                    Lưu thiết bị
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InvoicesManager({ rooms, invoices }: { rooms: Room[], invoices: Invoice[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [electricityNew, setElectricityNew] = useState<number>(0);
  const [electricityOld, setElectricityOld] = useState<number>(0);
  const [confirmDelete, setConfirmDelete] = useState<Invoice | null>(null);
  const [meterImage, setMeterImage] = useState<string | null>(null);
  const [extraServices, setExtraServices] = useState<{ name: string; price: number }[]>([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  const invoiceRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateInvoiceClick = () => {
    setEditingInvoice(null);
    setSelectedRoom(null);
    setElectricityNew(0);
    setElectricityOld(0);
    setExtraServices([]);
    setIsModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    const room = rooms.find(r => r.id === invoice.roomId) || null;
    setSelectedRoom(room);
    setElectricityNew(invoice.electricityNew);
    setElectricityOld(invoice.electricityOld);
    setExtraServices(invoice.extraServices);
    setIsModalOpen(true);
  };

  const handleOCRMeter = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingOCR(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setMeterImage(base64);
      try {
        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{
            parts: [
              { text: "Hãy đọc số điện và mã số đồng hồ (ID No.) từ ảnh này. Trả về JSON gồm: reading (số điện), meterId (mã số đồng hồ). Chỉ trả về JSON." },
              { inlineData: { mimeType: file.type, data: base64.split(',')[1] } }
            ]
          }]
        });
        const text = result.text;
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.reading) setElectricityNew(Number(data.reading));
          // Optionally update selectedRoom's meterId if it's different
          if (data.meterId && selectedRoom) {
             await updateDoc(doc(db, 'rooms', selectedRoom.id), { meterId: data.meterId });
          }
        }
      } catch (err) {
        console.error("OCR Error:", err);
      } finally {
        setIsProcessingOCR(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const electricityUsed = selectedRoom ? Math.max(0, electricityNew - electricityOld) : 0;
  const electricityPrice = calculateElectricity(electricityUsed);
  const waterPrice = 50000;
  const servicesTotal = extraServices.reduce((acc, curr) => acc + curr.price, 0);
  const totalPrice = (selectedRoom?.price || 0) + electricityPrice + waterPrice + servicesTotal;

  const handleCreateInvoice = async () => {
    if (!selectedRoom) return;
    
    // Update room meterId if it was originally empty and now has a value
    const originalRoom = rooms.find(r => r.id === selectedRoom.id);
    if (selectedRoom.meterId && (!originalRoom?.meterId)) {
      await updateDoc(doc(db, 'rooms', selectedRoom.id), { meterId: selectedRoom.meterId });
    }

    const invoiceData = {
      roomId: selectedRoom.id,
      meterId: selectedRoom.meterId || '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      electricityOld,
      electricityNew,
      electricityUsed: electricityNew - electricityOld,
      electricityPrice,
      waterPrice,
      extraServices,
      totalPrice,
      status: 'unpaid',
      createdAt: new Date().toISOString()
    };

    if (editingInvoice) {
      await updateDoc(doc(db, 'invoices', editingInvoice.id), invoiceData);
    } else {
      await addDoc(collection(db, 'invoices'), invoiceData);
      await updateDoc(doc(db, 'rooms', selectedRoom.id), {
        lastElectricityMeter: electricityNew,
        paymentStatus: 'unpaid'
      });
    }
    setIsModalOpen(false);
    setSelectedRoom(null);
    setElectricityNew(0);
    setElectricityOld(0);
    setExtraServices([]);
    setEditingInvoice(null);
  };

  const exportInvoice = async (id: string) => {
    const element = document.getElementById(`invoice-card-${id}`);
    if (element) {
      // Hide elements
      const elementsToHide = element.querySelectorAll('.no-export');
      elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');

      const dataUrl = await toPng(element);
      
      // Show elements back
      elementsToHide.forEach(el => (el as HTMLElement).style.display = '');

      const link = document.createElement('a');
      const room = rooms.find(r => r.id === invoices.find(i => i.id === id)?.roomId);
      const invoice = invoices.find(i => i.id === id);
      link.download = `room${room?.number || 'unknown'}_thang_${invoice?.month || 'unknown'}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm">Quản lý hóa đơn và lịch sử thanh toán.</p>
        <button 
          onClick={handleCreateInvoiceClick}
          className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-gray-800 transition-all"
        >
          <Plus size={18} /> Tạo hóa đơn tháng
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {invoices.map(invoice => {
          const room = rooms.find(r => r.id === invoice.roomId);
          return (
            <div key={invoice.id} id={`invoice-card-${invoice.id}`} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Phòng {room?.number}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tháng {invoice.month}/{invoice.year}</p>
                  {invoice.meterId && <p className="text-[10px] text-gray-400 font-bold uppercase">Mã ĐH: {invoice.meterId}</p>}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity no-export">
                  <button onClick={() => handleEditInvoice(invoice)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => setConfirmDelete(invoice)}
                    className="p-2 hover:bg-rose-50 rounded-lg text-rose-500"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => exportInvoice(invoice.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                    <Download size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tổng cộng:</span>
                  <span className="font-bold">{formatCurrency(invoice.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className={cn(
                    "font-bold",
                    invoice.status === 'paid' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {invoice.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>
              
              {invoice.status === 'unpaid' && (
                <button 
                  onClick={() => updateDoc(doc(db, 'invoices', invoice.id), { status: 'paid' })}
                  className="w-full py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
                >
                  Xác nhận đã thu
                </button>
              )}
            </div>
          );
        })}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm"
          >
            <h3 className="text-xl font-bold mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6 text-sm">Bạn có chắc chắn muốn xóa hóa đơn này? Hành động này sẽ hoàn tác cập nhật chỉ số điện của phòng.</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 p-3 bg-gray-100 rounded-xl font-bold text-sm">Hủy</button>
              <button 
                onClick={async () => {
                  if (confirmDelete) {
                    await deleteDoc(doc(db, 'invoices', confirmDelete.id));
                    const room = rooms.find(r => r.id === confirmDelete.roomId);
                    if (room) {
                      await updateDoc(doc(db, 'rooms', room.id), {
                        lastElectricityMeter: confirmDelete.electricityOld
                      });
                    }
                    setConfirmDelete(null);
                  }
                }}
                className="flex-1 p-3 bg-rose-600 text-white rounded-xl font-bold text-sm"
              >
                Xóa
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Invoice Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingInvoice ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn mới'}</h3>
                <button onClick={() => { setIsModalOpen(false); setEditingInvoice(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Chọn phòng</label>
                    <select 
                      value={selectedRoom?.id || ''}
                      onChange={(e) => {
                        const room = rooms.find(r => r.id === e.target.value) || null;
                        setSelectedRoom(room);
                        if (room && !editingInvoice) {
                          setElectricityOld(room.lastElectricityMeter);
                        }
                      }}
                      className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black"
                    >
                      <option value="">-- Chọn phòng --</option>
                      {rooms
                        .filter(r => 
                          !invoices.some(inv => inv.roomId === r.id && inv.month === new Date().getMonth() + 1 && inv.year === new Date().getFullYear()) 
                          || (editingInvoice && r.id === editingInvoice.roomId)
                        )
                        .map(r => (
                          <option key={r.id} value={r.id}>
                            Phòng {r.number}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Mã đồng hồ điện (No.)</label>
                    <input 
                      type="text"
                      value={selectedRoom?.meterId || ''}
                      onChange={(e) => setSelectedRoom(prev => prev ? {...prev, meterId: e.target.value} : null)}
                      className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Số điện mới</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={electricityNew} 
                        onChange={(e) => setElectricityNew(Number(e.target.value))}
                        className="flex-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "p-3 rounded-xl transition-all",
                          isProcessingOCR ? "bg-gray-100 text-gray-400" : "bg-black text-white hover:bg-gray-800"
                        )}
                        disabled={isProcessingOCR}
                      >
                        {isProcessingOCR ? (
                          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera size={20} />
                        )}
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleOCRMeter} className="hidden" accept="image/*" />
                    </div>
                    {meterImage && (
                      <div className="mt-2">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Ảnh đồng hồ điện:</p>
                        <img src={meterImage} alt="Meter" className="w-full h-32 object-cover rounded-xl border border-gray-200" />
                      </div>
                    )}
                    {selectedRoom && (
                      <div className="text-xs text-gray-500">
                        <p>Số điện cũ: {selectedRoom.lastElectricityMeter} kWh</p>
                        {selectedRoom.meterId && <p className="font-bold">Mã ĐH: {selectedRoom.meterId}</p>}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Dịch vụ thêm</label>
                    <div className="flex gap-2">
                      <input id="service-name" placeholder="Tên dịch vụ" className="flex-1 p-3 bg-gray-50 border-none rounded-xl text-sm" />
                      <input id="service-price" type="number" placeholder="Giá" className="w-24 p-3 bg-gray-50 border-none rounded-xl text-sm" />
                      <button 
                        onClick={() => {
                          const name = (document.getElementById('service-name') as HTMLInputElement).value;
                          const price = Number((document.getElementById('service-price') as HTMLInputElement).value);
                          if (name && price) {
                            setExtraServices([...extraServices, { name, price }]);
                            (document.getElementById('service-name') as HTMLInputElement).value = '';
                            (document.getElementById('service-price') as HTMLInputElement).value = '';
                          }
                        }}
                        className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <div className="space-y-1 mt-2">
                      {extraServices.map((s, i) => (
                        <div key={i} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded-lg">
                          <span>{s.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{formatCurrency(s.price)}</span>
                            <button onClick={() => setExtraServices(extraServices.filter((_, idx) => idx !== i))} className="text-rose-500">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-[2rem] p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-gray-400">Xem trước hóa đơn</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tiền phòng:</span>
                        <span className="font-bold">{formatCurrency(selectedRoom?.price || 0)}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tiền điện ({electricityUsed} kWh):</span>
                          <span className="font-bold">{formatCurrency(electricityPrice)}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Chỉ số: {electricityOld} → {electricityNew}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tiền nước:</span>
                        <span className="font-bold">{formatCurrency(waterPrice)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-500">Dịch vụ:</span>
                        {extraServices.map((s, i) => (
                          <div key={i} className="flex justify-between text-xs pl-2">
                            <span>{s.name}</span>
                            <span>{formatCurrency(s.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-gray-200 mt-6">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tổng thanh toán</p>
                    <h4 className="text-3xl font-black">{formatCurrency(totalPrice)}</h4>
                    <button 
                      onClick={handleCreateInvoice}
                      disabled={!selectedRoom}
                      className="w-full bg-black text-white py-4 rounded-2xl font-bold mt-6 hover:bg-gray-800 transition-all disabled:bg-gray-300"
                    >
                      {editingInvoice ? 'Cập nhật hóa đơn' : 'Xuất hóa đơn'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
