import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Settings } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services';
import { Facility } from '../../types';
import { Modal, Button } from '../../components/common';
import { formatCurrency } from '../../utils';

interface FacilitiesManagerProps {
  facilities: Facility[];
}

export function FacilitiesManager({ facilities }: FacilitiesManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Partial<Facility> | null>(null);

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const facilityData = {
      name: formData.get('name') as string,
      compensationPrice: Number(formData.get('compensationPrice'))
    };

    if (editingFacility?.id) {
      await updateDoc(doc(db, 'facilities', editingFacility.id), facilityData);
    } else {
      await addDoc(collection(db, 'facilities'), facilityData);
    }
    setIsModalOpen(false);
    setEditingFacility(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm">Quản lý danh sách cơ sở vật chất và giá đền bù.</p>
        <Button onClick={() => { setEditingFacility({}); setIsModalOpen(true); }} icon={<Plus size={18} />}>
          Thêm thiết bị
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {facilities.map(f => (
          <div key={f.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-50 rounded-2xl">
                <Settings className="text-gray-400" size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingFacility(f); setIsModalOpen(true); }} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => deleteDoc(doc(db, 'facilities', f.id))} className="p-1 hover:bg-rose-50 rounded-lg text-rose-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h4 className="font-bold text-lg mb-1">{f.name}</h4>
            <p className="text-xs text-gray-400 font-bold uppercase mb-3">Giá đền bù</p>
            <p className="text-emerald-600 font-bold">{formatCurrency(f.compensationPrice)}</p>
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
    </div>
  );
}
