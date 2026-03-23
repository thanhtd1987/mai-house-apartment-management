import { Crown, Users } from 'lucide-react';
import { cn } from '../../utils';
import { RoomGuest } from '../../types';

interface ExistingGuestsListProps {
  existingGuests: RoomGuest[];
}

export function ExistingGuestsList({ existingGuests }: ExistingGuestsListProps) {
  if (existingGuests.length === 0) return null;

  return (
    <div>
      <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
        <Users size={16} className="text-blue-600" />
        Khách đang ở ({existingGuests.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {existingGuests.map(eg => {
          const guestName = (eg as any).guest?.name || (eg as any).name || 'Unknown';
          return (
            <div key={eg.guestId} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-blue-200">
              {eg.isRepresentative && <Crown size={14} className="text-purple-600 shrink-0" />}
              <span className="font-semibold text-slate-800 text-sm">{guestName}</span>
              {eg.isRepresentative && (
                <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Đại diện</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
