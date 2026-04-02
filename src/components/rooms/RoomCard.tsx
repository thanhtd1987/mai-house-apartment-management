import React from 'react';
import { motion } from 'motion/react';
import { Edit3, Trash2, User, ChevronRight, Users, FileText, Sparkles } from 'lucide-react';
import { Room, Guest } from '../../types';
import { cn, formatCurrency } from '../../utils';

interface RoomCardProps {
  room: Room;
  guest?: Guest;
  onEdit: (room: Room) => void;
  onDelete: (roomId: string) => void;
  onViewGuest?: (guestId: string) => void;
  onAssignGuest?: () => void;
  onCreateInvoice?: (room: Room) => void;
  onCardClick?: () => void;
}

export function RoomCard({ room, guest, onEdit, onDelete, onViewGuest, onAssignGuest, onCreateInvoice, onCardClick }: RoomCardProps) {
  const statusConfig = {
    available: { label: 'Trống', color: 'bg-slate-100 text-slate-700', dotColor: 'bg-slate-400' },
    occupied: { label: 'Đang ở', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
    maintenance: { label: 'Bảo trì', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-500' }
  };

  const config = statusConfig[room.status];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative"
      onClick={onCardClick}
    >
      {/* Glassmorphism Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
        {/* Top gradient accent */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

        <div className="p-4 md:p-6 space-y-3 md:space-y-4">
          {/* Header - Room Number & Actions */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2 flex-wrap">
                <h3 className="text-xl md:text-2xl font-bold text-slate-800">Phòng {room.number}</h3>
                <span className={cn(
                  "px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide",
                  config.color
                )}>
                  {config.label}
                </span>
                {room.hasSmartLock && (
                  <span title="Có smart lock" className="text-sm md:text-base">
                    🔒
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-slate-500">
                {room.type === 'single' ? 'Phòng đơn (1-2 người)' : 'Phòng đôi (3-4 người)'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1 md:gap-2 opacity-100 lg:opacity-40 lg:group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onEdit(room);
                }}
                className="p-2 md:p-2.5 hover:bg-blue-50 rounded-xl text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                aria-label="Chỉnh sửa phòng"
              >
                <Edit3 size={16} className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              {room.status === 'occupied' && onCreateInvoice && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onCreateInvoice(room);
                  }}
                  className="p-2 md:p-2.5 hover:bg-emerald-50 rounded-xl text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer relative"
                  aria-label="Tạo hóa đơn"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 opacity-0 hover:opacity-100"
                  >
                    <Sparkles size={16} className="text-emerald-500 w-4 h-4 md:w-5 md:h-5" />
                  </motion.div>
                  <FileText size={16} className="w-4 h-4 md:w-5 md:h-5" />
                </motion.button>
              )}
              <button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDelete(room.id);
                }}
                className="p-2 md:p-2.5 hover:bg-rose-50 rounded-xl text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                aria-label="Xóa phòng"
              >
                <Trash2 size={16} className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* Guest Information Section */}
          {guest ? (
            <div className="bg-purple-50/50 backdrop-blur-sm rounded-2xl p-4 border border-purple-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30">
                    {guest.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-bold uppercase tracking-wide mb-0.5">
                      Người thuê
                    </p>
                    <p className="text-sm font-semibold text-slate-800">{guest.name}</p>
                  </div>
                </div>
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onViewGuest?.(guest.id);
                  }}
                  className="text-purple-600 hover:text-purple-700 text-sm font-semibold flex items-center gap-1 px-3 py-2 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
                >
                  Xem hồ sơ <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-0.5">
                      Chưa có khách
                    </p>
                    <p className="text-sm text-slate-400">Phòng trống</p>
                  </div>
                </div>
                {room.status === 'available' && (
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onAssignGuest?.();
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 px-3 py-2 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                  >
                    + Gán khách <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Price */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-2xl border border-blue-200/50">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide mb-1">
                Giá thuê
              </p>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(room.price)}</p>
            </div>

            {/* Payment Status */}
            <div className={cn(
              "p-4 rounded-2xl border",
              room.paymentStatus === 'paid'
                ? "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50"
                : room.paymentStatus === 'unpaid'
                ? "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200/50"
                : "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50"
            )}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1">
                Thanh toán
              </p>
              <p className={cn(
                "text-sm font-bold",
                room.paymentStatus === 'paid'
                  ? "text-green-700"
                  : room.paymentStatus === 'unpaid'
                  ? "text-rose-700"
                  : "text-amber-700"
              )}>
                {room.paymentStatus === 'paid' ? '✓ Đã xong' : room.paymentStatus === 'unpaid' ? '⏳ Chưa đóng' : '⚠️ Nợ cũ'}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
            <span className="text-slate-500">Số điện:</span>
            <span className="font-semibold text-slate-800">{room.lastElectricityMeter} kWh</span>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </motion.div>
  );
}
