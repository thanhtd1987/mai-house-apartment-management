import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Calendar, Users, Check } from 'lucide-react';
import { Room, Guest } from '../../types';
import { Button } from '../common/Button';
import { cn, formatDate, formatCurrency } from '../../utils';

interface TransferRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (guestId: string, fromRoomId: string, toRoomId: string) => Promise<void>;
  currentRoom: Room;
  guest: Guest;
  availableRooms: Room[];
}

export function TransferRoomModal({
  isOpen,
  onClose,
  onTransfer,
  currentRoom,
  guest,
  availableRooms
}: TransferRoomModalProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [transferAllMembers, setTransferAllMembers] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTransfer = async () => {
    if (!selectedRoom) return;

    setIsSubmitting(true);
    try {
      await onTransfer(guest.id, currentRoom.id, selectedRoom);
      onClose();
    } catch (error) {
      console.error('Error transferring room:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = selectedRoom;

  if (!isOpen) return null;

  const toRoom = availableRooms.find(r => r.id === selectedRoom);

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
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Chuyển phòng</h2>
              <p className="text-blue-100 mt-1">Di chuyển khách sang phòng khác</p>
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
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* Current Room & Guest Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Thông tin hiện tại
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Khách</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {guest.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{guest.name}</p>
                    <p className="text-xs text-slate-500">{guest.phone}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Phòng hiện tại</p>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {currentRoom.number}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Phòng {currentRoom.number}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(currentRoom.price)}/tháng</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Select New Room */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Chọn phòng mới</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {availableRooms.map(room => (
                <motion.button
                  key={room.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRoom(room.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all cursor-pointer",
                    selectedRoom === room.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 hover:border-purple-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold text-slate-800">Phòng {room.number}</span>
                    {selectedRoom === room.id && (
                      <Check size={20} className="text-purple-600" />
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-600">
                      {room.type === 'single' ? 'Phòng đơn (1-2 người)' : 'Phòng đôi (3-4 người)'}
                    </p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(room.price)}/tháng
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Transfer Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={transferAllMembers}
                onChange={(e) => setTransferAllMembers(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">Chuyển toàn bộ thành viên đi cùng</p>
                <p className="text-xs text-slate-500">
                  Nếu phòng có nhiều người, tất cả sẽ cùng chuyển
                </p>
              </div>
            </label>
          </div>

          {/* Summary */}
          {selectedRoom && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200"
            >
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ArrowRight size={20} className="text-purple-600" />
                Xác nhận chuyển phòng
              </h4>
              <div className="flex items-center justify-center gap-4 py-4">
                {/* From Room */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold mb-2">
                    {currentRoom.number}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Phòng {currentRoom.number}</p>
                  <p className="text-xs text-slate-500">Hiện tại</p>
                </div>

                {/* Arrow */}
                <ArrowRight size={32} className="text-purple-500" />

                {/* To Room */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold mb-2">
                    {toRoom?.number}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Phòng {toRoom?.number}</p>
                  <p className="text-xs text-slate-500">Mới</p>
                </div>
              </div>

              {/* Price Difference */}
              {toRoom && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Chênh lệch giá:</span>
                    <span className={cn(
                      "font-bold",
                      toRoom.price > currentRoom.price
                        ? "text-red-600"
                        : toRoom.price < currentRoom.price
                        ? "text-green-600"
                        : "text-slate-600"
                    )}>
                      {toRoom.price > currentRoom.price ? '+' : ''}
                      {(toRoom.price - currentRoom.price).toLocaleString()} VNĐ
                    </span>
                  </div>
                </div>
              )}
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
            onClick={handleTransfer}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? 'Đang chuyển...' : 'Xác nhận chuyển'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
