import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, X } from 'lucide-react';
import { RoomStatus } from '../../types';
import { cn } from '../../utils';

interface RoomFilterBarProps {
  onFilterChange: (filters: {
    search: string;
    status: RoomStatus | 'all';
  }) => void;
}

export function RoomFilterBar({ onFilterChange }: RoomFilterBarProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RoomStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions: { value: RoomStatus | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'Tất cả', color: 'bg-slate-100 text-slate-700' },
    { value: 'available', label: 'Trống', color: 'bg-green-100 text-green-700' },
    { value: 'occupied', label: 'Đang ở', color: 'bg-blue-100 text-blue-700' },
    { value: 'maintenance', label: 'Bảo trì', color: 'bg-amber-100 text-amber-700' }
  ];

  React.useEffect(() => {
    onFilterChange({ search, status });
  }, [search, status, onFilterChange]);

  const hasActiveFilters = search || status !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên khách hoặc số phòng..."
            className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 transition-all cursor-pointer",
            showFilters || hasActiveFilters
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
              : "bg-white/80 backdrop-blur-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          <Filter size={18} />
          <span className="hidden sm:inline">Bộ lọc</span>
          {hasActiveFilters && !showFilters && (
            <span className="ml-1 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
              1
            </span>
          )}
        </motion.button>
      </div>

      {/* Filter Pills */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700">Trạng thái phòng</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStatus(option.value)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                      status === option.value
                        ? "bg-blue-600 text-white shadow-md"
                        : option.color
                    )}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Summary */}
      {hasActiveFilters && !showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          {status !== 'all' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold">
              <span>Trạng thái: {statusOptions.find(o => o.value === status)?.label}</span>
              <button
                onClick={() => setStatus('all')}
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
