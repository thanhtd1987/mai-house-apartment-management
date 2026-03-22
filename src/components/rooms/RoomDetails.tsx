import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Calendar, ChevronDown, ChevronUp, UserPlus, ArrowRight, LogOut, Home, Settings, History, Building2 } from 'lucide-react';
import { Room, Guest, Facility } from '../../types';
import { cn, formatCurrency, formatDate } from '../../utils';

interface OccupancyHistoryEntry {
  guestId: string;
  guestName: string;
  checkIn: string;
  checkOut?: string;
  status: 'completed' | 'cancelled' | 'active';
}

interface RoomDetailsProps {
  room: Room;
  guest?: Guest;
  facilities?: Facility[];
  onClose: () => void;
  onAddRoommate?: () => void;
  onTransferRoom?: () => void;
  onCheckout?: () => void;
  occupancyHistory?: OccupancyHistoryEntry[];
}

type TabType = 'overview' | 'facilities' | 'history';

export function RoomDetails({
  room,
  guest,
  facilities = [],
  onClose,
  onAddRoommate,
  onTransferRoom,
  onCheckout,
  occupancyHistory = []
}: RoomDetailsProps) {

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showHistory, setShowHistory] = useState(false);

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'overview', label: 'Tổng quan', icon: Home },
    { key: 'facilities', label: 'Cơ sở vật chất', icon: Building2 },
    { key: 'history', label: 'Lịch sử', icon: History }
  ];

  const statusConfig = {
    available: { label: 'Trống', color: 'bg-slate-100 text-slate-700' },
    occupied: { label: 'Đang ở', color: 'bg-green-100 text-green-700' },
    maintenance: { label: 'Bảo trì', color: 'bg-amber-100 text-amber-700' }
  };

  const config = statusConfig[room.status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {room.number}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Phòng {room.number}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn("px-3 py-1 rounded-full text-sm font-bold uppercase", config.color)}>
                    {config.label}
                  </span>
                  <span className="text-white/80 text-sm">
                    {room.type === 'single' ? 'Phòng đơn' : 'Phòng đôi'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
            >
              <X size={28} className="text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all cursor-pointer",
                  activeTab === tab.key
                    ? "bg-white text-blue-600 shadow-lg"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-220px)]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 rounded-2xl border border-blue-200/50">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide mb-2">Giá thuê</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(room.price)}</p>
                    <p className="text-xs text-slate-500 mt-1">/tháng</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 rounded-2xl border border-purple-200/50">
                    <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wide mb-2">Đồng hồ</p>
                    <p className="text-xl font-bold text-slate-800">{room.lastElectricityMeter}</p>
                    <p className="text-xs text-slate-500 mt-1">kWh</p>
                  </div>
                  <div className={cn(
                    "p-5 rounded-2xl border",
                    room.paymentStatus === 'paid'
                      ? "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50"
                      : room.paymentStatus === 'unpaid'
                      ? "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200/50"
                      : "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50"
                  )}>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-2">Thanh toán</p>
                    <p className={cn(
                      "text-lg font-bold",
                      room.paymentStatus === 'paid' ? "text-green-700" :
                      room.paymentStatus === 'unpaid' ? "text-rose-700" : "text-amber-700"
                    )}>
                      {room.paymentStatus === 'paid' ? 'Đã xong' : room.paymentStatus === 'unpaid' ? 'Chưa đóng' : 'Nợ cũ'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wide mb-2">Cơ sở vật chất</p>
                    <p className="text-xl font-bold text-slate-800">{room.facilities?.length || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">mục</p>
                  </div>
                </div>

                {/* Current Occupants */}
                <div className="bg-gradient-to-br from-purple-50/50 to-purple-100/30 backdrop-blur-sm rounded-3xl p-6 border border-purple-200/50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Users size={20} className="text-purple-600" />
                    Khách lưu trú hiện tại
                  </h3>

                  {guest ? (
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl p-5 border border-purple-100">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/30">
                            {guest.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 text-xl">{guest.name}</p>
                            <p className="text-slate-500">{guest.phone}</p>
                            <p className="text-sm text-purple-600 font-semibold mt-2 flex items-center gap-2">
                              <Calendar size={14} />
                              Check-in: {formatDate(guest.checkInDate)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={onAddRoommate}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                        >
                          <UserPlus size={18} />
                          Thêm người ở cùng
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={onTransferRoom}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                        >
                          <ArrowRight size={18} />
                          Chuyển phòng
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={onCheckout}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                        >
                          <LogOut size={18} />
                          Trả phòng
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-200 flex items-center justify-center">
                        <Users size={40} className="text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-semibold text-lg mb-2">Phòng hiện đang trống</p>
                      <p className="text-slate-500">Chưa có khách lưu trú</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'facilities' && (
              <motion.div
                key="facilities"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Building2 size={20} className="text-blue-600" />
                  Cơ sở vật chất trong phòng
                </h3>

                {room.facilities && room.facilities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {room.facilities.map(fid => {
                      const facility = facilities.find(f => f.id === fid);
                      if (!facility) return null;
                      return (
                        <motion.div
                          key={fid}
                          whileHover={{ scale: 1.02 }}
                          className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 rounded-2xl border border-blue-200/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl">
                              {facility.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{facility.name}</p>
                              <p className="text-sm text-slate-500">{facility.description || 'Không có mô tả'}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl">
                    <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600">Phòng chưa có cơ sở vật chất</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <History size={20} className="text-blue-600" />
                  Lịch sử thuê phòng
                </h3>

                {occupancyHistory.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl">
                    <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600">Chưa có lịch sử thuê phòng</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Khách</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Từ ngày</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Đến ngày</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {occupancyHistory.map((entry, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6">
                                <p className="font-semibold text-slate-800">{entry.guestName}</p>
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-600">{formatDate(entry.checkIn)}</td>
                              <td className="py-4 px-6 text-sm text-slate-600">
                                {entry.checkOut ? formatDate(entry.checkOut) : '-'}
                              </td>
                              <td className="py-4 px-6">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold",
                                  entry.status === 'completed' ? "bg-green-100 text-green-700" :
                                  entry.status === 'cancelled' ? "bg-rose-100 text-rose-700" :
                                  "bg-blue-100 text-blue-700"
                                )}>
                                  {entry.status === 'completed' ? 'Đã hoàn thành' :
                                   entry.status === 'cancelled' ? 'Đã hủy' : 'Đang ở'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
