import React from 'react';
import { motion } from 'motion/react';
import { Room, Guest } from '../../types';
import { cn, getRoomGuestsWithDetails } from '../../utils';
import { Users, User, Key } from 'lucide-react';

interface RoomSelectionCardProps {
  room: Room;
  guests: Guest[];
  isSelected: boolean;
  onClick: () => void;
  key?: string;
}

export function RoomSelectionCard({ room, guests, isSelected, onClick }: RoomSelectionCardProps) {
  const guestsInRoom = getRoomGuestsWithDetails(room, guests);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200",
        isSelected
          ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg shadow-purple-200"
          : "border-slate-200 bg-white hover:border-purple-300 hover:shadow-md"
      )}
    >
      {/* Selection Checkbox */}
      <div className={cn(
        "absolute right-4 top-4 h-6 w-6 rounded-full border-2 transition-all duration-200",
        isSelected
          ? "border-purple-500 bg-purple-500"
          : "border-slate-300 bg-white"
      )}>
        {isSelected && (
          <svg className="h-full w-full p-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Room Number & Type */}
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <Key className={cn(
            "h-5 w-5",
            isSelected ? "text-purple-600" : "text-slate-400"
          )} />
          <h3 className={cn(
            "text-xl font-bold",
            isSelected ? "text-purple-900" : "text-slate-800"
          )}>
            {room.number}
          </h3>
        </div>
        <p className={cn(
          "text-sm font-medium",
          isSelected ? "text-purple-700" : "text-slate-600"
        )}>
          {room.type}
        </p>
      </div>

      {/* Capacity & Guests */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className={cn(
            "font-medium",
            isSelected ? "text-purple-700" : "text-slate-600"
          )}>
            Sức chứa:
          </span>
          <div className="flex items-center gap-2">
            <Users className={cn(
              "h-4 w-4",
              isSelected ? "text-purple-600" : "text-slate-400"
            )} />
            <span className={cn(
              "font-bold",
              isSelected ? "text-purple-900" : "text-slate-700"
            )}>
              {guestsInRoom.length} / {room.capacity}
            </span>
          </div>
        </div>

        {/* Existing Guests */}
        {guestsInRoom.length > 0 && (
          <div className="mt-3 space-y-2 rounded-lg bg-slate-50/80 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <User className="h-3.5 w-3.5" />
              <span>Khách đang ở:</span>
            </div>
            {guestsInRoom.map((guestDetail, index) => (
              <div key={guestDetail.guestId} className="flex items-center gap-2 text-xs">
                {guestDetail.isRepresentative && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                    Đại diện
                  </span>
                )}
                <span className={cn(
                  "font-medium",
                  isSelected ? "text-purple-800" : "text-slate-700"
                )}>
                  {guestDetail.guest.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {guestsInRoom.length === 0 && (
          <div className="mt-3 rounded-lg bg-slate-50/80 p-3 text-center">
            <p className={cn(
              "text-xs italic",
              isSelected ? "text-purple-600" : "text-slate-500"
            )}>
              Phòng trống • Ghép phòng được
            </p>
          </div>
        )}
      </div>

      {/* Full Capacity Warning */}
      {guestsInRoom.length >= room.capacity && (
        <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
          ⚠️ Phòng đã đầy
        </div>
      )}
    </motion.div>
  );
}
