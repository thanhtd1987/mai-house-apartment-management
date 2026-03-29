import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Battery, Calendar, Check, AlertCircle } from 'lucide-react';
import { cn, addDays, formatDate } from '../../utils';

interface UpdateBatteryModalProps {
  isOpen: boolean;
  lockId: string;
  currentBatteryDate: string;
  onSubmit: (lockId: string, batteryReplacementDate: string, nextBatteryReplacementDate: string) => Promise<void>;
  onClose: () => void;
}

export function UpdateBatteryModal({
  isOpen,
  lockId,
  currentBatteryDate,
  onSubmit,
  onClose
}: UpdateBatteryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batteryReplacementDate: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        batteryReplacementDate: new Date().toISOString().split('T')[0]
      });
      setErrors({});
      setTouched({});
    }
  }, [isOpen]);

  // Auto-calculate next battery replacement date
  const nextBatteryReplacementDate = formData.batteryReplacementDate
    ? addDays(formData.batteryReplacementDate, 45)
    : null;

  const validateField = (name: string, value: string) => {
    switch (name) {
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
      const nextDate = nextBatteryReplacementDate
        ? nextBatteryReplacementDate.toISOString()
        : addDays(formData.batteryReplacementDate, 45).toISOString();

      await onSubmit(lockId, formData.batteryReplacementDate, nextDate);
      onClose();
    } catch (error) {
      console.error('Error updating battery date:', error);
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
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Battery size={24} />
                Cập nhật ngày thay pin
              </h2>
              <p className="text-green-100 text-sm mt-1">
                Theo dõi lịch thay pin khóa cửa
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
            {/* Current Battery Date Display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Battery size={16} className="text-slate-500" />
                <span className="font-semibold">Ngày thay pin gần nhất:</span>
                <span className="font-bold text-slate-800">
                  {formatDate(currentBatteryDate)}
                </span>
              </div>
            </motion.div>

            {/* Battery Replacement Date */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <Calendar size={16} className="text-green-600" />
                Ngày thay pin <span className="text-red-500">*</span>
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
            </motion.div>

            {/* Next Battery Replacement Preview */}
            {nextBatteryReplacementDate && !errors.batteryReplacementDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl"
              >
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Calendar size={16} className="text-blue-600" />
                  <span className="font-semibold text-blue-800">Lần thay pin tiếp theo:</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatDate(nextBatteryReplacementDate)}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Chu kỳ thay pin được khuyến nghị mỗi 45 ngày để đảm bảo hoạt động tốt nhất
                </p>
              </motion.div>
            )}

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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Battery size={20} />
                    </motion.div>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Cập nhật
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
