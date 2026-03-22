import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Phone, Mail, Calendar, CreditCard, Home, User, FileText, ChevronRight } from 'lucide-react';
import { Guest, Room, Facility } from '../../types';
import { cn, formatDate } from '../../utils';

interface GuestDetailsProps {
  guest: Guest;
  room?: Room;
  facilities?: Facility[];
  onClose: () => void;
  onAssignRoom?: () => void;
  onEdit?: () => void;
  onCheckoutRoom?: () => void;
}

type TabType = 'profile' | 'room' | 'contract';

export function GuestDetails({
  guest,
  room,
  facilities = [],
  onClose,
  onAssignRoom,
  onEdit,
  onCheckoutRoom
}: GuestDetailsProps) {

  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'profile', label: 'Hồ sơ', icon: User },
    { key: 'room', label: 'Căn hộ', icon: Home },
    { key: 'contract', label: 'Hợp đồng', icon: FileText }
  ];

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
        className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                {guest.idPhoto ? (
                  <img
                    src={guest.idPhoto}
                    alt={guest.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  guest.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{guest.name}</h2>
                <p className="text-white/80 mt-1">{guest.idNumber}</p>
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
                    ? "bg-white text-purple-600 shadow-lg"
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
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Contact Information */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50/30 rounded-3xl p-6 border border-purple-200/50">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Phone size={20} className="text-purple-600" />
                    Thông tin liên hệ
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Phone size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Điện thoại</p>
                        <p className="text-lg font-semibold text-slate-800">{guest.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                        <Mail size={20} className="text-pink-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Email</p>
                        <p className="text-lg font-semibold text-slate-800">{guest.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Check-in Information */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50/30 rounded-3xl p-6 border border-blue-200/50">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600" />
                    Thời gian lưu trú
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Calendar size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">Ngày check-in</p>
                      <p className="text-lg font-semibold text-slate-800">{formatDate(guest.checkInDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onEdit}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                  >
                    <User size={18} />
                    Chỉnh sửa thông tin
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCheckoutRoom}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                  >
                    <Calendar size={18} />
                    Trả phòng
                  </motion.button>
                </div>
              </motion.div>
            )}

            {activeTab === 'room' && (
              <motion.div
                key="room"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {room ? (
                  <>
                    {/* Room Location */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50/30 rounded-3xl p-6 border border-blue-200/50">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <MapPin size={20} className="text-blue-600" />
                        Vị trí hiện tại
                      </h3>
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                          {room.number}
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-800">Phòng {room.number}</p>
                          <p className="text-slate-600">
                            {room.type === 'single' ? 'Phòng đơn (1-2 người)' : 'Phòng đôi (3-4 người)'}
                          </p>
                          <p className="text-lg font-bold text-blue-600 mt-2">
                            {room.price.toLocaleString()} VNĐ/tháng
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Room Facilities */}
                    {room.facilities && room.facilities.length > 0 && (
                      <div className="bg-white rounded-3xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Cơ sở vật chất trong phòng</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {room.facilities.map(fid => {
                            const facility = facilities.find(f => f.id === fid);
                            if (!facility) return null;
                            return (
                              <div
                                key={fid}
                                className="bg-slate-50 p-3 rounded-xl flex items-center gap-2"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                                  {facility.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-slate-700">{facility.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Floor Plan Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                    >
                      <MapPin size={20} />
                      Xem sơ đồ tầng
                      <ChevronRight size={20} />
                    </motion.button>
                  </>
                ) : (
                  <div className="text-center py-16 bg-slate-50 rounded-3xl">
                    <Home size={64} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-xl font-bold text-slate-800 mb-2">Chưa phân phòng</p>
                    <p className="text-slate-500 mb-6">Khách chưa được gán phòng nào</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onAssignRoom}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                    >
                      Gán phòng ngay
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'contract' && (
              <motion.div
                key="contract"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {room ? (
                  <>
                    {/* Contract Summary */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50/30 rounded-3xl p-6 border border-green-200/50">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <CreditCard size={20} className="text-green-600" />
                        Thông tin hợp đồng
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Phòng</p>
                          <p className="font-bold text-slate-800">Phòng {room.number}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Loại phòng</p>
                          <p className="font-bold text-slate-800">
                            {room.type === 'single' ? 'Phòng đơn' : 'Phòng đôi'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Giá thuê</p>
                          <p className="font-bold text-blue-600">{room.price.toLocaleString()} VNĐ</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Ngày bắt đầu</p>
                          <p className="font-bold text-slate-800">{formatDate(guest.checkInDate)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className={cn(
                      "rounded-3xl p-6 border",
                      room.paymentStatus === 'paid'
                        ? "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50"
                        : room.paymentStatus === 'unpaid'
                        ? "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200/50"
                        : "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50"
                    )}>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Trạng thái thanh toán</h3>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          room.paymentStatus === 'paid'
                            ? "bg-green-100"
                            : room.paymentStatus === 'unpaid'
                            ? "bg-rose-100"
                            : "bg-amber-100"
                        )}>
                          <CreditCard size={24} className={cn(
                            room.paymentStatus === 'paid'
                              ? "text-green-600"
                              : room.paymentStatus === 'unpaid'
                              ? "text-rose-600"
                              : "text-amber-600"
                          )} />
                        </div>
                        <div>
                          <p className={cn(
                            "text-xl font-bold",
                            room.paymentStatus === 'paid'
                              ? "text-green-700"
                              : room.paymentStatus === 'unpaid'
                              ? "text-rose-700"
                              : "text-amber-700"
                          )}>
                            {room.paymentStatus === 'paid' ? 'Đã thanh toán' :
                             room.paymentStatus === 'unpaid' ? 'Chưa thanh toán' : 'Có nợ cũ'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 bg-slate-50 rounded-3xl">
                    <FileText size={64} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-xl font-bold text-slate-800 mb-2">Chưa có hợp đồng</p>
                    <p className="text-slate-500">Vui lòng gán phòng để tạo hợp đồng</p>
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
