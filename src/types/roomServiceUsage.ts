/**
 * Lưu usage của extra services cho phòng theo tháng
 * Khi tạo invoice, sẽ lấy services của tháng đó, lưu snapshot vào invoice, sau đó xóa usage
 */
export interface RoomServiceUsage {
  id: string;
  roomId: string;
  month: string;                // Format: "YYYY-MM" (ví dụ: "2024-03")
  services: ServiceUsage[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceUsage {
  serviceId: string;            // ID để lookup từ extraServices collection
  quantity: number;             // Số lần dùng
  createdAt: string;            // Thời gian tạo record này (để nhắc lại/ghi nhớ)
  notes?: string;               // Ghi chú tùy chọn
  // Payment tracking
  status?: 'unpaid' | 'paid';   // Trạng thái thanh toán (default: unpaid)
  paidAt?: string;              // Thời gian thanh toán
  paymentMethod?: 'cash' | 'transfer' | 'other'; // Phương thức thanh toán
  paidAmount?: number;          // Số tiền đã thanh toán
}

/**
 * Helper để lấy tháng hiện tại dưới dạng string YYYY-MM
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Helper để format month string sang hiển thị tiếng Việt
 */
export function formatMonth(monthString: string): string {
  const [year, month] = monthString.split('-');
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}
