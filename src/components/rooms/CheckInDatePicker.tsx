interface CheckInDatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function CheckInDatePicker({ value, onChange }: CheckInDatePickerProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-slate-800 text-sm">Ngày bắt đầu ở</h3>

      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={() => onChange(new Date().toISOString().split('T')[0])} className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-semibold">
          Hôm nay
        </button>
        <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - 1); onChange(d.toISOString().split('T')[0]); }} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
          Hôm qua
        </button>
        <button onClick={() => { const d = new Date(); d.setDate(1); onChange(d.toISOString().split('T')[0]); }} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
          Đầu tháng
        </button>
      </div>
    </div>
  );
}
