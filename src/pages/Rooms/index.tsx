import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services';
import { Room, Facility, Guest, RoomStatus } from '../../types';
import { Modal, Button } from '../../components/common';
import { RoomCard } from '../../components/rooms/RoomCard';
import { RoomFilterBar } from '../../components/rooms/RoomFilterBar';

interface RoomsManagerProps {
  rooms: Room[];
  facilities: Facility[];
  guests?: Guest[];
}

export function RoomsManager({ rooms, facilities, guests = [] }: RoomsManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);
  const [filters, setFilters] = useState<{ search: string; status: RoomStatus | 'all' }>({
    search: '',
    status: 'all'
  });

  const handleDeleteRoom = async (roomId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
      try {
        await deleteDoc(doc(db, 'rooms', roomId));
        console.log("Room deleted successfully:", roomId);
      } catch (err) {
        console.error("Error deleting room:", err);
      }
    }
  };

  const handleViewGuest = (guestId: string) => {
    if (guestId === 'assign') {
      // TODO: Open assign modal
      alert('Tính năng gán khách sẽ được implement sau');
    } else {
      // TODO: Navigate to guest details
      alert(`Navigate to guest ${guestId}`);
    }
  };

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchesStatus = filters.status === 'all' || room.status === filters.status;

    const guest = guests.find(g => g.id === room.currentGuestId);
    const matchesSearch = !filters.search ||
      room.number.toLowerCase().includes(filters.search.toLowerCase()) ||
      (guest?.name.toLowerCase().includes(filters.search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  // Get guest for room
  const getRoomGuest = (room: Room): Guest | undefined => {
    return guests.find(g => g.id === room.currentGuestId);
  };

  const hasActiveFilters = filters.search || filters.status !== 'all';

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const roomData = {
      number: formData.get('number') as string,
      meterId: formData.get('meterId') as string,
      type: formData.get('type') as 'single' | 'double',
      status: formData.get('status') as 'available' | 'occupied' | 'maintenance',
      price: Number(formData.get('price')),
      lastElectricityMeter: Number(formData.get('lastElectricityMeter')),
      paymentStatus: formData.get('paymentStatus') as 'paid' | 'unpaid' | 'debt',
      facilities: Array.from(formData.getAll('facilities')) as string[]
    };

    try {
      if (editingRoom?.id) {
        await updateDoc(doc(db, 'rooms', editingRoom.id), roomData);
        console.log("Room updated successfully:", editingRoom.id);
      } else {
        const docRef = await addDoc(collection(db, 'rooms'), roomData);
        console.log("Room created successfully:", docRef.id);
      }
      setIsModalOpen(false);
      setEditingRoom(null);
    } catch (err) {
      console.error("Error saving room:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Danh sách phòng</h2>
          <p className="text-slate-500 text-sm mt-1">
            {filteredRooms.length === rooms.length
              ? `Quản lý ${rooms.length} phòng trong hệ thống`
              : `Hiển thị ${filteredRooms.length} / ${rooms.length} phòng`}
          </p>
        </div>
        <Button
          onClick={() => { setEditingRoom({}); setIsModalOpen(true); }}
          icon={<Plus size={18} />}
        >
          Thêm phòng mới
        </Button>
      </div>

      {/* Filter Bar */}
      <RoomFilterBar onFilterChange={setFilters} />

      {/* Room Grid */}
      <AnimatePresence mode="popLayout">
        {filteredRooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <Plus size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {hasActiveFilters ? 'Không tìm thấy phòng nào' : 'Chưa có phòng nào'}
            </h3>
            <p className="text-slate-500 mb-6">
              {hasActiveFilters
                ? 'Thử thay đổi bộ lọc để tìm thấy phòng'
                : 'Bắt đầu thêm phòng đầu tiên vào hệ thống'}
            </p>
            {hasActiveFilters ? (
              <Button onClick={() => setFilters({ search: '', status: 'all' })} variant="secondary">
                Xóa bộ lọc
              </Button>
            ) : (
              <Button onClick={() => { setEditingRoom({}); setIsModalOpen(true); }} icon={<Plus size={18} />}>
                Thêm phòng mới
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredRooms.map(room => (
                <motion.div
                  key={room.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <RoomCard
                    room={room}
                    guest={getRoomGuest(room)}
                    onEdit={(room) => { setEditingRoom(room); setIsModalOpen(true); }}
                    onDelete={handleDeleteRoom}
                    onViewGuest={handleViewGuest}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom?.id ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
      >
        <form onSubmit={handleSaveRoom} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Mã đồng hồ điện (No.)</label>
              <input name="meterId" defaultValue={editingRoom?.meterId} className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Số phòng</label>
              <input name="number" defaultValue={editingRoom?.number} required className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Loại phòng</label>
              <select name="type" defaultValue={editingRoom?.type || 'single'} className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500">
                <option value="single">Phòng đơn (1-2 người)</option>
                <option value="double">Phòng đôi (3-4 người)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Trạng thái</label>
              <select name="status" defaultValue={editingRoom?.status || 'available'} className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500">
                <option value="available">Còn trống</option>
                <option value="occupied">Đang ở</option>
                <option value="maintenance">Đang sửa chữa</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Giá thuê (VND)</label>
              <input name="price" type="number" defaultValue={editingRoom?.price} required className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Số điện hiện tại</label>
              <input name="lastElectricityMeter" type="number" defaultValue={editingRoom?.lastElectricityMeter || 0} className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Thanh toán</label>
              <select name="paymentStatus" defaultValue={editingRoom?.paymentStatus || 'paid'} className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500">
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chưa thanh toán</option>
                <option value="debt">Nợ cũ</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Cơ sở vật chất</label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl">
              {facilities.map(f => (
                <label key={f.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="facilities"
                    value={f.id}
                    defaultChecked={editingRoom?.facilities?.includes(f.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {f.name}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" size="lg" className="w-full">
              {editingRoom?.id ? 'Cập nhật phòng' : 'Tạo phòng mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
