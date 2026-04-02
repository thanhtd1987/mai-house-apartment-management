import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../services';
import { Room, Facility, Guest, RoomStatus } from '../../types';
import { Button } from '../../components/common';
import { RoomCard, AssignRoomModal, RoomDetails, AddRoomModal } from '../../components/rooms';
import { RoomFilterBar } from '../../components/rooms/RoomFilterBar';
import { QuickInvoiceModal } from '../../components/invoices/QuickInvoiceModal';
import { getRoomGuestsWithDetails } from '../../utils';
import { useDataStore } from '../../stores';
import { getCurrentMonth } from '../../types/roomServiceUsage';

export function RoomsManager() {
  const { rooms, facilities, guests, utilityPricing, extraServices } = useDataStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);
  const [filters, setFilters] = useState<{ search: string; status: RoomStatus | 'all' }>({
    search: '',
    status: 'all'
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [invoiceModalRoom, setInvoiceModalRoom] = useState<Room | null>(null);

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

  const handleAssignRoom = async (guestIds: string[], roomId: string, checkInDate: string, representativeId: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);

      if (!room) {
        throw new Error('Room not found');
      }

      // Check if any guests already exist in room
      const existingGuestIds = room.guests?.map(g => g.guestId) || [];
      const duplicateGuests = guestIds.filter(gid => existingGuestIds.includes(gid));

      if (duplicateGuests.length > 0) {
        alert(`${duplicateGuests.length} khách đã có trong phòng!`);
        return;
      }

      // Prepare new guests array
      const currentGuests = room.guests || [];
      const newGuests = guestIds.map(guestId => ({
        guestId,
        isRepresentative: guestId === representativeId,
        checkInDate
      }));

      // Update room with all guests
      await updateDoc(doc(db, 'rooms', roomId), {
        guests: [...currentGuests, ...newGuests],
        status: 'occupied'
      });

      // Update check-in dates for all guests
      for (const guestId of guestIds) {
        await updateDoc(doc(db, 'guests', guestId), {
          checkInDate: checkInDate
        });
      }

      console.log(`Room assigned successfully: ${roomId} to ${guestIds.length} guests`);
      setShowAssignModal(false);
      setSelectedRoom(null);
    } catch (err) {
      console.error("Error assigning room:", err);
      throw err;
    }
  };

  const handleOpenAssignModal = (room: Room) => {
    setSelectedRoom(room);
    setShowAssignModal(true);
  };

  const handleOpenDetailsModal = (room: Room) => {
    setSelectedRoom(room);
    setShowDetailsModal(true);
  };

  const handleViewGuest = (guestId: string) => {
    if (guestId === 'assign') {
      // Open assign modal for the currently selected room
      if (selectedRoom) {
        handleOpenAssignModal(selectedRoom);
      }
    } else {
      // Navigate to guest details
      alert(`Navigate to guest ${guestId} - Tính năng sắp triển khai`);
    }
  };

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchesStatus = filters.status === 'all' || room.status === filters.status;

    // Get guests in room for search
    const roomGuests = getRoomGuestsWithDetails(room, guests);
    const guestNames = roomGuests.map(rg => rg.guest.name.toLowerCase()).join(' ');

    const matchesSearch = !filters.search ||
      room.number.toLowerCase().includes(filters.search.toLowerCase()) ||
      guestNames.includes(filters.search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Get guest for room (for backward compatibility with RoomCard)
  const getRoomGuest = (room: Room): Guest | undefined => {
    const roomGuests = getRoomGuestsWithDetails(room, guests);
    // Return representative or first guest
    return roomGuests.find(rg => rg.isRepresentative)?.guest || roomGuests[0]?.guest;
  };

  const hasActiveFilters = filters.search || filters.status !== 'all';

  // Handle change representative
  const handleChangeRepresentative = async (roomId: string, newRepresentativeId: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room || !room.guests) {
        alert('Phòng không có khách!');
        return;
      }

      // Update guests array to set new representative
      const updatedGuests = room.guests.map(g => ({
        ...g,
        isRepresentative: g.guestId === newRepresentativeId
      }));

      await updateDoc(doc(db, 'rooms', roomId), {
        guests: updatedGuests
      });

      console.log("Representative changed successfully:", roomId, newRepresentativeId);
    } catch (err) {
      console.error("Error changing representative:", err);
      alert('Không thể thay đổi người đại diện!');
    }
  };

  // Handle checkout specific guest
  const handleCheckoutGuest = async (roomId: string, guestId: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room || !room.guests) {
        alert('Phòng không có khách!');
        return;
      }

      if (room.guests.length === 1) {
        alert('Đây là khách cuối cùng. Vui lòng sử dụng "Trả toàn bộ phòng"!');
        return;
      }

      // Check if checking out representative
      const guestToCheckout = room.guests.find(g => g.guestId === guestId);
      if (guestToCheckout?.isRepresentative) {
        alert('Không thể checkout người đại diện. Hãy đổi người đại diện trước!');
        return;
      }

      if (!window.confirm(`Bạn có chắc muốn checkout khách này khỏi phòng?`)) {
        return;
      }

      // Remove guest from array
      const updatedGuests = room.guests.filter(g => g.guestId !== guestId);

      await updateDoc(doc(db, 'rooms', roomId), {
        guests: updatedGuests
      });

      console.log("Guest checked out successfully:", guestId);
      setShowDetailsModal(false);
      setSelectedRoom(null);
    } catch (err) {
      console.error("Error checking out guest:", err);
      alert('Không thể checkout khách!');
    }
  };

  // Handle edit guest
  const handleEditGuest = (guestId: string) => {
    // Close details modal and navigate to guest editing
    setShowDetailsModal(false);
    alert(`Chuyển đến sửa thông tin khách ${guestId} - Tính năng sắp triển khai`);
  };

  const handleSaveRoom = async (roomData: Partial<Room>) => {
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

  const handleCreateInvoice = async (invoiceData: any) => {
    try {
      const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        status: 'unpaid',
        createdAt: new Date().toISOString()
      });

      // Update room's last electricity meter
      if (invoiceData.roomId) {
        await updateDoc(doc(db, 'rooms', invoiceData.roomId), {
          lastElectricityMeter: invoiceData.electricityNew,
          paymentStatus: 'unpaid'
        });
      }

      // Clear room service usage for this month after invoice is created
      const currentMonth = getCurrentMonth();
      const usageId = `${invoiceData.roomId}_${currentMonth}`;
      await deleteDoc(doc(db, 'roomServiceUsages', usageId));

      console.log("Invoice created successfully:", docRef.id);
      console.log("Cleared service usage for room:", invoiceData.roomId, "month:", currentMonth);
      setInvoiceModalRoom(null);
    } catch (err) {
      console.error("Error creating invoice:", err);
      throw err;
    }
  };

  // Get utility pricing config
  const getUtilityPricingConfig = () => {
    const waterPricing = utilityPricing.find(u => u.type === 'water' && u.isActive);
    const electricityPricing = utilityPricing.find(u => u.type === 'electricity' && u.isActive);

    return {
      water: {
        pricePerPerson: waterPricing?.basePrice || 60000
      },
      electricity: {
        pricePerKwh: electricityPricing?.basePrice || 3500
      }
    };
  };

  const getRoomGuestCount = (room: Room): number => {
    return room.guests?.length || 0;
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
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                    onAssignGuest={() => handleOpenAssignModal(room)}
                    onCreateInvoice={(room) => setInvoiceModalRoom(room)}
                    onCardClick={() => handleOpenDetailsModal(room)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AddRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRoom}
        room={editingRoom}
        facilities={facilities}
      />

      {/* Assign Room Modal */}
      {showAssignModal && selectedRoom && (
        <AssignRoomModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedRoom(null);
          }}
          onAssign={handleAssignRoom}
          availableRooms={rooms.filter(r => r.status === 'available' || r.id === selectedRoom.id)}
          allRooms={rooms}
          guests={guests}
          preselectedRoomId={selectedRoom.id}
        />
      )}

      {/* Room Details Modal */}
      {showDetailsModal && selectedRoom && (
        <RoomDetails
          room={selectedRoom}
          guests={guests}
          facilities={facilities}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRoom(null);
          }}
          onAddRoommate={() => {
            setShowDetailsModal(false);
            handleOpenAssignModal(selectedRoom);
          }}
          onTransferRoom={() => {
            // TODO: Implement transfer room
            alert('Tính năng chuyển phòng sẽ được implement sau');
          }}
          onCheckout={async (guestId) => {
            if (guestId) {
              // Checkout specific guest
              await handleCheckoutGuest(selectedRoom.id, guestId);
            } else {
              // Checkout entire room
              if (window.confirm('Bạn có chắc chắn muốn trả toàn bộ phòng này?')) {
                try {
                  await updateDoc(doc(db, 'rooms', selectedRoom.id), {
                    guests: [],
                    status: 'available'
                  });
                  setShowDetailsModal(false);
                  setSelectedRoom(null);
                } catch (err) {
                  console.error("Error checking out:", err);
                }
              }
            }
          }}
          onChangeRepresentative={(guestId) => handleChangeRepresentative(selectedRoom.id, guestId)}
          onEditGuest={handleEditGuest}
          onCreateInvoice={(roomId) => setInvoiceModalRoom(rooms.find(r => r.id === roomId) || null)}
        />
      )}

      {/* Quick Invoice Modal */}
      {invoiceModalRoom && (
        <QuickInvoiceModal
          isOpen={!!invoiceModalRoom}
          onClose={() => setInvoiceModalRoom(null)}
          roomId={invoiceModalRoom?.id}
          guestCount={getRoomGuestCount(invoiceModalRoom)}
          onCreateInvoice={handleCreateInvoice}
          utilityPricing={getUtilityPricingConfig()}
          availableServices={extraServices}
        />
      )}
    </div>
  );
}
