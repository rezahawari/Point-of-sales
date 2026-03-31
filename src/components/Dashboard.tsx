import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Coffee,
  MapPin,
  Calendar
} from 'lucide-react';
import { storage } from '../services/storage';
import { Order, Branch, Product } from '../types';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

export default function Dashboard({ user }: { user: any }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'today'>('7d');

  useEffect(() => {
    const loadData = () => {
      const allBranches = storage.getAll<Branch>('branches');
      setBranches(allBranches);

      const allOrders = storage.getAll<Order>('orders');
      setOrders(allOrders);
    };

    loadData();
    return storage.subscribe(loadData);
  }, []);

  const filteredOrders = orders.filter(order => 
    (selectedBranch === 'all' || order.branchId === selectedBranch) &&
    (timeRange === 'today' ? new Date(order.createdAt) >= startOfDay(new Date()) : true)
  );

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const salesByDay = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayOrders = filteredOrders.filter(o => 
      format(new Date(o.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return {
      name: format(date, 'EEE', { locale: id }),
      revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      orders: dayOrders.length
    };
  });

  const salesByCategory = filteredOrders.reduce((acc: any, order) => {
    order.items.forEach(item => {
      const cat = item.category || 'other';
      acc[cat] = (acc[cat] || 0) + item.quantity;
    });
    return acc;
  }, {});

  const pieData = Object.entries(salesByCategory).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-neutral-800">Dashboard Analisa</h1>
          <p className="text-neutral-500 font-medium mt-1">Pantau performa bisnis Anda secara menyeluruh</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200">
            <button 
              onClick={() => setTimeRange('today')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${timeRange === 'today' ? 'bg-white text-orange-600 shadow-sm' : 'text-neutral-500'}`}
            >
              Hari Ini
            </button>
            <button 
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${timeRange === '7d' ? 'bg-white text-orange-600 shadow-sm' : 'text-neutral-500'}`}
            >
              7 Hari
            </button>
            <button 
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${timeRange === '30d' ? 'bg-white text-orange-600 shadow-sm' : 'text-neutral-500'}`}
            >
              30 Hari
            </button>
          </div>
          <select 
            className="bg-white border border-neutral-200 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="all">Semua Cabang</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Pendapatan', value: `Rp ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50', trend: '+12.5%', isUp: true },
          { label: 'Total Pesanan', value: totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+8.2%', isUp: true },
          { label: 'Rata-rata Pesanan', value: `Rp ${avgOrderValue.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', trend: '-2.4%', isUp: false },
          { label: 'Pelanggan Baru', value: '124', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+15.0%', isUp: true },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
                  <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full ${stat.isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.trend}
                </div>
              </div>
              <div>
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black text-neutral-800 mt-1">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-neutral-800">Tren Penjualan</h3>
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold">
              <Calendar size={14} />
              <span>7 Hari Terakhir</span>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={4} dot={{ r: 6, fill: '#f97316', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-neutral-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-neutral-800 mb-8">Kategori Terlaris</h3>
          <div className="flex-1 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm font-bold text-neutral-600 capitalize">{entry.name}</span>
                </div>
                <span className="text-sm font-black text-neutral-800">{entry.value} item</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
