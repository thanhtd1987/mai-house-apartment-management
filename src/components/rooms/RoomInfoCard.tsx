import { X } from 'lucide-react';
import { Room } from '../../types';

interface RoomInfoCardProps {
  room: Room | undefined;
}

export function RoomInfoCard({ room }: RoomInfoCardProps) {
  if (!room) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
          {room.number}
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Phòng {room.number}</h3>
          <p className="text-xs text-slate-600">{room.type === 'single' ? 'Phòng đơn' : 'Phòng đôi'} • {room.price.toLocaleString()} VNĐ</p>
        </div>
      </div>
    </div>
  );
}
