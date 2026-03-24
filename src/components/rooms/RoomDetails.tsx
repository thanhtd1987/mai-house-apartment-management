import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Calendar, ChevronDown, ChevronUp, UserPlus, ArrowRight, LogOut, Home, Settings, History, Building2, Crown, Shield, Edit3, Trash2, Receipt } from 'lucide-react';
import { Room, Guest, Facility } from '../../types';
import { cn, formatCurrency, formatDate, getRoomGuestsWithDetails, roomHasRepresentative } from '../../utils';
import { RoomServiceManager } from './RoomServiceManager';
import { useDataStore } from '../../stores';

interface OccupancyHistoryEntry {
  guestId: string;
  guestName: string;
  checkIn: string;
  checkOut?: string;
  status: 'completed' | 'cancelled' | 'active';
}

interface RoomDetailsProps {
  room: Room;
  guests: Guest[]; // All guests from database
  facilities?: Facility[];
  onClose: () => void;
  onAddRoommate?: () => void;
  onTransferRoom?: () => void;
  onCheckout?: (guestId?: string) => void; // Optional: specific guest or all
  onChangeRepresentative?: (guestId: string) => void;
  onEditGuest?: (guestId: string) => void;
  occupancyHistory?: OccupancyHistoryEntry[];
}

type TabType = 'overview' | 'services' | 'facilities' | 'history';

export function RoomDetails({
  room,
  guests,
  facilities = [],
  onClose,
  onAddRoommate,
  onTransferRoom,
  onCheckout,
  onChangeRepresentative,
  onEditGuest,
  occupancyHistory = []
}: RoomDetailsProps) {

  const { extraServices } = useDataStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showHistory, setShowHistory] = useState(false);

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'overview', label: 'Tổng quan', icon: Home },
    { key: 'services', label: 'Dịch vụ thêm', icon: Receipt },
    { key: 'facilities', label: 'Cơ sở vật chất', icon: Building2 },
    { key: 'history', label: 'Lịch sử', icon: History }
  ];

  const statusConfig = {
    available: { label: 'Trống', color: 'bg-slate-100 text-slate-700' },
    occupied: { label: 'Đang ở', color: 'bg-green-100 text-green-700' },
    maintenance: { label: 'Bảo trì', color: 'bg-amber-100 text-amber-700' }
  };

  const config = statusConfig[room.status];

  // Get all guests in this room with their details
  const roomGuests = getRoomGuestsWithDetails(room, guests);
  const representative = roomGuests.find(rg => rg.isRepresentative);
  const otherGuests = roomGuests.filter(rg => !rg.isRepresentative);
  const hasGuests = roomGuests.length > 0;
  const hasRepresentative = roomHasRepresentative(room);

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
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold shadow-lg relative">
                {room.number}
                {hasGuests && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold">
                    {roomGuests.length}
                  </div>
                )}
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
                  {hasGuests && (
                    <span className="text-white/80 text-sm">
                      • {roomGuests.length} khách
                    </span>
                  )}
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

                {/* Current Occupants - Enhanced with Multiple Guests */}
                <div className="bg-gradient-to-br from-purple-50/50 to-purple-100/30 backdrop-blur-sm rounded-3xl p-6 border border-purple-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Users size={20} className="text-purple-600" />
                      Khách lưu trú hiện tại
                      <span className="text-sm font-normal text-slate-500">
                        ({roomGuests.length}/{room.type === 'single' ? 2 : 4})
                      </span>
                    </h3>
                  </div>

                  {hasGuests ? (
                    <div className="space-y-4">
                      {/* Representative Card - Prominent */}
                      {representative && (
                        <motion.div
                          layout
                          className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-5 border-2 border-purple-300 shadow-lg"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
                              {representative.guest.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Crown size={18} className="text-purple-600" />
                                <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">
                                  Người đại diện
                                </span>
                              </div>
                              <h4 className="text-xl font-bold text-slate-800">
                                {representative.guest.name}
                              </h4>
                              <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                                <span>📞 {representative.guest.phone}</span>
                                <span>📧 {representative.guest.email}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-sm text-purple-700 font-semibold">
                                <Calendar size={14} />
                                Check-in: {formatDate(representative.checkInDate)}
                              </div>

                              {otherGuests.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-purple-200">
                                  <p className="text-xs text-purple-800">
                                    💡 Người đại diện chịu trách nhiệm thanh toán và là contact chính của phòng
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => onEditGuest?.(representative.guestId)}
                                className="p-2 hover:bg-white rounded-xl transition-colors cursor-pointer"
                                title="Chỉnh sửa thông tin"
                              >
                                <Edit3 size={16} className="text-slate-600" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Other Guests */}
                      {otherGuests.map(og => (
                        <motion.div
                          key={og.guestId}
                          layout
                          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                              {og.guest.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-semibold text-slate-800">{og.guest.name}</h5>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span>📞 {og.guest.phone}</span>
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {formatDate(og.checkInDate)}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => onChangeRepresentative?.(og.guestId)}
                                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                title="Đặt làm người đại diện"
                              >
                                <Crown size={12} />
                                Đại diện
                              </button>
                              <button
                                onClick={() => onEditGuest?.(og.guestId)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <Edit3 size={14} className="text-slate-600" />
                              </button>
                              <button
                                onClick={() => onCheckout?.(og.guestId)}
                                className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Checkout khách này"
                              >
                                <LogOut size={14} className="text-rose-600" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {/* Room Actions */}
                      <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Thao tác phòng:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onAddRoommate}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                          >
                            <UserPlus size={18} />
                            Thêm khách
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
                            onClick={() => onCheckout?.()}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                          >
                            <LogOut size={18} />
                            Trả toàn bộ phòng
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Empty State */
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-200 flex items-center justify-center">
                        <Users size={40} className="text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-semibold text-lg mb-2">Phòng hiện đang trống</p>
                      <p className="text-slate-500 mb-6">Chưa có khách lưu trú</p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onAddRoommate}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                      >
                        <UserPlus size={18} />
                        Gán khách ngay
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <RoomServiceManager
                  roomId={room.id}
                  extraServices={extraServices}
                />
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
