import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { ExtraServiceConfig, ExtraServiceFormData, ServiceCategory, CATEGORY_CONFIG } from '../../types/extraService';
import { cn, formatCurrency } from '../../utils';
import { Modal } from '../common/Modal';

const ICON_OPTIONS = ['🧺', '🧹', '🛏️', '🚗', '🍽️', '📦', '🔌', '🚿', '🧴', '📺', '❄️'];

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingService?: ExtraServiceConfig | null;
  onSave: (data: ExtraServiceFormData) => Promise<void>;
}

export function AddServiceModal({ isOpen, onClose, editingService, onSave }: AddServiceModalProps) {
  const [formData, setFormData] = useState<ExtraServiceFormData>({
    name: '',
    icon: '🧺',
    price: 0,
    category: 'laundry',
    description: '',
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && !editingService) {
      setFormData({
        name: '',
        icon: '🧺',
        price: 0,
        category: 'laundry',
        description: '',
        isActive: true
      });
    } else if (isOpen && editingService) {
      setFormData({
        name: editingService.name,
        icon: editingService.icon,
        price: editingService.price,
        category: editingService.category,
        description: editingService.description,
        isActive: editingService.isActive
      });
    }
  }, [isOpen, editingService]);

  const handleSubmit = async () => {
    if (!formData.name || formData.price <= 0) {
      alert('Vui lòng nhập tên và giá dịch vụ!');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          title={editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
          size="md"
        >
          <div className="space-y-6">
            {/* Icon Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase">Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <motion.button
                    key={icon}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={cn(
                      "w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all border-2",
                      formData.icon === icon
                        ? "bg-blue-100 border-blue-500 shadow-md"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {icon}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Service Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase">Tên dịch vụ</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Giặt ủi, Dọn phòng..."
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                autoFocus
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase">Giá (VND)</label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                placeholder="50000"
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-lg"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase">Loại dịch vụ</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase">Mô tả (tùy chọn)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết về dịch vụ..."
                rows={2}
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none text-sm"
              />
            </div>

            {/* Category Preview */}
            <div className={cn(
              "p-4 rounded-xl border-2",
              CATEGORY_CONFIG[formData.category].bgColor,
              CATEGORY_CONFIG[formData.category].borderColor
            )}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{formData.icon || CATEGORY_CONFIG[formData.category].icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{formData.name || 'Tên dịch vụ'}</p>
                  <p className={cn(
                    "text-xs font-medium",
                    CATEGORY_CONFIG[formData.category].textColor
                  )}>
                    {CATEGORY_CONFIG[formData.category].label}
                  </p>
                </div>
                <p className="font-black text-gray-900">
                  {formData.price ? formatCurrency(formData.price) : '---'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 p-3 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name || formData.price <= 0}
              className={cn(
                "flex-1 p-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2",
                (isSubmitting || !formData.name || formData.price <= 0)
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/30"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  {editingService ? 'Cập nhật' : 'Thêm dịch vụ'}
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
}
