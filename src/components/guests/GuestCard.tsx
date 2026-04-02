import React from 'react';
import { motion } from 'motion/react';
import { Edit3, Trash2, MapPin, Phone, Mail, Calendar, ChevronRight } from 'lucide-react';
import { Guest, Room } from '../../types';
import { cn, formatDate } from '../../utils';

interface GuestCardProps {
  guest: Guest;
  room?: Room;
  onEdit: (guest: Guest) => void;
  onDelete: (guestId: string) => void;
  onViewDetails?: (guestId: string) => void;
  onAssignRoom?: (guestId: string) => void;
  onCardClick?: () => void;
}

export function GuestCard({ guest, room, onEdit, onDelete, onViewDetails, onAssignRoom, onCardClick }: GuestCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative cursor-pointer"
      onClick={onCardClick}
    >
      {/* Glassmorphism Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
        {/* Top gradient accent */}
        <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />

        <div className="p-4 md:p-6 space-y-3 md:space-y-4">
          {/* Header - Guest Info & Actions */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-base md:text-xl font-bold shadow-lg shadow-purple-500/30 shrink-0">
                {guest.idPhoto ? (
                  <img
                    src={guest.idPhoto}
                    alt={guest.name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  getInitials(guest.name)
                )}
              </div>

              {/* Guest Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-xl font-bold text-slate-800 truncate">{guest.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs md:text-sm text-slate-500 truncate">{guest.idNumber}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1 md:gap-2 opacity-100 lg:opacity-40 lg:group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onEdit(guest);
                }}
                className="p-2 md:p-2.5 hover:bg-purple-50 rounded-xl text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                aria-label="Chỉnh sửa khách"
              >
                <Edit3 size={16} className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDelete(guest.id);
                }}
                className="p-2 md:p-2.5 hover:bg-rose-50 rounded-xl text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                aria-label="Xóa khách"
              >
                <Trash2 size={16} className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* Room Location */}
          {room ? (
            <div className="bg-blue-50/50 backdrop-blur-sm rounded-2xl p-4 border border-blue-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                    {room.number}
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-0.5">
                      📍 Đang lưu trú tại
                    </p>
                    <p className="text-sm font-semibold text-slate-800">Phòng {room.number}</p>
                  </div>
                </div>
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onViewDetails?.(guest.id);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 px-3 py-2 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                >
                  Chi tiết <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-0.5">
                      Chưa phân phòng
                    </p>
                    <p className="text-sm text-slate-400">Khách chưa được gán phòng</p>
                  </div>
                </div>
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onAssignRoom?.(guest.id);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 px-3 py-2 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                >
                  + Gán phòng <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Contact Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-3 rounded-2xl border border-slate-200/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Phone size={16} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Điện thoại</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{guest.phone}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-3 rounded-2xl border border-slate-200/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                <Mail size={16} className="text-pink-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Email</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{guest.email}</p>
              </div>
            </div>
          </div>

          {/* Check-in Date */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar size={16} className="text-purple-500" />
              <span>Ngày vào:</span>
              <span className="font-semibold text-slate-800">{formatDate(guest.checkInDate)}</span>
            </div>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </motion.div>
  );
}
