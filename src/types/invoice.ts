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
  extraServices: ExtraService[];
  totalPrice: number;
  status: 'paid' | 'unpaid';
  createdAt: string;
}

export interface ExtraService {
  name: string;
  price: number;
}
