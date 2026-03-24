import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User as UserIcon, Info } from 'lucide-react';
import { Room, Guest } from '../../types';
import { RoomSelectionCard } from './RoomSelectionCard';
import { CheckInDatePicker } from './CheckInDatePicker';
import { Button } from '../common/Button';
import { cn } from '../../utils';

interface AssignRoomsToGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (guestId: string, roomIds: string[], checkInDate: string) => Promise<void>;
  rooms: Room[];
  guests: Guest[];
  preselectedGuestId: string;
}

export function AssignRoomsToGuestModal({
  isOpen,
  onClose,
  onAssign,
  rooms,
  guests,
  preselectedGuestId
}: AssignRoomsToGuestModalProps) {
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [checkInDate, setCheckInDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedGuest = guests.find(g => g.id === preselectedGuestId);
  const selectedRooms = rooms.filter(r => selectedRoomIds.includes(r.id));

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedRoomIds([]);
      setCheckInDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const handleToggleRoom = (roomId: string) => {
    if (selectedRoomIds.includes(roomId)) {
      setSelectedRoomIds(prev => prev.filter(id => id !== roomId));
    } else {
      setSelectedRoomIds(prev => [...prev, roomId]);
    }
  };

  const handleAssign = async () => {
    if (selectedRoomIds.length === 0 || !selectedGuest) return;

    setIsSubmitting(true);
    try {
      await onAssign(selectedGuest.id, selectedRoomIds, checkInDate);
      onClose();
    } catch (error) {
      console.error('Error assigning rooms to guest:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const canSubmit = selectedRoomIds.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Gán phòng cho khách</h2>
                  <p className="text-purple-100 text-sm mt-1">
                    Chọn một hoặc nhiều phòng để gán cho khách này
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Locked Guest Info */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-purple-900">
                        {selectedGuest?.name || 'Khách không tìm thấy'}
                      </h3>
                      <span className="rounded-full bg-purple-200 px-2 py-0.5 text-xs font-bold text-purple-800">
                        ĐÃ CHỌN
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 font-mono">
                      ID: {selectedGuest?.idNumber || 'N/A'}
                    </p>
                    {selectedGuest?.phone && (
                      <p className="text-sm text-purple-700 mt-1">
                        📞 {selectedGuest.phone}
                      </p>
                    )}
                  </div>
                  <div className="bg-purple-100 rounded-full p-2">
                    <Info className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Info about room sharing */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-3">
                <p className="text-sm text-blue-800">
                  💡 <span className="font-semibold">Lưu ý:</span> Bạn có thể chọn nhiều phòng, bao gồm cả phòng đã có khách để ghép chung.
                </p>
              </div>

              {/* Check-in Date */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Calendar className="h-4 w-4" />
                  Ngày nhận phòng
                </label>
                <CheckInDatePicker
                  value={checkInDate}
                  onChange={setCheckInDate}
                />
              </div>

              {/* Room Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">
                    Chọn phòng {selectedRoomIds.length > 0 && `(${selectedRoomIds.length})`}
                  </h3>
                  {selectedRoomIds.length > 0 && (
                    <button
                      onClick={() => setSelectedRoomIds([])}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rooms.length === 0 ? (
                    <div className="col-span-full text-center py-8 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-500">Không có phòng nào</p>
                    </div>
                  ) : (
                    rooms.map(room => (
                      <RoomSelectionCard
                        key={room.id}
                        room={room}
                        guests={guests}
                        isSelected={selectedRoomIds.includes(room.id)}
                        onClick={() => handleToggleRoom(room.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Selected Rooms Summary */}
              {selectedRooms.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-4">
                  <h4 className="font-bold text-emerald-900 text-sm mb-2">
                    ✓ {selectedRooms.length} phòng đã chọn
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRooms.map(room => {
                      const guestsInRoom = room.guests?.length || 0;
                      return (
                        <span
                          key={room.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-medium text-emerald-700 border border-emerald-200"
                        >
                          {room.number}
                          <span className="text-xs text-emerald-500">
                            ({guestsInRoom}/{room.capacity})
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex gap-3 flex-shrink-0">
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
                className={cn(
                  "flex-1",
                  selectedRoomIds.length > 0
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    : ""
                )}
              >
                {isSubmitting
                  ? 'Đang xử lý...'
                  : `Xác nhận gán ${selectedRoomIds.length > 0 ? `(${selectedRoomIds.length} phòng)` : ''}`
                }
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
