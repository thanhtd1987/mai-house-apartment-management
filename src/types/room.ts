export interface Room {
  id: string;
  number: string;
  type: 'single' | 'double';
  status: 'available' | 'occupied' | 'maintenance';
  price: number;
  lastElectricityMeter: number;
  meterId?: string;
  paymentStatus: 'paid' | 'unpaid' | 'debt';
  currentGuestId?: string;
  facilities?: string[];
}

export type RoomType = Room['type'];
export type RoomStatus = Room['status'];
export type PaymentStatus = Room['paymentStatus'];
