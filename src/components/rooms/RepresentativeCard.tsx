import { Crown } from 'lucide-react';
import { cn } from '../../utils';
import { Guest } from '../../types';

interface RepresentativeCardProps {
  guest: Guest;
  isExisting: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

export function RepresentativeCard({ guest, isExisting, isSelected, onSelect }: RepresentativeCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
        isSelected
          ? "border-amber-500 bg-amber-100"
          : "border-slate-200 hover:border-amber-300 bg-white"
      )}
    >
      <input
        type="radio"
        name="representative"
        checked={isSelected}
        onChange={onSelect}
        className="w-5 h-5 text-amber-600 shrink-0 cursor-pointer"
      />
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0",
        isExisting ? "bg-purple-100 text-purple-600" : "bg-gradient-to-br from-purple-500 to-pink-500"
      )}>
        {guest.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm truncate">{guest.name}</p>
        <p className={cn(
          "text-xs",
          isExisting ? "text-amber-700" : "text-slate-500"
        )}>
          {isExisting ? 'Đại diện hiện tại' : 'Khách mới'}
        </p>
      </div>
      {isSelected && <Crown size={16} className="text-amber-600 shrink-0" />}
    </button>
  );
}
