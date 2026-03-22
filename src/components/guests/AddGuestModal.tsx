import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, User, FileText, Calendar, Camera, Check } from 'lucide-react';
import { Guest } from '../../types';
import { cn } from '../../utils';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (guestData: Partial<Guest>) => Promise<void>;
  guest?: Partial<Guest>;
}

type GuestStep = 'photo' | 'basic' | 'confirm';

export function AddGuestModal({ isOpen, onClose, onSave, guest }: AddGuestModalProps) {
  const [step, setStep] = useState<GuestStep>('photo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    phone: '',
    email: '',
    idPhoto: '',
    checkInDate: new Date().toISOString().split('T')[0]
  });

  // Update formData when guest prop changes
  useEffect(() => {
    if (guest) {
      setFormData({
        name: guest.name || '',
        idNumber: guest.idNumber || '',
        phone: guest.phone || '',
        email: guest.email || '',
        idPhoto: guest.idPhoto || '',
        checkInDate: guest.checkInDate || new Date().toISOString().split('T')[0]
      });
    } else {
      // Reset to default values when adding new guest
      setFormData({
        name: '',
        idNumber: '',
        phone: '',
        email: '',
        idPhoto: '',
        checkInDate: new Date().toISOString().split('T')[0]
      });
    }
    // Reset step to photo when modal opens with different guest
    setStep('photo');
  }, [guest, isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving guest:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!guest?.id;

  if (!isOpen) return null;

  const steps = [
    { key: 'photo', label: 'Ảnh', icon: Camera },
    { key: 'basic', label: 'Thông tin', icon: User },
    { key: 'confirm', label: 'Xác nhận', icon: Check }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Chỉnh sửa khách' : 'Đăng ký khách mới'}
              </h2>
              <p className="text-purple-100 text-sm">
                {isEditMode ? 'Cập nhật thông tin khách' : 'Thêm khách vào hệ thống'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((s, idx) => (
              <button
                key={s.key}
                onClick={() => setStep(s.key as GuestStep)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer text-sm",
                  step === s.key
                    ? "bg-white text-purple-600 shadow-lg"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                <s.icon size={16} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {step === 'photo' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Camera size={20} className="text-purple-600" />
                Ảnh định danh
              </h3>

              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-dashed border-purple-300 flex items-center justify-center overflow-hidden">
                    {formData.idPhoto ? (
                      <img
                        src={formData.idPhoto}
                        alt="ID Photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <Camera size={48} className="text-purple-400 mx-auto mb-3" />
                        <p className="text-purple-600 font-semibold">Chưa có ảnh</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-4 right-4 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition-colors cursor-pointer"
                  >
                    <Camera size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                <p className="text-sm text-purple-800">
                  💡 <span className="font-semibold">Mẹo:</span> Tải lên ảnh CCCD/Passport để tự động điền thông tin
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep('basic')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all cursor-pointer"
                >
                  Tiếp theo
                </button>
              </div>
            </motion.div>
          )}

          {step === 'basic' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User size={20} className="text-pink-600" />
                Thông tin cá nhân
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <User size={16} className="text-purple-600" />
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <FileText size={16} className="text-pink-600" />
                      Số CCCD/Passport <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      placeholder="001234567890"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Số điện thoại</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0912345678"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Calendar size={16} className="text-purple-600" />
                    Ngày đăng ký
                  </label>
                  <input
                    type="date"
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep('photo')}
                  className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep('confirm')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all cursor-pointer"
                >
                  Tiếp theo
                </button>
              </div>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Check size={20} className="text-green-600" />
                Xác nhận thông tin
              </h3>

              <div className="bg-gradient-to-br from-green-50 to-purple-50/30 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                    {formData.idPhoto ? (
                      <img
                        src={formData.idPhoto}
                        alt={formData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      formData.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{formData.name}</p>
                    <p className="text-slate-600">{formData.idNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Số điện thoại</p>
                    <p className="text-lg font-bold text-slate-800">{formData.phone || 'Chưa cung cấp'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Email</p>
                    <p className="text-lg font-bold text-slate-800">{formData.email || 'Chưa cung cấp'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Ngày đăng ký</p>
                    <p className="text-lg font-bold text-purple-600">{formData.checkInDate}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep('basic')}
                  className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Xác nhận & Lưu'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
