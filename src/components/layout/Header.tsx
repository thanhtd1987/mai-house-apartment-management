import { Search } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
}

export function Header({ activeTab }: HeaderProps) {
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Tổng quan hệ thống';
      case 'rooms':
        return 'Quản lý phòng';
      case 'guests':
        return 'Quản lý khách lưu trú';
      case 'facilities':
        return 'Cơ sở vật chất';
      case 'invoices':
        return 'Hóa đơn & Thanh toán';
      default:
        return '';
    }
  };

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-bottom border-gray-200 p-6 flex justify-between items-center z-10">
      <h1 className="text-2xl font-bold capitalize">{getHeaderTitle()}</h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-black transition-all w-64"
          />
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 overflow-hidden">
          <img src="https://picsum.photos/seed/admin/100/100" alt="Admin" referrerPolicy="no-referrer" />
        </div>
      </div>
    </header>
  );
}
