import { Search } from 'lucide-react';

interface GuestSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function GuestSearch({ value, onChange }: GuestSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        type="text"
        placeholder="Tìm khách..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
      />
    </div>
  );
}
