import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit3, Trash2, X, Camera, Users, Search, ChevronRight } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services';
import { Guest } from '../../types';
import { Modal, Button, CropModal } from '../../components';
import { useOCR } from '../../hooks';
import { cn, handleFirestoreError, OperationType } from '../../utils';

interface GuestsManagerProps {
  guests: Guest[];
}

export function GuestsManager({ guests }: GuestsManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [croppedFace, setCroppedFace] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);

  const { isScanning, scanIDCard } = useOCR();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredGuests = guests.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.idNumber.includes(searchQuery) ||
    g.phone.includes(searchQuery)
  );

  const handleScanID = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await scanIDCard(file);
    if (result) {
      setScannedImage(result.image);
      setScannedData(result.data);
      setShowCropModal(true);
    }
  };

  useEffect(() => {
    if (scannedData && scannedData.data) {
      const form = document.getElementById('guest-form') as HTMLFormElement;
      if (form) {
        (form.elements.namedItem('name') as HTMLInputElement).value = scannedData.data.name || '';
        (form.elements.namedItem('idNumber') as HTMLInputElement).value = scannedData.data.idNumber || '';
        (form.elements.namedItem('phone') as HTMLInputElement).value = scannedData.data.phone || '';
        (form.elements.namedItem('email') as HTMLInputElement).value = scannedData.data.email || '';
      }
    }
  }, [scannedData]);

  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const guestData = {
      name: formData.get('name') as string,
      idNumber: formData.get('idNumber') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      idPhoto: croppedFace || scannedImage || editingGuest?.idPhoto || '',
      checkInDate: editingGuest?.checkInDate || new Date().toISOString().split('T')[0]
    };

    try {
      if (editingGuest) {
        await updateDoc(doc(db, 'guests', editingGuest.id), guestData);
      } else {
        await addDoc(collection(db, 'guests'), guestData);
      }

      setIsModalOpen(false);
      setEditingGuest(null);
      setScannedImage(null);
      setCroppedFace(null);
      setScannedData(null);
    } catch (err) {
      handleFirestoreError(err, editingGuest ? OperationType.UPDATE : OperationType.CREATE, 'guests');
    }
  };

  const handleDeleteGuest = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khách này?')) {
      try {
        await deleteDoc(doc(db, 'guests', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'guests');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm">Quản lý danh sách {guests.length} khách lưu trú.</p>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black transition-all w-64"
            />
          </div>
          <Button onClick={() => { setEditingGuest(null); setIsModalOpen(true); }} icon={<Plus size={18} />}>
            Đăng ký khách mới
          </Button>
        </div>
      </div>

      {filteredGuests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold">Không tìm thấy khách</h3>
          <p className="text-gray-500 text-sm">Thử tìm kiếm với từ khóa khác hoặc đăng ký khách mới.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Khách hàng</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">CCCD/Passport</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Liên hệ</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Ngày vào</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGuests.map(guest => (
                <tr key={guest.id} className="hover:bg-gray-50 transition-colors group relative">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                        {guest.idPhoto ? (
                          <img src={guest.idPhoto} alt={guest.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                            {guest.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="font-bold">{guest.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{guest.idNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    <p className="font-medium">{guest.phone}</p>
                    <p className="text-gray-400 text-xs">{guest.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{guest.checkInDate}</td>
                  <td className="px-6 py-4 text-right relative">
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-lg rounded-lg p-1 border border-gray-100">
                      <button
                        onClick={() => { setEditingGuest(guest); setIsModalOpen(true); }}
                        className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCropModal && scannedImage && (
        <CropModal
          image={scannedImage}
          onCropComplete={(cropped) => {
            setCroppedFace(cropped);
            setShowCropModal(false);
          }}
          onClose={() => setShowCropModal(false)}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGuest ? 'Chỉnh sửa thông tin khách' : 'Đăng ký khách lưu trú'}
        size="lg"
      >
        <div className="space-y-6">
          <div className="flex gap-6">
            <div
              className="w-24 h-32 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {croppedFace ? (
                <img src={croppedFace} alt="Cropped Face" className="w-full h-full object-cover" />
              ) : editingGuest?.idPhoto ? (
                <img src={editingGuest.idPhoto} alt="ID Photo" className="w-full h-full object-cover" />
              ) : scannedImage ? (
                <img src={scannedImage} alt="Scanned ID" className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-gray-400" size={32} />
              )}
            </div>
            <div className="flex-1 space-y-4">
              <input type="file" ref={fileInputRef} onChange={handleScanID} className="hidden" accept="image/*" />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                className="w-full"
                loading={isScanning}
              >
                {isScanning ? 'Đang quét thông tin...' : 'Tải lên ảnh CCCD/Passport'}
              </Button>
              {(scannedImage || editingGuest?.idPhoto) && (
                <Button
                  type="button"
                  onClick={() => setShowCropModal(true)}
                  variant="secondary"
                  className="w-full"
                >
                  Cắt ảnh mặt
                </Button>
              )}
            </div>
          </div>

          <form id="guest-form" onSubmit={handleSaveGuest} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Họ và tên</label>
                <input name="name" defaultValue={editingGuest?.name} required className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Số CCCD/Passport</label>
                <input name="idNumber" defaultValue={editingGuest?.idNumber} required className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Số điện thoại</label>
                <input name="phone" defaultValue={editingGuest?.phone} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                <input name="email" type="email" defaultValue={editingGuest?.email} className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black" />
              </div>
            </div>
            <div className="pt-4">
              <Button type="submit" size="lg" className="w-full">
                {editingGuest ? 'Cập nhật thông tin' : 'Lưu thông tin khách'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
