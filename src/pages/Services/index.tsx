import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Filter } from 'lucide-react';
import { doc, updateDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../../services';
import { ExtraServiceConfig, ExtraServiceFormData, ServiceCategory, CATEGORY_CONFIG } from '../../types/extraService';
import { ServiceCard, AddServiceModal } from '../../components/services';
import { ConfirmDialog } from '../../components/common';
import { cn } from '../../utils';
import { useDataStore, useToastStore } from '../../stores';

interface ServicesManagerProps {
  onUpdateServices: () => void;
}

export function ServicesManager({ onUpdateServices }: ServicesManagerProps) {
  const { extraServices: services } = useDataStore();
  const { addToast } = useToastStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ExtraServiceConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  const filteredServices = services.filter(service => {
    const matchesSearch = !searchQuery || service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSaveService = async (data: ExtraServiceFormData) => {
    try {
      if (editingService) {
        await updateDoc(doc(db, 'extraServices', editingService.id), {
          ...data,
          updatedAt: new Date().toISOString()
        });
        addToast('Đã cập nhật dịch vụ', 'success');
      } else {
        await addDoc(collection(db, 'extraServices'), {
          ...data,
          usageCount: 0,
          revenueGenerated: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        addToast('Đã thêm dịch vụ mới', 'success');
      }
      onUpdateServices();
      setIsModalOpen(false);
      setEditingService(null);
    } catch (err) {
      console.error('Error saving service:', err);
      addToast('Không thể lưu dịch vụ!', 'error');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteDoc(doc(db, 'extraServices', serviceId));
      addToast('Đã xóa dịch vụ', 'success');
      onUpdateServices();
      setDeletingServiceId(null);
    } catch (err) {
      console.error('Error deleting service:', err);
      addToast('Không thể xóa dịch vụ!', 'error');
    }
  };

  const handleDeleteClick = (serviceId: string) => {
    setDeletingServiceId(serviceId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dịch Vụ Thêm</h1>
          <p className="text-gray-500 mt-1 md:mt-2 text-sm">
            Quản lý các dịch vụ: giặt ủi, dọn phòng, tiện nghi...
          </p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors text-sm"
        >
          <Plus size={18} />
          Thêm dịch vụ
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm dịch vụ..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ServiceCategory | 'all')}
            className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer font-medium"
          >
            <option value="all">Tất cả</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12 md:py-16">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Plus size={32} className="text-gray-400 w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
            {searchQuery || categoryFilter !== 'all' ? 'Không tìm thấy dịch vụ nào' : 'Chưa có dịch vụ nào'}
          </h3>
          <p className="text-gray-500 mb-4 md:mb-6 text-sm">
            {searchQuery || categoryFilter !== 'all'
              ? 'Thử thay đổi bộ lọc'
              : 'Bắt đầu thêm dịch vụ đầu tiên'}
          </p>
          {(searchQuery || categoryFilter !== 'all') ? (
            <button
              onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}
              className="px-4 py-2 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Xóa bộ lọc
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Thêm dịch vụ
            </button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <AnimatePresence>
            {filteredServices.map((service) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <ServiceCard
                  service={service}
                  onEdit={(service) => { setEditingService(service); setIsModalOpen(true); }}
                  onDelete={handleDeleteClick}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isModalOpen || editingService) && (
          <AddServiceModal
            isOpen={isModalOpen || !!editingService}
            onClose={() => { setIsModalOpen(false); setEditingService(null); }}
            editingService={editingService}
            onSave={handleSaveService}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingServiceId}
        title="Xác nhận xóa dịch vụ"
        message="Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác."
        type="danger"
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={() => deletingServiceId && handleDeleteService(deletingServiceId)}
        onCancel={() => setDeletingServiceId(null)}
      />
    </div>
  );
}
