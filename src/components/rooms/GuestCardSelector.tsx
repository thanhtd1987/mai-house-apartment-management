import { motion } from 'motion/react';
import { cn } from '../../utils';
import { Guest } from '../../types';

interface GuestCardProps {
  guest: Guest;
  isSelected: boolean;
  onClick: () => void;
  key?: string;
}

export function GuestCard({ guest, isSelected, onClick }: GuestCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border-2 text-left transition-all relative",
        isSelected
          ? "border-purple-500 bg-purple-50 shadow-md"
          : "border-slate-200 hover:border-purple-300 bg-white hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
          {guest.name.charAt(0)}
        </div>

        <div className="flex-1">
          <p className="font-semibold text-slate-800 text-sm">{guest.name}</p>
          <p className="text-xs text-slate-500">{guest.idNumber}</p>
          <p className="text-xs text-slate-400">{guest.phone}</p>
        </div>
      </div>
    </motion.button>
  );
}
