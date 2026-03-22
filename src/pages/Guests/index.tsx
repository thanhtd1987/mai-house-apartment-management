import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit3, Trash2, X, Camera, Users, Search, UserCheck } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services';
import { Guest, Room, Facility } from '../../types';
import { Modal, Button, CropModal } from '../../components';
import { GuestCard, GuestDetails } from '../../components/guests';
import { AssignRoomModal } from '../../components/rooms';
import { useOCR } from '../../hooks';
import { cn, handleFirestoreError, OperationType } from '../../utils';

interface GuestsManagerProps {
  guests: Guest[];
  rooms: Room[];
  facilities?: Facility[];
}

export function GuestsManager({ guests, rooms, facilities = [] }: GuestsManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [croppedFace, setCroppedFace] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const { isScanning, scanIDCard } = useOCR();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredGuests = guests.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.idNumber.includes(searchQuery) ||
    g.phone.includes(searchQuery)
  );

  const resetImageStates = () => {
    setScannedImage(null);
    setCroppedFace(null);
    setScannedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenNewGuestModal = () => {
    setEditingGuest(null);
    resetImageStates();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGuest(null);
    resetImageStates();
  };

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
    if (scannedData) {
      const form = document.getElementById('guest-form') as HTMLFormElement;
      if (form) {
        (form.elements.namedItem('name') as HTMLInputElement).value = scannedData.name || '';
        (form.elements.namedItem('idNumber') as HTMLInputElement).value = scannedData.idNumber || '';
        (form.elements.namedItem('phone') as HTMLInputElement).value = scannedData.phone || '';
        (form.elements.namedItem('email') as HTMLInputElement).value = scannedData.email || '';
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

      handleCloseModal();
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

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    resetImageStates();
    setIsModalOpen(true);
  };

  const handleViewGuestDetails = (guestId: string) => {
    // Open details modal for this guest
    const guest = guests.find(g => g.id === guestId);
    if (guest) {
      setSelectedGuest(guest);
      setShowDetailsModal(true);
    }
  };

  const handleEditFromDetails = () => {
    setShowDetailsModal(false);
    if (selectedGuest) {
      handleEditGuest(selectedGuest);
    }
  };

  const handleAssignFromDetails = () => {
    setShowDetailsModal(false);
    setShowAssignModal(true);
  };

  const handleCheckoutFromDetails = async () => {
    if (selectedGuest && window.confirm('Bạn có chắc chắn muốn trả phòng?')) {
      const room = rooms.find(r => r.currentGuestId === selectedGuest.id);
      if (room) {
        try {
          await updateDoc(doc(db, 'rooms', room.id), {
            currentGuestId: null,
            status: 'available'
          });
          setShowDetailsModal(false);
        } catch (err) {
          console.error("Error checking out:", err);
        }
      }
    }
  };

  const handleAssignRoomToGuest = async (guestId: string, roomId: string, checkInDate: string) => {
    try {
      // Update room with guest ID and change status to occupied
      await updateDoc(doc(db, 'rooms', roomId), {
        currentGuestId: guestId,
        status: 'occupied'
      });

      // Update guest check-in date if needed
      await updateDoc(doc(db, 'guests', guestId), {
        checkInDate: checkInDate
      });

      console.log("Room assigned successfully:", roomId, "to guest:", guestId);
      setShowAssignModal(false);
      setSelectedGuest(null);
    } catch (err) {
      console.error("Error assigning room:", err);
      throw err;
    }
  };

  // Get room for guest
  const getGuestRoom = (guest: Guest): Room | undefined => {
    return rooms.find(r => r.currentGuestId === guest.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Danh sách khách</h2>
          <p className="text-slate-500 text-sm mt-1">
            {filteredGuests.length === guests.length
              ? `Quản lý ${guests.length} khách lưu trú`
              : `Hiển thị ${filteredGuests.length} / ${guests.length} khách`}
          </p>
        </div>
        <Button
          onClick={handleOpenNewGuestModal}
          icon={<Plus size={18} />}
        >
          Đăng ký khách mới
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, số CCCD, hoặc số điện thoại..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Guest Grid */}
      <AnimatePresence mode="popLayout">
        {filteredGuests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <UserCheck size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {searchQuery ? 'Không tìm thấy khách nào' : 'Chưa có khách nào'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Bắt đầu đăng ký khách đầu tiên vào hệ thống'}
            </p>
            {searchQuery ? (
              <Button onClick={() => setSearchQuery('')} variant="secondary">
                Xóa tìm kiếm
              </Button>
            ) : (
              <Button onClick={handleOpenNewGuestModal} icon={<Plus size={18} />}>
                Đăng ký khách mới
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredGuests.map(guest => (
                <motion.div
                  key={guest.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <GuestCard
                    guest={guest}
                    room={getGuestRoom(guest)}
                    onEdit={handleEditGuest}
                    onDelete={handleDeleteGuest}
                    onViewDetails={handleViewGuestDetails}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop Modal */}
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingGuest ? 'Chỉnh sửa thông tin khách' : 'Đăng ký khách lưu trú'}
        size="lg"
      >
        <div className="space-y-6">
          <div className="flex gap-6">
            <div
              className="w-24 h-32 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {croppedFace ? (
                <img src={croppedFace} alt="Cropped Face" className="w-full h-full object-cover" />
              ) : editingGuest?.idPhoto ? (
                <img src={editingGuest.idPhoto} alt="ID Photo" className="w-full h-full object-cover" />
              ) : scannedImage ? (
                <img src={scannedImage} alt="Scanned ID" className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-slate-400" size={32} />
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
                <label className="text-xs font-bold text-slate-400 uppercase">Họ và tên</label>
                <input name="name" defaultValue={editingGuest?.name} required className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Số CCCD/Passport</label>
                <input name="idNumber" defaultValue={editingGuest?.idNumber} required className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Số điện thoại</label>
                <input name="phone" defaultValue={editingGuest?.phone} className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                <input name="email" type="email" defaultValue={editingGuest?.email} className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500" />
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

      {/* Assign Room Modal */}
      {showAssignModal && selectedGuest && (
        <AssignRoomModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedGuest(null);
          }}
          onAssign={handleAssignRoomToGuest}
          availableRooms={rooms.filter(r => r.status === 'available')}
          guests={guests}
        />
      )}

      {/* Guest Details Modal */}
      {showDetailsModal && selectedGuest && (
        <GuestDetails
          guest={selectedGuest}
          room={getGuestRoom(selectedGuest)}
          facilities={facilities}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedGuest(null);
          }}
          onAssignRoom={handleAssignFromDetails}
          onEdit={handleEditFromDetails}
          onCheckoutRoom={handleCheckoutFromDetails}
        />
      )}
    </div>
  );
}
