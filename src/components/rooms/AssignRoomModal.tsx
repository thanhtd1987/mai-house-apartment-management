import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../common/Button';
import { cn, getRoomGuestsWithDetails } from '../../utils';
import { Room, Guest } from '../../types';
import { AssignModalHeader } from './AssignModalHeader';
import { ExistingGuestsList } from './ExistingGuestsList';
import { RoomInfoCard } from './RoomInfoCard';
import { GuestSearch } from './GuestSearch';
import { GuestCard } from './GuestCardSelector';
import { RepresentativeSelection } from './RepresentativeSelection';
import { CheckInDatePicker } from './CheckInDatePicker';
import { AssignModalFooter } from './AssignModalFooter';

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
      if (existingRepresentative && selectedGuests.length === 0) {
        setRepresentativeId(existingRepresentative.guestId);
      }
    }
  }, [isOpen, preselectedGuestId, preselectedRoomId, existingRepresentative]);

  useEffect(() => {
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
            <AssignModalHeader
              existingGuestsCount={existingGuests.length}
              roomNumber={selectedRoomObj?.number}
              mode={mode}
              onClose={onClose}
            />

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <ExistingGuestsList existingGuests={existingGuests} />

              {!showRoomSelection && <RoomInfoCard room={selectedRoomObj} />}

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

                <GuestSearch value={guestSearch} onChange={setGuestSearch} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredGuests.length === 0 ? (
                    <div className="col-span-full text-center py-6 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">Không tìm thấy khách nào</p>
                    </div>
                  ) : (
                    filteredGuests.map(guest => {
                      const isSelected = selectedGuests.includes(guest.id);

                      return (
                        <GuestCard
                          key={guest.id}
                          guest={guest}
                          isSelected={isSelected}
                          onClick={() => handleToggleGuest(guest.id)}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              <RepresentativeSelection
                existingRepresentative={existingRepresentative}
                selectedGuests={selectedGuests}
                representativeId={representativeId}
                guests={guests}
                onSetRepresentativeId={setRepresentativeId}
              />

              <CheckInDatePicker value={checkInDate} onChange={setCheckInDate} />
            </div>

            <AssignModalFooter
              onClose={onClose}
              onAssign={handleAssign}
              canSubmit={canSubmit}
              isSubmitting={isSubmitting}
              selectedGuestsCount={selectedGuests.length}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
