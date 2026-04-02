import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Settings } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services';
import { Facility } from '../../types';
import { Modal, Button, ConfirmDialog } from '../../components/common';
import { formatCurrency } from '../../utils';
import { useDataStore, useToastStore } from '../../stores';

export function FacilitiesManager() {
  const { facilities } = useDataStore();
  const { addToast } = useToastStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Partial<Facility> | null>(null);
  const [deletingFacilityId, setDeletingFacilityId] = useState<string | null>(null);

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const facilityData = {
      name: formData.get('name') as string,
      compensationPrice: Number(formData.get('compensationPrice'))
    };

    try {
      if (editingFacility?.id) {
        await updateDoc(doc(db, 'facilities', editingFacility.id), facilityData);
        addToast('Đã cập nhật thiết bị', 'success');
      } else {
        await addDoc(collection(db, 'facilities'), facilityData);
        addToast('Đã thêm thiết bị mới', 'success');
      }
      setIsModalOpen(false);
      setEditingFacility(null);
    } catch (err) {
      console.error('Error saving facility:', err);
      addToast('Không thể lưu thiết bị', 'error');
    }
  };

  const handleDeleteFacility = async (facilityId: string) => {
    try {
      await deleteDoc(doc(db, 'facilities', facilityId));
      addToast('Đã xóa thiết bị', 'success');
      setDeletingFacilityId(null);
    } catch (err) {
      console.error('Error deleting facility:', err);
      addToast('Không thể xóa thiết bị', 'error');
    }
  };

  const handleDeleteClick = (facilityId: string) => {
    setDeletingFacilityId(facilityId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm">Quản lý danh sách cơ sở vật chất và giá đền bù.</p>
        <Button onClick={() => { setEditingFacility({}); setIsModalOpen(true); }} icon={<Plus size={18} />}>
          Thêm thiết bị
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {facilities.map(f => (
          <div key={f.id} className="bg-white p-4 md:p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="p-2 md:p-3 bg-gray-50 rounded-2xl">
                <Settings className="text-gray-400 w-5 h-5 md:w-6 md:h-6" size={20} />
              </div>
              <div className="flex gap-1 opacity-100 lg:opacity-40 lg:group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingFacility(f); setIsModalOpen(true); }} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                  <Edit3 size={12} className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </button>
                <button onClick={() => handleDeleteClick(f.id)} className="p-1 hover:bg-rose-50 rounded-lg text-rose-500">
                  <Trash2 size={12} className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </button>
              </div>
            </div>
            <h4 className="font-bold text-base md:text-lg mb-1">{f.name}</h4>
            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase mb-2 md:mb-3">Giá đền bù</p>
            <p className="text-emerald-600 font-bold text-sm md:text-base">{formatCurrency(f.compensationPrice)}</p>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFacility?.id ? 'Sửa thiết bị' : 'Thêm thiết bị'}
        size="sm"
      >
        <form onSubmit={handleSaveFacility} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Tên thiết bị</label>
            <input name="name" defaultValue={editingFacility?.name} required className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Giá đền bù (VND)</label>
            <input name="compensationPrice" type="number" defaultValue={editingFacility?.compensationPrice} required className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
          </div>
          <div className="pt-4">
            <Button type="submit" size="lg" className="w-full">
              Lưu thiết bị
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingFacilityId}
        title="Xác nhận xóa thiết bị"
        message="Bạn có chắc chắn muốn xóa thiết bị này? Hành động này không thể hoàn tác."
        type="danger"
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={() => deletingFacilityId && handleDeleteFacility(deletingFacilityId)}
        onCancel={() => setDeletingFacilityId(null)}
      />
    </div>
  );
}
