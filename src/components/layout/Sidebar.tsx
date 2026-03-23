import { motion } from 'motion/react';
import { Home, ChevronRight, LayoutDashboard, Bed, Users, Settings, FileText, DollarSign, Sparkles } from 'lucide-react';
import { NavItem } from './NavItem';
import { ROUTES, ROUTE_TITLES, RouteKey } from '../../constants';
import { useAppStore } from '../../stores';

const NAV_ITEMS = [
  { id: ROUTES.DASHBOARD, icon: <LayoutDashboard size={20} />, label: ROUTE_TITLES[ROUTES.DASHBOARD] },
  { id: ROUTES.ROOMS, icon: <Bed size={20} />, label: ROUTE_TITLES[ROUTES.ROOMS] },
  { id: ROUTES.GUESTS, icon: <Users size={20} />, label: ROUTE_TITLES[ROUTES.GUESTS] },
  { id: ROUTES.FACILITIES, icon: <Settings size={20} />, label: ROUTE_TITLES[ROUTES.FACILITIES] },
  { id: ROUTES.INVOICES, icon: <FileText size={20} />, label: ROUTE_TITLES[ROUTES.INVOICES] },
  { id: ROUTES.UTILITY_PRICING, icon: <DollarSign size={20} />, label: ROUTE_TITLES[ROUTES.UTILITY_PRICING] },
  { id: ROUTES.SERVICES, icon: <Sparkles size={20} />, label: ROUTE_TITLES[ROUTES.SERVICES] },
] as const;

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, activeTab, setActiveTab } = useAppStore();
  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 280 : 80 }}
      className="bg-white border-r border-gray-200 flex flex-col z-20"
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shrink-0">
          <Home size={24} />
        </div>
        {sidebarOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-xl tracking-tight"
          >
            Mai House
          </motion.span>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
            collapsed={!sidebarOpen}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {sidebarOpen ? <ChevronRight className="rotate-180" size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </motion.aside>
  );
}
