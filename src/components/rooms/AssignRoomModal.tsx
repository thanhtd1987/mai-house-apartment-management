import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, Calendar, Crown, X, Check } from 'lucide-react';
import { Room, Guest } from '../../types';
import { Button } from '../common/Button';
import { cn, formatDate, getRoomGuestsWithDetails } from '../../utils';

interface AssignRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (guestIds: string[], roomId: string, checkInDate: string, representativeId: string) => Promise<void>;
  availableRooms: Room[];
  allRooms: Room[];
  guests: Guest[];
  preselectedGuestId?: string;
  preselectedRoomId?: string;
  mode?: 'assign' | 'transfer';
}

export function AssignRoomModal({
  isOpen,
  onClose,
  onAssign,
  availableRooms,
  allRooms,
  guests,
  preselectedGuestId,
  preselectedRoomId,
  mode = 'assign'
}: AssignRoomModalProps) {
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [representativeId, setRepresentativeId] = useState<string>('');
  const [guestSearch, setGuestSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRoomObj = allRooms.find(r => r.id === selectedRoom);
  const existingGuests = selectedRoomObj ? getRoomGuestsWithDetails(selectedRoomObj, guests) : [];
  const existingRepresentative = existingGuests.find(eg => eg.isRepresentative);

  const filteredGuests = guests.filter(g => {
    if (selectedRoom) {
      const room = allRooms.find(r => r.id === selectedRoom);
      if (room) {
        const guestIdsInRoom = room.guests?.map(g => g.guestId) || [];
        if (guestIdsInRoom.includes(g.id)) {
          return false;
        }
      }
    }
    return g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
           g.idNumber.includes(guestSearch);
  });

  useEffect(() => {
    if (isOpen) {
      if (preselectedGuestId) {
        setSelectedGuests([preselectedGuestId]);
      }
      if (preselectedRoomId) {
        setSelectedRoom(preselectedRoomId);
      }
      // Auto-select existing representative if no new guests selected
      if (existingRepresentative && selectedGuests.length === 0) {
        setRepresentativeId(existingRepresentative.guestId);
      }
    }
  }, [isOpen, preselectedGuestId, preselectedRoomId, existingRepresentative]);

  useEffect(() => {
    // When new guests are added and no existing rep, auto-select first guest
    if (selectedGuests.length > 0 && !existingRepresentative && !representativeId) {
      setRepresentativeId(selectedGuests[0]);
    }
  }, [selectedGuests, existingRepresentative, representativeId]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedGuests([]);
      setSelectedRoom('');
      setGuestSearch('');
      setRepresentativeId('');
    }
  }, [isOpen]);

  const handleToggleGuest = (guestId: string) => {
    if (selectedGuests.includes(guestId)) {
      // Remove guest
      const newSelection = selectedGuests.filter(id => id !== guestId);
      setSelectedGuests(newSelection);
      if (representativeId === guestId) {
        setRepresentativeId('');
        if (newSelection.length > 0 && !existingRepresentative) {
          setRepresentativeId(newSelection[0]);
        } else if (existingRepresentative) {
          setRepresentativeId(existingRepresentative.guestId);
        }
      }
    } else {
      // Add guest
      setSelectedGuests([...selectedGuests, guestId]);
      if (selectedGuests.length === 0 && !existingRepresentative && !representativeId) {
        setRepresentativeId(guestId);
      }
    }
  };

  const handleAssign = async () => {
    if (selectedGuests.length === 0 || !selectedRoom) return;

    const finalRepresentativeId = representativeId || existingRepresentative?.guestId || selectedGuests[0];

    setIsSubmitting(true);
    try {
      await onAssign(selectedGuests, selectedRoom, checkInDate, finalRepresentativeId);
      onClose();
    } catch (error) {
      console.error('Error assigning room:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const showRoomSelection = mode === 'transfer';
  const canSubmit = selectedGuests.length > 0 && selectedRoom;

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {existingGuests.length > 0 ? 'Thêm khách vào phòng' : 'Gán phòng cho khách'}
                  </h2>
                  <p className="text-purple-100 text-sm mt-0.5">
                    {existingGuests.length > 0
                      ? `Phòng ${selectedRoomObj?.number} • ${existingGuests.length} khách`
                      : 'Kết nối khách với phòng'}
                  </p>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Existing Guests - Selection View */}
              {existingGuests.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                    <Users size={16} className="text-blue-600" />
                    Khách đang ở ({existingGuests.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {existingGuests.map(eg => (
                      <div key={eg.guestId} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-blue-200">
                        {eg.isRepresentative && <Crown size={14} className="text-purple-600 shrink-0" />}
                        <span className="font-semibold text-slate-800 text-sm">{eg.guest.name}</span>
                        {eg.isRepresentative && (
                          <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Đại diện</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Room Info */}
              {!showRoomSelection && selectedRoom && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                      {selectedRoomObj?.number}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Phòng {selectedRoomObj?.number}</h3>
                      <p className="text-xs text-slate-600">{selectedRoomObj?.type === 'single' ? 'Phòng đơn' : 'Phòng đôi'} • {selectedRoomObj?.price.toLocaleString()} VNĐ</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Guest Selection - Click to select (Multi-select, no checkboxes) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">
                    Chọn khách {selectedGuests.length > 0 && `(${selectedGuests.length})`}
                  </h3>
                  {selectedGuests.length > 0 && (
                    <button onClick={() => { setSelectedGuests([]); setRepresentativeId(existingRepresentative?.guestId || ''); }} className="text-xs text-rose-600 hover:text-rose-700 font-semibold">
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Tìm khách..."
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Guest Grid - Click to select, Highlight only (NO CHECKBOX) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredGuests.length === 0 ? (
                    <div className="col-span-full text-center py-6 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">Không tìm thấy khách nào</p>
                    </div>
                  ) : (
                    filteredGuests.map(guest => {
                      const isSelected = selectedGuests.includes(guest.id);

                      return (
                        <motion.button
                          key={guest.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleToggleGuest(guest.id)}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left transition-all relative",
                            isSelected
                              ? "border-purple-500 bg-purple-50 shadow-md"
                              : "border-slate-200 hover:border-purple-300 bg-white hover:shadow-md"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
                              {guest.name.charAt(0)}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800 text-sm">{guest.name}</p>
                              <p className="text-xs text-slate-500">{guest.idNumber}</p>
                              <p className="text-xs text-slate-400">{guest.phone}</p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Representative Selection - Radio Buttons */}
              {(selectedGuests.length > 0 || existingRepresentative) && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                    <Crown size={16} className="text-amber-600" />
                    Chọn người đại diện
                  </h3>
                  <p className="text-xs text-slate-600 mb-3">
                    Chọn 1 người làm người đại diện (chịu trách nhiệm thanh toán)
                  </p>

                  {/* Representative options - Grid layout with Radio buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Existing representative */}
                    {existingRepresentative && (
                      <button
                        onClick={() => setRepresentativeId(existingRepresentative.guestId)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                          representativeId === existingRepresentative.guestId
                            ? "border-amber-500 bg-amber-100"
                            : "border-slate-200 hover:border-amber-300 bg-white"
                        )}
                      >
                        <input
                          type="radio"
                          name="representative"
                          checked={representativeId === existingRepresentative.guestId}
                          onChange={() => setRepresentativeId(existingRepresentative.guestId)}
                          className="w-5 h-5 text-amber-600 shrink-0 cursor-pointer"
                        />
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm shrink-0">
                          {existingRepresentative.guest.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{existingRepresentative.guest.name}</p>
                          <p className="text-xs text-amber-700">Đại diện hiện tại</p>
                        </div>
                        {representativeId === existingRepresentative.guestId && <Crown size={16} className="text-amber-600 shrink-0" />}
                      </button>
                    )}

                    {/* New guests */}
                    {selectedGuests.map(guestId => {
                      const guest = guests.find(g => g.id === guestId)!;
                      const isRep = representativeId === guestId;

                      return (
                        <button
                          key={guestId}
                          onClick={() => setRepresentativeId(guestId)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                            isRep
                              ? "border-amber-500 bg-amber-100"
                              : "border-slate-200 hover:border-amber-300 bg-white"
                          )}
                        >
                          <input
                            type="radio"
                            name="representative"
                            checked={isRep}
                            onChange={() => setRepresentativeId(guestId)}
                            className="w-5 h-5 text-amber-600 shrink-0 cursor-pointer"
                          />
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {guest.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{guest.name}</p>
                            <p className="text-xs text-slate-500">Khách mới</p>
                          </div>
                          {isRep && <Crown size={16} className="text-amber-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Check-in Date */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Ngày bắt đầu ở</h3>

                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />

                {/* Quick Select */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCheckInDate(new Date().toISOString().split('T')[0])} className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-semibold">
                    Hôm nay
                  </button>
                  <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - 1); setCheckInDate(d.toISOString().split('T')[0]); }} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                    Hôm qua
                  </button>
                  <button onClick={() => { const d = new Date(); d.setDate(1); setCheckInDate(d.toISOString().split('T')[0]); }} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                    Đầu tháng
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex gap-3 flex-shrink-0">
              <Button onClick={onClose} variant="secondary" className="flex-1">
                Hủy
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!canSubmit || isSubmitting}
                loading={isSubmitting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isSubmitting ? 'Đang xử lý...' : `Xác nhận (${selectedGuests.length} khách)`}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
