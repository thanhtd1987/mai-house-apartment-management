import { Room, RoomGuest, Guest } from '../types';

/**
 * Migration utility: Convert old currentGuestId to new guests array
 * This maintains backward compatibility while transitioning to the new structure
 */
export function migrateRoomToNewStructure(room: Room): Room {
  // If room already has guests array, return as-is
  if (room.guests && room.guests.length > 0) {
    return room;
  }

  // If room has currentGuestId, migrate to new structure
  if (room.currentGuestId) {
    return {
      ...room,
      guests: [{
        guestId: room.currentGuestId,
        isRepresentative: true, // First guest is always representative
        checkInDate: new Date().toISOString().split('T')[0] // Default to today
      }],
      currentGuestId: undefined // Remove old field after migration
    };
  }

  // Room has no guests
  return room;
}

/**
 * Check if room has a representative guest
 */
export function roomHasRepresentative(room: Room): boolean {
  if (!room.guests || room.guests.length === 0) {
    return false;
  }
  return room.guests.some(g => g.isRepresentative);
}

/**
 * Get representative guest from room
 */
export function getRoomRepresentative(room: Room, guests: Guest[]): Guest | undefined {
  if (!room.guests || room.guests.length === 0) {
    return undefined;
  }

  const representativeGuest = room.guests.find(g => g.isRepresentative);
  if (!representativeGuest) {
    return undefined;
  }

  return guests.find(g => g.id === representativeGuest.guestId);
}

/**
 * Get all guests in a room with their details
 */
export function getRoomGuestsWithDetails(room: Room, guests: Guest[]): Array<RoomGuest & { guest: Guest }> {
  if (!room.guests || room.guests.length === 0) {
    return [];
  }

  return room.guests
    .map(rg => ({
      ...rg,
      guest: guests.find(g => g.id === rg.guestId)!
    }))
    .filter(rg => rg.guest); // Filter out guests not found in database
}

/**
 * Check if guest is in room
 */
export function isGuestInRoom(room: Room, guestId: string): boolean {
  if (!room.guests || room.guests.length === 0) {
    return false;
  }
  return room.guests.some(g => g.guestId === guestId);
}

/**
 * Get room guest relationship
 */
export function getRoomGuestRelationship(room: Room, guestId: string): RoomGuest | undefined {
  if (!room.guests || room.guests.length === 0) {
    return undefined;
  }
  return room.guests.find(g => g.guestId === guestId);
}

/**
 * Add guest to room
 */
export function addGuestToRoom(
  room: Room,
  guestId: string,
  options: {
    isRepresentative?: boolean;
    checkInDate?: string;
  } = {}
): Omit<Room, 'id'> {
  const newGuest: RoomGuest = {
    guestId,
    isRepresentative: options.isRepresentative || false,
    checkInDate: options.checkInDate || new Date().toISOString().split('T')[0]
  };

  const existingGuests = room.guests || [];

  return {
    ...room,
    guests: [...existingGuests, newGuest],
    status: 'occupied'
  };
}

/**
 * Remove guest from room
 */
export function removeGuestFromRoom(room: Room, guestId: string): Omit<Room, 'id'> | null {
  if (!room.guests || room.guests.length === 0) {
    return null;
  }

  const updatedGuests = room.guests.filter(g => g.guestId !== guestId);

  // If removing representative and there are other guests, make first guest representative
  const removedGuest = room.guests.find(g => g.guestId === guestId);
  if (removedGuest?.isRepresentative && updatedGuests.length > 0) {
    updatedGuests[0].isRepresentative = true;
  }

  return {
    ...room,
    guests: updatedGuests,
    status: updatedGuests.length === 0 ? 'available' : 'occupied'
  };
}

/**
 * Change representative in room
 */
export function changeRoomRepresentative(
  room: Room,
  newRepresentativeId: string
): Omit<Room, 'id'> | null {
  if (!room.guests || room.guests.length === 0) {
    return null;
  }

  // Check if new representative is in the room
  const guestExists = room.guests.some(g => g.guestId === newRepresentativeId);
  if (!guestExists) {
    return null;
  }

  return {
    ...room,
    guests: room.guests.map(g => ({
      ...g,
      isRepresentative: g.guestId === newRepresentativeId
    }))
  };
}

/**
 * Check if date is in the past (historical)
 */
export function isHistoricalDate(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Get months difference from today
 */
export function getMonthsFromToday(dateString: string): number {
  const date = new Date(dateString);
  const today = new Date();
  const monthsDiff = (today.getFullYear() - date.getFullYear()) * 12 + (today.getMonth() - date.getMonth());
  return monthsDiff;
}

/**
 * Validate check-in date
 */
export function validateCheckInDate(dateString: string): {
  valid: boolean;
  isHistorical: boolean;
  isFuture: boolean;
  shouldWarn: boolean;
  message?: string;
} {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isFuture = date > today;
  const isHistorical = date < today;
  const monthsDiff = getMonthsFromToday(dateString);
  const shouldWarn = isHistorical && monthsDiff > 6;

  if (isFuture) {
    return {
      valid: false,
      isHistorical: false,
      isFuture: true,
      shouldWarn: false,
      message: 'Không thể chọn ngày trong tương lai'
    };
  }

  if (shouldWarn) {
    return {
      valid: true,
      isHistorical: true,
      isFuture: false,
      shouldWarn: true,
      message: `Bạn đang chọn ngày ${monthsDiff} tháng trước. Hãy chắc chắn rằng đây là ngày chính xác.`
    };
  }

  if (isHistorical) {
    return {
      valid: true,
      isHistorical: true,
      isFuture: false,
      shouldWarn: false,
      message: 'Ngày trong quá khứ - hữu ích cho chuyển đổi dữ liệu lịch sử'
    };
  }

  return {
    valid: true,
    isHistorical: false,
    isFuture: false,
    shouldWarn: false
  };
}
