import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Calendar, ChevronDown, ChevronUp, UserPlus, ArrowRight, LogOut } from 'lucide-react';
import { Room, Guest } from '../../types';
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
  onClose: () => void;
  onAddRoommate?: () => void;
  onTransferRoom?: () => void;
  onCheckout?: () => void;
  occupancyHistory?: OccupancyHistoryEntry[];
}

export function RoomDetails({
  room,
  guest,
  onClose,
  onAddRoommate,
  onTransferRoom,
  onCheckout,
  occupancyHistory = []
}: RoomDetailsProps) {

  const [showHistory, setShowHistory] = useState(false);

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
        className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
                {room.number}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Phòng {room.number}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", config.color)}>
                    {config.label}
                  </span>
                  <span className="text-slate-500 text-sm">
                    {room.type === 'single' ? 'Phòng đơn' : 'Phòng đôi'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X size={24} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-6">
          {/* Room Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-2xl border border-blue-200/50">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide mb-1">Giá thuê</p>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(room.price)}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-2xl border border-purple-200/50">
              <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wide mb-1">Đồng hồ</p>
              <p className="text-lg font-bold text-slate-800">{room.lastElectricityMeter} kWh</p>
            </div>
            <div className={cn(
              "p-4 rounded-2xl border",
              room.paymentStatus === 'paid'
                ? "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50"
                : room.paymentStatus === 'unpaid'
                ? "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200/50"
                : "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50"
            )}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1">Thanh toán</p>
              <p className={cn(
                "text-sm font-bold",
                room.paymentStatus === 'paid' ? "text-green-700" :
                room.paymentStatus === 'unpaid' ? "text-rose-700" : "text-amber-700"
              )}>
                {room.paymentStatus === 'paid' ? 'Đã xong' : room.paymentStatus === 'unpaid' ? 'Chưa đóng' : 'Nợ cũ'}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wide mb-1">Cơ sở vật chất</p>
              <p className="text-lg font-bold text-slate-800">{room.facilities?.length || 0} mục</p>
            </div>
          </div>

          {/* Current Occupants Widget */}
          <div className="bg-gradient-to-br from-purple-50/50 to-purple-100/30 backdrop-blur-sm rounded-3xl p-6 border border-purple-200/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-purple-600" />
                Khách lưu trú hiện tại
              </h3>
            </div>

            {guest ? (
              <div className="space-y-4">
                {/* Guest Card */}
                <div className="bg-white rounded-2xl p-4 border border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-500/30">
                      {guest.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{guest.name}</p>
                      <p className="text-sm text-slate-500">{guest.phone}</p>
                      <p className="text-xs text-purple-600 font-semibold mt-1 flex items-center gap-1">
                        <Calendar size={12} />
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
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-200 flex items-center justify-center">
                  <Users size={32} className="text-slate-400" />
                </div>
                <p className="text-slate-600 font-semibold mb-2">Phòng hiện đang trống</p>
                <p className="text-slate-500 text-sm mb-4">Chưa có khách lưu trú</p>
              </div>
            )}
          </div>

          {/* Occupancy History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200">
            <motion.button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-slate-600" />
                Lịch sử thuê phòng
              </h3>
              {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </motion.button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-4"
                >
                  {occupancyHistory.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl">
                      <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-600">Chưa có lịch sử thuê phòng</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Khách</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Từ ngày</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Đến ngày</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {occupancyHistory.map((entry, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <p className="font-semibold text-slate-800">{entry.guestName}</p>
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600">{formatDate(entry.checkIn)}</td>
                              <td className="py-3 px-4 text-sm text-slate-600">
                                {entry.checkOut ? formatDate(entry.checkOut) : '-'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-bold",
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
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
