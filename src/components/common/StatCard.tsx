import { ReactNode } from 'react';
import { cn } from '../../utils';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: string;
}

export function StatCard({ icon, label, value, subValue, trend }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-50 rounded-2xl">
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
          {subValue && <span className="text-sm text-gray-400 font-medium">{subValue}</span>}
        </div>
      </div>
    </div>
  );
}
