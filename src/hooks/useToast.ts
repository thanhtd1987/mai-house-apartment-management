import { useToastStore } from '../stores/toastStore';

export function useToast() {
  const { addToast, removeToast } = useToastStore();

  return {
    success: (message: string, duration?: number) =>
      addToast(message, 'success', duration),
    error: (message: string, duration?: number) =>
      addToast(message, 'error', duration),
    info: (message: string, duration?: number) =>
      addToast(message, 'info', duration),
    warning: (message: string, duration?: number) =>
      addToast(message, 'warning', duration),
    withAction: (
      message: string,
      actionLabel: string,
      actionCallback: () => void,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
      duration?: number
    ) => addToast(message, type, duration, { label: actionLabel, onClick: actionCallback }),
    remove: (id: string) => removeToast(id),
  };
}
