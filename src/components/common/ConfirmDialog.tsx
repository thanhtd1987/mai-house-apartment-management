import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  type = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="text-red-500" size={32} />,
          gradient: 'from-red-500 to-rose-500',
          bgGradient: 'from-red-500/10 to-rose-500/10',
          confirmBg: 'bg-red-500 hover:bg-red-600',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="text-orange-500" size={32} />,
          gradient: 'from-orange-500 to-amber-500',
          bgGradient: 'from-orange-500/10 to-amber-500/10',
          confirmBg: 'bg-orange-500 hover:bg-orange-600',
        };
      default:
        return {
          icon: <AlertTriangle className="text-blue-500" size={32} />,
          gradient: 'from-blue-500 to-cyan-500',
          bgGradient: 'from-blue-500/10 to-cyan-500/10',
          confirmBg: 'bg-blue-500 hover:bg-blue-600',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
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
              {/* Header with gradient */}
              <div className={`bg-gradient-to-r ${styles.gradient} p-6`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                      {styles.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>
                  </div>
                  <button
                    onClick={onCancel}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="text-white" size={20} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className={`bg-gradient-to-r ${styles.bgGradient} p-6`}>
                <p className="text-gray-700">{message}</p>
              </div>

              {/* Actions */}
              <div className="p-6 flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-3 ${styles.confirmBg} text-white rounded-xl font-semibold transition-colors shadow-lg`}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
