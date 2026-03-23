import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Minus, Search, ChevronDown, Check } from 'lucide-react';
import { ExtraServiceConfig, CATEGORY_CONFIG } from '../../types/extraService';
import { cn, formatCurrency } from '../../utils';

interface InvoiceService {
  name: string;
  price: number;
  quantity: number;
}

interface AddInvoiceServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (service: InvoiceService) => void;
  availableServices?: ExtraServiceConfig[];
}

export function AddInvoiceServiceModal({
  isOpen,
  onClose,
  onAdd,
  availableServices = []
}: AddInvoiceServiceModalProps) {
  // State cho phần nhập mới
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceQuantity, setNewServiceQuantity] = useState(1);

  // State cho phần chọn từ list có sẵn
  const [selectedFromList, setSelectedFromList] = useState<{ service: ExtraServiceConfig; quantity: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleAddFromList = (service: ExtraServiceConfig) => {
    const existing = selectedFromList.find(s => s.service.id === service.id);
    if (existing) {
      // Tăng quantity
      setSelectedFromList(prev => prev.map(item =>
        item.service.id === service.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedFromList([...selectedFromList, { service, quantity: 1 }]);
    }
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleAddNewService = () => {
    if (!newServiceName.trim() || !newServicePrice || Number(newServicePrice) <= 0) {
      alert('Vui lòng nhập tên và giá dịch vụ!');
      return;
    }

    onAdd({
      name: newServiceName.trim(),
      price: Number(newServicePrice),
      quantity: newServiceQuantity
    });

    // Reset form
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceQuantity(1);
  };

  const handleAddSelectedServices = () => {
    // Add tất cả services đã chọn từ list
    selectedFromList.forEach(item => {
      onAdd({
        name: item.service.name,
        price: item.service.price,
        quantity: item.quantity
      });
    });

    // Reset
    setSelectedFromList([]);
    setSearchQuery('');
    onClose();
  };

  const filteredServices = availableServices.filter(service =>
    !searchQuery || service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasSelectedServices = selectedFromList.length > 0;

  const updateQuantity = (serviceId: string, delta: number) => {
    setSelectedFromList(prev => {
      const updated = prev.map(item => {
        if (item.service.id === serviceId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      return updated;
    });
  };

  const removeSelected = (serviceId: string) => {
    setSelectedFromList(prev => prev.filter(item => item.service.id !== serviceId));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-teal-600">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">Thêm Dịch Vụ</h3>
                  <p className="text-sm text-emerald-100">Chọn từ danh sách hoặc nhập mới</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Section 1: Chọn từ danh sách có sẵn */}
              {availableServices.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      Chọn từ danh sách
                    </h4>
                    <span className="text-xs text-gray-400">
                      {selectedFromList.reduce((sum, item) => sum + item.quantity, 0)} đã chọn
                    </span>
                  </div>

                  {/* Search Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <div
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Search size={16} className="text-gray-400" />
                        <span className={cn(
                          "text-sm",
                          searchQuery ? "text-gray-900" : "text-gray-400"
                        )}>
                          {searchQuery || 'Tìm dịch vụ...'}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={cn(
                          "text-gray-400 transition-transform",
                          isDropdownOpen && "rotate-180"
                        )}
                      />
                    </div>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
                        >
                          {filteredServices.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                              Không tìm thấy dịch vụ nào
                            </div>
                          ) : (
                            filteredServices.map((service) => {
                              const categoryConfig = CATEGORY_CONFIG[service.category];
                              const selected = selectedFromList.find(s => s.service.id === service.id);

                              return (
                                <div
                                  key={service.id}
                                  onClick={() => handleAddFromList(service)}
                                  className={cn(
                                    "p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors",
                                    "hover:bg-blue-50 flex items-center justify-between"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg">{categoryConfig.icon}</span>
                                    <div>
                                      <p className="font-semibold text-gray-900 text-sm">
                                        {service.name}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {categoryConfig.label} - {formatCurrency(service.price)}
                                      </p>
                                    </div>
                                  </div>
                                  {selected && (
                                    <div className="flex items-center gap-1">
                                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                                        {selected.quantity}
                                      </span>
                                      <Check size={16} className="text-blue-600" strokeWidth={3} />
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Selected List */}
                  {selectedFromList.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <AnimatePresence>
                        {selectedFromList.map((item) => {
                          const categoryConfig = CATEGORY_CONFIG[item.service.category];
                          return (
                            <motion.div
                              key={item.service.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className="flex items-center gap-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl"
                            >
                              <span className="text-lg">{categoryConfig.icon}</span>
                              <span className="text-xs font-bold text-blue-700 min-w-fit">
                                {categoryConfig.label}
                              </span>
                              <span className="flex-1 font-bold text-gray-900 text-sm truncate">
                                {item.service.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatCurrency(item.service.price)}
                              </span>
                              <div className="flex items-center gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateQuantity(item.service.id, -1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-blue-600 hover:bg-blue-100 font-bold text-sm shadow-sm"
                                >
                                  <Minus size={12} />
                                </motion.button>
                                <span className="w-8 text-center font-bold text-blue-600">
                                  {item.quantity}
                                </span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateQuantity(item.service.id, 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm shadow-sm"
                                >
                                  <Plus size={12} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeSelected(item.service.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 ml-1"
                                >
                                  <X size={12} />
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Add selected services button */}
                  {hasSelectedServices && (
                    <motion.button
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleAddSelectedServices}
                      className="w-full mt-3 p-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      Thêm {selectedFromList.length} dịch vụ đã chọn vào hóa đơn
                    </motion.button>
                  )}
                </div>
              )}

              {/* Divider */}
              {availableServices.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-xs font-bold text-gray-400 uppercase">hoặc</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                </div>
              )}

              {/* Section 2: Nhập dịch vụ mới - INLINE FORM */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Nhập dịch vụ mới
                </h4>

                {/* Inline Form: Tên | Giá | Counter | Button */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border-2 border-emerald-200">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Tên dịch vụ */}
                    <div className="flex-1 min-w-[150px]">
                      <input
                        type="text"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="Tên dịch vụ"
                        className="w-full p-2.5 bg-white border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium"
                      />
                    </div>

                    {/* Giá */}
                    <div className="w-28">
                      <input
                        type="number"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        placeholder="Giá"
                        className="w-full p-2.5 bg-white border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm font-bold"
                      />
                    </div>

                    {/* Counter */}
                    <div className="flex items-center gap-2 bg-white rounded-xl p-1">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setNewServiceQuantity(Math.max(1, newServiceQuantity - 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-bold text-sm"
                      >
                        <Minus size={14} />
                      </motion.button>

                      <div className="w-10 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-lg font-bold text-sm">
                        {newServiceQuantity}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setNewServiceQuantity(newServiceQuantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-bold text-sm"
                      >
                        <Plus size={14} />
                      </motion.button>
                    </div>

                    {/* Add Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddNewService}
                      disabled={!newServiceName.trim() || !newServicePrice || Number(newServicePrice) <= 0}
                      className={cn(
                        "px-4 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2",
                        (!newServiceName.trim() || !newServicePrice || Number(newServicePrice) <= 0)
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/30"
                      )}
                    >
                      <Plus size={16} />
                      Thêm
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
