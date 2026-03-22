import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Users, MapPin, Calendar, Check } from 'lucide-react';
import { Room, Guest } from '../../types';
import { Button } from '../common/Button';
import { cn, formatDate } from '../../utils';

interface AssignRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (guestId: string, roomId: string, checkInDate: string) => Promise<void>;
  availableRooms: Room[];
  guests: Guest[];
}

export function AssignRoomModal({
  isOpen,
  onClose,
  onAssign,
  availableRooms,
  guests
}: AssignRoomModalProps) {
  const [selectedGuest, setSelectedGuest] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [guestSearch, setGuestSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredGuests = guests.filter(g =>
    !selectedRoom || availableRooms.find(r => r.id === selectedRoom)?.currentGuestId !== g.id
  ).filter(g =>
    g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
    g.idNumber.includes(guestSearch)
  );

  const handleAssign = async () => {
    if (!selectedGuest || !selectedRoom) return;

    setIsSubmitting(true);
    try {
      await onAssign(selectedGuest, selectedRoom, checkInDate);
      onClose();
      // Reset form
      setSelectedGuest('');
      setSelectedRoom('');
      setCheckInDate(new Date().toISOString().split('T')[0]);
      setGuestSearch('');
    } catch (error) {
      console.error('Error assigning room:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = selectedGuest && selectedRoom && checkInDate;

  if (!isOpen) return null;

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
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Gán phòng cho khách</h2>
              <p className="text-purple-100 mt-1">Kết nối khách với phòng trống</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
            >
              <span className="text-white text-2xl">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)] space-y-8">
          {/* Step 1: Select Guest */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Chọn khách</h3>
            </div>

            {/* Guest Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc số CCCD..."
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Guest List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {filteredGuests.map(guest => (
                <motion.button
                  key={guest.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedGuest(guest.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all cursor-pointer",
                    selectedGuest === guest.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 hover:border-purple-300 bg-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {guest.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{guest.name}</p>
                      <p className="text-xs text-slate-500">{guest.idNumber}</p>
                    </div>
                    {selectedGuest === guest.id && (
                      <Check size={20} className="text-purple-600" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Room */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Chọn phòng</h3>
            </div>

            {/* Room List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {availableRooms.map(room => (
                <motion.button
                  key={room.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRoom(room.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all cursor-pointer",
                    selectedRoom === room.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold text-slate-800">Phòng {room.number}</span>
                    {selectedRoom === room.id && (
                      <Check size={20} className="text-blue-600" />
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-600">
                      {room.type === 'single' ? 'Phòng đơn' : 'Phòng đôi'}
                    </p>
                    <p className="font-semibold text-blue-600">
                      {room.price.toLocaleString()} VNĐ/tháng
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Step 3: Check-in Date */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Ngày bắt đầu ở</h3>
            </div>

            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Summary */}
          {selectedGuest && selectedRoom && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200"
            >
              <h4 className="font-bold text-slate-800 mb-3">Xác nhận thông tin</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Khách:</span>
                  <span className="font-semibold text-slate-800">
                    {guests.find(g => g.id === selectedGuest)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Phòng:</span>
                  <span className="font-semibold text-slate-800">
                    Phòng {availableRooms.find(r => r.id === selectedRoom)?.number}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Ngày vào:</span>
                  <span className="font-semibold text-slate-800">{formatDate(checkInDate)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-8 py-6 bg-slate-50 flex gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Hủy
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isSubmitting ? 'Đang gán...' : 'Gán phòng'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
