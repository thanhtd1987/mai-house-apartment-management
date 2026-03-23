export interface RoomGuest {
  guestId: string;
  isRepresentative: boolean;
  checkInDate: string;
  checkoutDate?: string;
}

export interface Room {
  id: string;
  number: string;
  type: 'single' | 'double';
  status: 'available' | 'occupied' | 'maintenance';
  price: number;
  lastElectricityMeter: number;
  meterId?: string;
  paymentStatus: 'paid' | 'unpaid' | 'debt';
  // NEW: Multiple guests per room with representative support
  guests?: RoomGuest[];
  // DEPRECATED: Kept for backward compatibility during migration
  currentGuestId?: string;
  facilities?: string[];
}

export type RoomType = Room['type'];
export type RoomStatus = Room['status'];
export type PaymentStatus = Room['paymentStatus'];
