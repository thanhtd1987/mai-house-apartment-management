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

export interface Guest {
  id: string;
  name: string;
  idNumber: string;
  phone: string;
  email: string;
  idPhoto: string;
  checkInDate: string;
}

export interface Facility {
  id: string;
  name: string;
  compensationPrice: number;
}

export interface Invoice {
  id: string;
  roomId: string;
  meterId?: string;
  month: number;
  year: number;
  electricityOld: number;
  electricityNew: number;
  electricityUsed: number;
  electricityPrice: number;
  waterPrice: number;
  extraServices: { name: string; price: number }[];
  totalPrice: number;
  status: 'paid' | 'unpaid';
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}
