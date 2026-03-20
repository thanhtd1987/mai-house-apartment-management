import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services';
import { Room, Facility } from '../../types';
import { Modal, Button } from '../../components/common';
import { cn, formatCurrency } from '../../utils';

interface RoomsManagerProps {
  rooms: Room[];
  facilities: Facility[];
  guests?: any[];
}

export function RoomsManager({ rooms, facilities }: RoomsManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);

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
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm">Quản lý danh sách {rooms.length} phòng trong hệ thống.</p>
        <Button
          onClick={() => { setEditingRoom({}); setIsModalOpen(true); }}
          icon={<Plus size={18} />}
        >
          Thêm phòng mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <div key={room.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Phòng {room.number}</h3>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    {room.type === 'single' ? 'Phòng đơn (1-2 người)' : 'Phòng đôi (3-4 người)'}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingRoom(room); setIsModalOpen(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => deleteDoc(doc(db, 'rooms', room.id))} className="p-2 hover:bg-rose-50 rounded-lg text-rose-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Trạng thái</p>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      room.status === 'available' ? "bg-emerald-500" :
                      room.status === 'occupied' ? "bg-blue-500" : "bg-gray-400"
                    )} />
                    <span className="text-xs font-bold capitalize">{room.status}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Giá thuê</p>
                  <span className="text-xs font-bold">{formatCurrency(room.price)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Thanh toán:</span>
                  <span className={cn(
                    "font-bold",
                    room.paymentStatus === 'paid' ? "text-emerald-600" :
                    room.paymentStatus === 'unpaid' ? "text-rose-600" : "text-amber-600"
                  )}>
                    {room.paymentStatus === 'paid' ? 'Đã xong' : room.paymentStatus === 'unpaid' ? 'Chưa đóng' : 'Nợ cũ'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Số điện cũ:</span>
                  <span className="font-bold">{room.lastElectricityMeter} kWh</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <div className="flex -space-x-2">
                {room.facilities?.slice(0, 3).map(fid => (
                  <div key={fid} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold">
                    {facilities.find(f => f.id === fid)?.name.charAt(0)}
                  </div>
                ))}
                {(room.facilities?.length || 0) > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-200 flex items-center justify-center text-[10px] font-bold">
                    +{(room.facilities?.length || 0) - 3}
                  </div>
                )}
              </div>
              <button className="text-xs font-bold text-gray-400 hover:text-black flex items-center gap-1">
                Chi tiết <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom?.id ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
      >
        <form onSubmit={handleSaveRoom} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Mã đồng hồ điện (No.)</label>
              <input name="meterId" defaultValue={editingRoom?.meterId} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Số phòng</label>
              <input name="number" defaultValue={editingRoom?.number} required className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Loại phòng</label>
              <select name="type" defaultValue={editingRoom?.type || 'single'} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black">
                <option value="single">Phòng đơn (1-2 người)</option>
                <option value="double">Phòng đôi (3-4 người)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Trạng thái</label>
              <select name="status" defaultValue={editingRoom?.status || 'available'} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black">
                <option value="available">Còn trống</option>
                <option value="occupied">Đang ở</option>
                <option value="maintenance">Đang sửa chữa</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Giá thuê (VND)</label>
              <input name="price" type="number" defaultValue={editingRoom?.price} required className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Số điện hiện tại</label>
              <input name="lastElectricityMeter" type="number" defaultValue={editingRoom?.lastElectricityMeter || 0} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Thanh toán</label>
              <select name="paymentStatus" defaultValue={editingRoom?.paymentStatus || 'paid'} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black">
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chưa thanh toán</option>
                <option value="debt">Nợ cũ</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Cơ sở vật chất</label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl">
              {facilities.map(f => (
                <label key={f.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="facilities"
                    value={f.id}
                    defaultChecked={editingRoom?.facilities?.includes(f.id)}
                    className="rounded border-gray-300 text-black focus:ring-black"
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
