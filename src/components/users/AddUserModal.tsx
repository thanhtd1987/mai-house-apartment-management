import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, User, Shield, FileText } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: {
    email: string;
    displayName: string;
    role: 'super_admin' | 'admin' | 'staff';
    notes?: string;
  }) => void;
  initialData?: {
    email: string;
    displayName: string;
    role: 'super_admin' | 'admin' | 'staff';
    notes?: string;
  };
  isEditing?: boolean;
}

export function AddUserModal({ isOpen, onClose, onSubmit, initialData, isEditing = false }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: 'staff' as 'super_admin' | 'admin' | 'staff',
    notes: ''
  });

  const [errors, setErrors] = useState<{
    email?: string;
    displayName?: string;
  }>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Tên là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
      if (!isEditing) {
        setFormData({
          email: '',
          displayName: '',
          role: 'staff',
          notes: ''
        });
      }
      setErrors({});
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      displayName: '',
      role: 'staff',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {isEditing ? 'Chỉnh sửa User' : 'Thêm User Mới'}
                    </h2>
                    <p className="text-blue-100 mt-1">
                      {isEditing ? 'Cập nhật thông tin user' : 'Điền thông tin để tạo user mới'}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="text-white" size={24} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@example.com"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.email ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên hiển thị *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.displayName ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.displayName && (
                    <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quyền hạn *
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-4 text-gray-400" size={18} />
                    <div className="space-y-2 pl-10">
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="role"
                          value="staff"
                          checked={formData.role === 'staff'}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Staff</p>
                          <p className="text-xs text-gray-500">Quyền hạn cơ bản</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="role"
                          value="admin"
                          checked={formData.role === 'admin'}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Admin</p>
                          <p className="text-xs text-gray-500">Quyền hạn quản lý</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="role"
                          value="super_admin"
                          checked={formData.role === 'super_admin'}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Super Admin</p>
                          <p className="text-xs text-gray-500">Quyền hạn cao nhất</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Thêm ghi chú về user..."
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg"
                  >
                    {isEditing ? 'Cập nhật' : 'Thêm User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
