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
  serviceId: string;           // ID để lookup service details
  serviceName: string;          // Snapshot tên tại thời điểm tạo invoice
  unitPrice: number;            // Snapshot giá tại thời điểm tạo invoice
  quantity: number;             // Số lần dùng
  totalPrice: number;           // unitPrice * quantity
}
