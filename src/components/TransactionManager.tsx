import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  XCircle,
  ChevronRight,
  RotateCcw,
  Save,
  Trash2
} from 'lucide-react';
import { storage } from '../services/storage';
import { Order, OrderItem, TransactionCorrection, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function TransactionManager({ branchId, user }: { branchId: string; user: User }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    const loadOrders = () => {
      const allOrders = storage.getAll<Order>('orders');
      setOrders(allOrders.filter(o => o.branchId === branchId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    loadOrders();
    return storage.subscribe(loadOrders);
  }, [branchId]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleStartCorrection = (order: Order) => {
    setSelectedOrder(order);
    setEditedItems([...order.items]);
    setIsCorrecting(true);
    setCorrectionReason('');
  };

  const handleSaveCorrection = () => {
    if (!selectedOrder || !correctionReason) return;

    const newTotal = editedItems.reduce((sum, item) => sum + (item.quantity * 10000), 0); // Simplified price calc for demo
    // In a real app, you'd fetch actual product prices

    const correction: TransactionCorrection = {
      id: Math.random().toString(36).substr(2, 9),
      orderId: selectedOrder.id,
      userId: user.id,
      reason: correctionReason,
      timestamp: new Date().toISOString(),
      previousAmount: selectedOrder.totalAmount,
      newAmount: newTotal,
      previousItems: selectedOrder.items,
      newItems: editedItems
    };

    storage.add('transactionCorrections', correction);
    storage.update('orders', selectedOrder.id, {
      items: editedItems,
      totalAmount: newTotal
    });

    setIsCorrecting(false);
    setSelectedOrder(null);
    alert('Transaksi berhasil dikoreksi!');
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...editedItems];
    if (quantity <= 0) {
      newItems.splice(index, 1);
    } else {
      newItems[index] = { ...newItems[index], quantity };
    }
    setEditedItems(newItems);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-500 bg-green-50';
      case 'preparing': return 'text-orange-500 bg-orange-50';
      case 'pending': return 'text-blue-500 bg-blue-50';
      case 'cancelled': return 'text-red-500 bg-red-50';
      default: return 'text-neutral-500 bg-neutral-50';
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-800">Kelola Transaksi</h1>
          <p className="text-neutral-500 font-medium mt-1">Pantau status pesanan dan koreksi transaksi jika diperlukan</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari ID atau Pelanggan..." 
              className="pl-12 pr-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold text-neutral-600"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="preparing">Dapur</option>
            <option value="paid">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </header>

      <div className="bg-white rounded-[32px] border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-100">
                <th className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">ID Transaksi</th>
                <th className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Waktu</th>
                <th className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Pelanggan</th>
                <th className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Total</th>
                <th className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Status</th>
                <th className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-neutral-50/50 transition-all group">
                  <td className="p-6">
                    <span className="font-mono text-xs font-bold text-neutral-400">#{order.id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-neutral-800">{new Date(order.createdAt).toLocaleTimeString()}</span>
                      <span className="text-[10px] text-neutral-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-xs">
                        {order.customerName?.[0] || 'G'}
                      </div>
                      <span className="font-bold text-neutral-700">{order.customerName || 'Guest'}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="font-black text-neutral-800">Rp {order.totalAmount.toLocaleString()}</span>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                      {order.status === 'preparing' ? 'Dapur' : order.status}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => handleStartCorrection(order)}
                      className="p-2 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correction Modal */}
      <AnimatePresence>
        {isCorrecting && selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">Koreksi Transaksi</h2>
                  <p className="text-neutral-500 text-sm">ID: #{selectedOrder.id.toUpperCase()}</p>
                </div>
                <button onClick={() => setIsCorrecting(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-all">
                  <XCircle size={24} className="text-neutral-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Item Pesanan</h3>
                  <div className="space-y-3">
                    {editedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                        <div className="flex-1">
                          <p className="font-bold text-neutral-800">{item.productName}</p>
                          <p className="text-xs text-neutral-400 capitalize">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-neutral-200">
                            <button 
                              onClick={() => updateItemQuantity(idx, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-orange-500 transition-all"
                            >
                              -
                            </button>
                            <span className="font-black w-8 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateItemQuantity(idx, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-orange-500 transition-all"
                            >
                              +
                            </button>
                          </div>
                          <button 
                            onClick={() => updateItemQuantity(idx, 0)}
                            className="text-red-300 hover:text-red-500 p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Alasan Koreksi</label>
                  <textarea 
                    placeholder="Contoh: Kesalahan input jumlah, Pelanggan membatalkan item..." 
                    className="w-full p-6 bg-neutral-50 border border-neutral-200 rounded-[24px] outline-none focus:ring-2 focus:ring-orange-500 transition-all h-32 resize-none"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-8 bg-neutral-50 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total Baru</p>
                  <p className="text-2xl font-black text-orange-500">
                    Rp {editedItems.reduce((sum, item) => sum + (item.quantity * 10000), 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsCorrecting(false)}
                    className="px-8 py-4 font-bold text-neutral-500 hover:text-neutral-700"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveCorrection}
                    disabled={!correctionReason || editedItems.length === 0}
                    className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save size={20} />
                    Simpan Koreksi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
