import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Users, Trash2, X as CloseIcon } from 'lucide-react';

interface DeleteLockConfirmationModalProps {
  isOpen: boolean;
  roomNumber: string;
  hasActiveGuests: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function DeleteLockConfirmationModal({
  isOpen,
  roomNumber,
  hasActiveGuests,
  onConfirm,
  onClose
}: DeleteLockConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    if (hasActiveGuests) return;

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting smart lock:', error);
    } finally {
      setIsDeleting(false);
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
        <div className="bg-gradient-to-r from-rose-600 to-red-600 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle size={24} />
                Xác nhận xóa khóa cửa
              </h2>
              <p className="text-rose-100 text-sm mt-1">
                Hành động này không thể hoàn tác
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
          <div className="space-y-6">
            {/* Warning Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-800 mb-1">Cảnh báo quan trọng</h3>
                  <p className="text-sm text-red-700 leading-relaxed">
                    Bạn đang xóa khóa cửa thông minh của phòng <span className="font-bold">{roomNumber}</span>.
                    Tất cả dữ liệu liên quan đến khóa cửa sẽ bị xóa vĩnh viễn.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Active Guests Warning */}
            {hasActiveGuests && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <Users size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-800 mb-1">Không thể xóa</h3>
                    <p className="text-sm text-amber-700 leading-relaxed">
                      Phòng này hiện tại đang có khách lưu trú. Bạn cần kiểm tra khách ra trước khi xóa khóa cửa.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Data Loss Warning */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                <AlertTriangle size={18} className="text-slate-500" />
                Dữ liệu sẽ bị xóa:
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <span>Mật khẩu khóa cửa</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <span>Lịch sử thay pin</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <span>Ngày hết hạn mật khẩu</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <span>Tất cả cài đặt liên quan</span>
                </li>
              </ul>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-3 pt-4"
            >
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  <CloseIcon size={20} />
                  Hủy
                </span>
              </button>
              <button
                onClick={handleConfirm}
                disabled={isDeleting || hasActiveGuests}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Trash2 size={20} />
                    </motion.div>
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={20} />
                    Xóa khóa cửa
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
