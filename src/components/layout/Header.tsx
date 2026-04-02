import { Search, LogOut, Menu } from 'lucide-react';
import { ROUTE_TITLES } from '../../constants';
import { useAuthStore, useAppStore } from '../../stores';

export function Header() {
  const { activeTab, toggleSidebar } = useAppStore();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
        // Error is already handled in the store
      }
    }
  };

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 px-3 py-2 md:px-4 md:py-2.5 lg:py-3 flex justify-between items-center z-10 lg:pl-6">
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg md:text-xl font-bold">{ROUTE_TITLES[activeTab]}</h1>
      </div>
      <div className="flex items-center gap-1 md:gap-2 lg:gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="pl-8 pr-3 py-1.5 bg-gray-100 border-none rounded-full text-xs md:text-sm focus:ring-2 focus:ring-black transition-all w-32 md:w-48 lg:w-64"
          />
        </div>
        <button
          onClick={handleLogout}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          title="Đăng xuất"
        >
          <LogOut size={18} />
        </button>
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 border border-gray-300 overflow-hidden">
          <img src="https://picsum.photos/seed/admin/100/100" alt="Admin" referrerPolicy="no-referrer" />
        </div>
      </div>
    </header>
  );
}
