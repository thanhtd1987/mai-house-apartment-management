import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Calendar, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { cn, addMonths, formatDate } from '../../utils';

type ExpiryType = 'date' | '3months' | '6months';

interface UpdatePasswordModalProps {
  isOpen: boolean;
  lockId: string;
  currentPassword: string;
  onSubmit: (lockId: string, password: string, expiryDate: string) => Promise<void>;
  onClose: () => void;
}

export function UpdatePasswordModal({
  isOpen,
  lockId,
  currentPassword,
  onSubmit,
  onClose
}: UpdatePasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [expiryType, setExpiryType] = useState<ExpiryType>('3months');
  const [formData, setFormData] = useState({
    password: '',
    expiryDate: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        password: '',
        expiryDate: addMonths(new Date(), 3).toISOString().split('T')[0]
      });
      setErrors({});
      setTouched({});
      setShowPassword(false);
      setExpiryType('3months');
    }
  }, [isOpen]);

  // Auto-calculate expiry date based on expiry type
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      let calculatedDate: Date;

      switch (expiryType) {
        case '3months':
          calculatedDate = addMonths(today, 3);
          break;
        case '6months':
          calculatedDate = addMonths(today, 6);
          break;
        case 'date':
          // Keep manually selected date
          return;
        default:
          calculatedDate = addMonths(today, 3);
      }

      setFormData(prev => ({
        ...prev,
        expiryDate: calculatedDate.toISOString().split('T')[0]
      }));
    }
  }, [expiryType, isOpen]);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'password':
        if (!value) {
          return 'Mật khẩu là bắt buộc';
        }
        if (value.length < 4) {
          return 'Mật khẩu phải có ít nhất 4 ký tự';
        }
        if (value.length > 12) {
          return 'Mật khẩu không được quá 12 ký tự';
        }
        if (!/^\d+$/.test(value)) {
          return 'Mật khẩu chỉ được chứa số';
        }
        if (value === currentPassword) {
          return 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }
        break;
      case 'expiryDate':
        if (!value) {
          return 'Ngày hết hạn mật khẩu là bắt buộc';
        }
        if (new Date(value) <= new Date()) {
          return 'Ngày hết hạn phải trong tương lai';
        }
        break;
      default:
        break;
    }
    return '';
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate field if it has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleExpiryTypeChange = (type: ExpiryType) => {
    setExpiryType(type);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    setTouched({
      password: true,
      expiryDate: true
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(lockId, formData.password, formData.expiryDate);
      onClose();
    } catch (error) {
      console.error('Error updating password:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isDateInputDisabled = expiryType !== 'date';

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
        className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock size={24} />
                Cập nhật mật khẩu
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Đổi mật khẩu cho khóa cửa thông minh
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password Display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Lock size={16} className="text-slate-500" />
                <span className="font-semibold">Mật khẩu hiện tại:</span>
                <span className="font-mono font-bold text-slate-800">{currentPassword}</span>
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Lock size={16} className="text-blue-600" />
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Nhập mật khẩu mới (4-12 số)"
                  className={cn(
                    "w-full p-3 pr-12 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                    errors.password && touched.password
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  )}
                  maxLength={12}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && touched.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1 text-red-600 text-xs"
                  >
                    <AlertCircle size={14} />
                    {errors.password}
                  </motion.div>
                )}
              </AnimatePresence>
              {!errors.password && (
                <p className="text-xs text-slate-500">Mật khẩu chỉ chứa số, từ 4-12 ký tự</p>
              )}
            </motion.div>

            {/* Expiry Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Calendar size={16} className="text-purple-600" />
                Thời hạn mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleExpiryTypeChange('3months')}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all border-2 cursor-pointer",
                    expiryType === '3months'
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  3 tháng
                </button>
                <button
                  type="button"
                  onClick={() => handleExpiryTypeChange('6months')}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all border-2 cursor-pointer",
                    expiryType === '6months'
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  6 tháng
                </button>
                <button
                  type="button"
                  onClick={() => handleExpiryTypeChange('date')}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all border-2 cursor-pointer",
                    expiryType === 'date'
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Tùy chọn
                </button>
              </div>
            </motion.div>

            {/* Password Expiry Date */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Calendar size={16} className="text-purple-600" />
                Ngày hết hạn <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => {
                  handleInputChange('expiryDate', e.target.value);
                  if (expiryType !== 'date') {
                    setExpiryType('date');
                  }
                }}
                onBlur={() => handleBlur('expiryDate')}
                min={new Date().toISOString().split('T')[0]}
                disabled={isDateInputDisabled}
                className={cn(
                  "w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all",
                  errors.expiryDate && touched.expiryDate
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200",
                  isDateInputDisabled && "opacity-60 cursor-not-allowed"
                )}
                required
              />
              <AnimatePresence>
                {errors.expiryDate && touched.expiryDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1 text-red-600 text-xs"
                  >
                    <AlertCircle size={14} />
                    {errors.expiryDate}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expiry Date Preview */}
              {formData.expiryDate && !errors.expiryDate && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-purple-600" />
                    <span className="font-semibold text-purple-800">Ngày hết hạn:</span>
                    <span className="text-purple-700 font-bold">
                      {formatDate(formData.expiryDate)}
                    </span>
                  </div>
                  {expiryType === '3months' && (
                    <p className="text-xs text-purple-600 mt-1">(+3 tháng từ hôm nay)</p>
                  )}
                  {expiryType === '6months' && (
                    <p className="text-xs text-purple-600 mt-1">(+6 tháng từ hôm nay)</p>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Submit Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-3 pt-4"
            >
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Lock size={20} />
                    </motion.div>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Cập nhật mật khẩu
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
