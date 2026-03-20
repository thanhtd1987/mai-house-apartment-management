import React from 'react';
import { cn } from '../../utils';
import { RouteKey } from '../../constants';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
  id: RouteKey;
}

export function NavItem({ icon, label, active, onClick, collapsed, id }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
        active ? "bg-black text-white shadow-lg shadow-black/10" : "text-gray-500 hover:bg-gray-100"
      )}
    >
      <div className={cn("shrink-0", active ? "text-white" : "text-gray-400 group-hover:text-black")}>
        {icon}
      </div>
      {!collapsed && (
        <span className="font-medium text-sm whitespace-nowrap overflow-hidden">
          {label}
        </span>
      )}
    </button>
  );
}
