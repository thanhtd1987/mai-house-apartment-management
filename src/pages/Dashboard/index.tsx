import { Invoice, Room } from '../../types';
import { StatCard } from '../../components';
import { formatCurrency } from '../../utils';
import { DollarSign, Bed, CheckCircle2, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  rooms: Room[];
  invoices: Invoice[];
}

export function Dashboard({ rooms, invoices }: DashboardProps) {
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.totalPrice, 0);
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const availableCount = rooms.filter(r => r.status === 'available').length;
  const unpaidCount = rooms.filter(r => r.paymentStatus !== 'paid').length;

  const chartData = [
    { name: 'Tháng 1', revenue: 45000000 },
    { name: 'Tháng 2', revenue: 52000000 },
    { name: 'Tháng 3', revenue: 48000000 },
    { name: 'Tháng 4', revenue: 61000000 },
    { name: 'Tháng 5', revenue: 55000000 },
    { name: 'Tháng 6', revenue: totalRevenue || 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<DollarSign className="text-emerald-600" />} label="Tổng doanh thu" value={formatCurrency(totalRevenue)} trend="+12.5%" />
        <StatCard icon={<Bed className="text-blue-600" />} label="Phòng đang ở" value={occupiedCount} subValue={`/${rooms.length} phòng`} />
        <StatCard icon={<CheckCircle2 className="text-amber-600" />} label="Phòng trống" value={availableCount} />
        <StatCard icon={<AlertCircle className="text-rose-600" />} label="Chưa thanh toán" value={unpaidCount} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Biểu đồ doanh thu</h3>
            <select className="bg-gray-50 border-none rounded-lg text-xs p-2">
              <option>6 tháng qua</option>
              <option>Năm nay</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999'}} tickFormatter={(v) => `${v/1000000}M`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(v: number) => [formatCurrency(v), 'Doanh thu']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#000" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Trạng thái phòng</h3>
          <div className="space-y-4">
            {rooms.slice(0, 5).map(room => (
              <div key={room.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    room.status === 'available' ? "bg-emerald-500" :
                    room.status === 'occupied' ? "bg-blue-500" : "bg-gray-400"
                  }`} />
                  <span className="font-medium">Phòng {room.number}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  room.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700" :
                  room.paymentStatus === 'unpaid' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {room.paymentStatus === 'paid' ? 'Đã thanh toán' : room.paymentStatus === 'unpaid' ? 'Chưa thanh toán' : 'Nợ cũ'}
                </span>
              </div>
            ))}
            <button className="w-full text-center text-sm text-gray-500 font-medium mt-4 hover:text-black">
              Xem tất cả phòng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
