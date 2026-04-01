import { create } from 'zustand';
import { Toast, ToastType } from '../components/common/Toast';

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number, action?: Toast['action']) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 4000, action) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: `toast-${++toastId}`,
          message,
          type,
          duration,
          action,
        },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
