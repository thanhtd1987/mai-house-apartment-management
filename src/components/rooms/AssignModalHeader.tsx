import { X, Users } from 'lucide-react';

interface AssignModalHeaderProps {
  existingGuestsCount: number;
  roomNumber: string | undefined;
  mode: 'assign' | 'transfer';
  onClose: () => void;
}

export function AssignModalHeader({ existingGuestsCount, roomNumber, mode, onClose }: AssignModalHeaderProps) {
  const getDescription = () => {
    if (existingGuestsCount > 0) {
      return `Phòng ${roomNumber} • ${existingGuestsCount} khách`;
    }
    return 'Kết nối khách với phòng';
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            {existingGuestsCount > 0 ? 'Thêm khách vào phòng' : 'Gán phòng cho khách'}
          </h2>
          <p className="text-purple-100 text-sm mt-0.5">
            {getDescription()}
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
          <X size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
}
