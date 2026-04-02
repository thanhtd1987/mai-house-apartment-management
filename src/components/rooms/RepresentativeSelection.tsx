import { Crown } from 'lucide-react';
import { RoomGuest } from '../../types';
import { RepresentativeCard } from './RepresentativeCard';
import { Guest } from '../../types';

interface RepresentativeSelectionProps {
  existingRepresentative: RoomGuest | undefined;
  selectedGuests: string[];
  representativeId: string;
  guests: Guest[];
  onSetRepresentativeId: (id: string) => void;
}

export function RepresentativeSelection({
  existingRepresentative,
  selectedGuests,
  representativeId,
  guests,
  onSetRepresentativeId
}: RepresentativeSelectionProps) {
  if (selectedGuests.length === 0 && !existingRepresentative) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
      <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
        <Crown size={16} className="text-amber-600" />
        Chọn người đại diện
      </h3>
      <p className="text-xs text-slate-600 mb-3">
        Chọn 1 người làm người đại diện (chịu trách nhiệm thanh toán)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {existingRepresentative && (() => {
          // Find the full guest object for existing representative
          const existingGuest = guests.find(g => g.id === existingRepresentative.guestId);
          if (!existingGuest) return null;

          return (
            <RepresentativeCard
              guest={existingGuest}
              isExisting={true}
              isSelected={representativeId === existingRepresentative.guestId}
              onSelect={() => onSetRepresentativeId(existingRepresentative.guestId)}
            />
          );
        })()}

        {selectedGuests.map(guestId => {
          const guest = guests.find(g => g.id === guestId)!;
          const isRep = representativeId === guestId;

          return (
            <RepresentativeCard
              guest={guest}
              isExisting={false}
              isSelected={isRep}
              onSelect={() => onSetRepresentativeId(guestId)}
            />
          );
        })}
      </div>
    </div>
  );
}
