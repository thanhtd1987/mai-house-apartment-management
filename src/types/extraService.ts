export type ServiceCategory =
  | 'laundry'    // 🧺 Giặt là
  | 'cleaning'   // 🧹 Dọn dẹp
  | 'amenities'  // 🛏️ Tiện nghi
  | 'parking'    // 🚗 Gửi xe
  | 'food'       // 🍽️ Ăn uống
  | 'other';     // 📦 Khác

export interface ExtraServiceConfig {
  id: string;
  name: string;
  icon?: string;              // SVG icon path hoặc emoji cho đơn giản
  price: number;
  category: ServiceCategory;
  description?: string;
  isActive: boolean;
  sortOrder?: number;         // Để control thứ tự hiển thị

  // Auto-calculated from invoices
  usageCount?: number;
  lastUsedAt?: string;
  revenueGenerated?: number;

  createdAt: string;
  updatedAt: string;
}

export interface ExtraServiceFormData {
  name: string;
  icon?: string;
  price: number;
  category: ServiceCategory;
  description?: string;
  isActive: boolean;
}

// Category configuration với accessibility
export const CATEGORY_CONFIG: Record<ServiceCategory, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  gradient: string;
}> = {
  laundry: {
    label: 'Giặt là',
    icon: '🧺',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    gradient: 'from-blue-500 to-cyan-500'
  },
  cleaning: {
    label: 'Dọn dẹp',
    icon: '🧹',
    color: 'amber',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    gradient: 'from-amber-500 to-orange-500'
  },
  amenities: {
    label: 'Tiện nghi',
    icon: '🛏️',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    gradient: 'from-purple-500 to-pink-500'
  },
  parking: {
    label: 'Gửi xe',
    icon: '🚗',
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    gradient: 'from-emerald-500 to-teal-500'
  },
  food: {
    label: 'Ăn uống',
    icon: '🍽️',
    color: 'rose',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    gradient: 'from-rose-500 to-red-500'
  },
  other: {
    label: 'Khác',
    icon: '📦',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    gradient: 'from-gray-500 to-slate-500'
  }
};
