import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../services';
import { Room, Facility, Guest, RoomStatus } from '../../types';
import { Button } from '../../components/common';
import { RoomCard, AssignRoomModal, RoomDetails, AddRoomModal } from '../../components/rooms';
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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

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

  const handleAssignRoom = async (guestId: string, roomId: string, checkInDate: string) => {
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
                    onAssignGuest={() => handleOpenAssignModal(room)}
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
          availableRooms={rooms.filter(r => r.status === 'available')}
          guests={guests}
          preselectedRoomId={selectedRoom.id}
        />
      )}

      {/* Room Details Modal */}
      {showDetailsModal && selectedRoom && (
        <RoomDetails
          room={selectedRoom}
          guest={getRoomGuest(selectedRoom)}
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
          onCheckout={async () => {
            if (window.confirm('Bạn có chắc chắn muốn trả phòng này?')) {
              try {
                await updateDoc(doc(db, 'rooms', selectedRoom.id), {
                  currentGuestId: null,
                  status: 'available'
                });
                setShowDetailsModal(false);
                setSelectedRoom(null);
              } catch (err) {
                console.error("Error checking out:", err);
              }
            }
          }}
        />
      )}
    </div>
  );
}
