import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Calendar, Battery, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { SmartLock } from '../../types';
import { cn, addDays, formatDate } from '../../utils';

interface SetupSmartLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lockData: Partial<SmartLock>) => Promise<void>;
  roomId: string;
}

export function SetupSmartLockModal({
  isOpen,
  onClose,
  onSave,
  roomId
}: SetupSmartLockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    passwordExpiryDate: '',
    batteryReplacementDate: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        password: '',
        passwordExpiryDate: '',
        batteryReplacementDate: new Date().toISOString().split('T')[0]
      });
      setErrors({});
      setTouched({});
      setShowPassword(false);
    }
  }, [isOpen]);

  // Auto-calculate next battery replacement date when batteryReplacementDate changes
  const nextBatteryReplacementDate = formData.batteryReplacementDate
    ? addDays(formData.batteryReplacementDate, 45)
    : null;

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
        break;
      case 'passwordExpiryDate':
        if (!value) {
          return 'Ngày hết hạn mật khẩu là bắt buộc';
        }
        if (new Date(value) <= new Date()) {
          return 'Ngày hết hạn phải trong tương lai';
        }
        break;
      case 'batteryReplacementDate':
        if (!value) {
          return 'Ngày thay pin là bắt buộc';
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
      passwordExpiryDate: true,
      batteryReplacementDate: true
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
      const lockData: Partial<SmartLock> = {
        roomId,
        password: formData.password,
        passwordExpiryDate: new Date(formData.passwordExpiryDate).toISOString(),
        batteryReplacementDate: new Date(formData.batteryReplacementDate).toISOString(),
        nextBatteryReplacementDate: nextBatteryReplacementDate
          ? nextBatteryReplacementDate.toISOString()
          : addDays(formData.batteryReplacementDate, 45).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(lockData);
      onClose();
    } catch (error) {
      console.error('Error saving smart lock:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
                Thiết lập khóa cửa thông minh
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Cài đặt mật khẩu và theo dõi pin
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
            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Lock size={16} className="text-blue-600" />
                Mật khẩu khóa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Nhập mật khẩu (4-12 số)"
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

            {/* Password Expiry Date */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Calendar size={16} className="text-purple-600" />
                Ngày hết hạn mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.passwordExpiryDate}
                onChange={(e) => handleInputChange('passwordExpiryDate', e.target.value)}
                onBlur={() => handleBlur('passwordExpiryDate')}
                min={new Date().toISOString().split('T')[0]}
                className={cn(
                  "w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all",
                  errors.passwordExpiryDate && touched.passwordExpiryDate
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200"
                )}
                required
              />
              <AnimatePresence>
                {errors.passwordExpiryDate && touched.passwordExpiryDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1 text-red-600 text-xs"
                  >
                    <AlertCircle size={14} />
                    {errors.passwordExpiryDate}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Battery Replacement Date */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Battery size={16} className="text-green-600" />
                Ngày thay pin
              </label>
              <input
                type="date"
                value={formData.batteryReplacementDate}
                onChange={(e) => handleInputChange('batteryReplacementDate', e.target.value)}
                onBlur={() => handleBlur('batteryReplacementDate')}
                className={cn(
                  "w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all",
                  errors.batteryReplacementDate && touched.batteryReplacementDate
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200"
                )}
                required
              />
              <AnimatePresence>
                {errors.batteryReplacementDate && touched.batteryReplacementDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1 text-red-600 text-xs"
                  >
                    <AlertCircle size={14} />
                    {errors.batteryReplacementDate}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Next Battery Replacement Preview */}
              {nextBatteryReplacementDate && !errors.batteryReplacementDate && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Battery size={16} className="text-green-600" />
                    <span className="font-semibold text-green-800">Lần thay pin tiếp theo:</span>
                    <span className="text-green-700 font-bold">
                      {formatDate(nextBatteryReplacementDate)}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    (+45 ngày từ ngày thay pin)
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Submit Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Lưu khóa cửa
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
