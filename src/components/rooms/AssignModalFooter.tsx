import { Button } from '../common/Button';

interface AssignModalFooterProps {
  onClose: () => void;
  onAssign: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  selectedGuestsCount: number;
}

export function AssignModalFooter({ onClose, onAssign, canSubmit, isSubmitting, selectedGuestsCount }: AssignModalFooterProps) {
  return (
    <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex gap-3 flex-shrink-0">
      <Button onClick={onClose} variant="secondary" className="flex-1">
        Hủy
      </Button>
      <Button
        onClick={onAssign}
        disabled={!canSubmit || isSubmitting}
        loading={isSubmitting}
        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isSubmitting ? 'Đang xử lý...' : `Xác nhận (${selectedGuestsCount} khách)`}
      </Button>
    </div>
  );
}
