import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Clock, 
  LogOut, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  History,
  TrendingUp,
  TrendingDown,
  Save,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { storage } from '../services/storage';
import { Shift, User, Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function ShiftManager({ branchId, user }: { branchId: string; user: User }) {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [closingCash, setClosingCash] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadData = () => {
      const allShifts = storage.getAll<Shift>('shifts');
      const currentShift = storage.getActiveShift(user.id, branchId);
      setActiveShift(currentShift || null);
      setShifts(allShifts.filter(s => s.branchId === branchId).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
      setOrders(storage.getAll<Order>('orders').filter(o => o.branchId === branchId));
    };

    loadData();
    return storage.subscribe(loadData);
  }, [branchId, user.id]);

  const handleStartShift = () => {
    if (openingCash < 0) return;

    const newShift: Shift = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      branchId,
      startTime: new Date().toISOString(),
      openingCash,
      status: 'open',
      notes
    };

    storage.add('shifts', newShift);
    setIsStarting(false);
    setOpeningCash(0);
    setNotes('');
    alert('Shift dimulai! Selamat bekerja.');
  };

  const handleCloseShift = () => {
    if (!activeShift || closingCash < 0) return;

    storage.update('shifts', activeShift.id, {
      endTime: new Date().toISOString(),
      closingCash,
      status: 'closed',
      notes: notes || activeShift.notes
    });

    setIsClosing(false);
    setClosingCash(0);
    setNotes('');
    alert('Shift ditutup! Terima kasih atas kerja kerasnya.');
  };

  const getShiftOrders = (shift: Shift) => {
    const start = new Date(shift.startTime).getTime();
    const end = shift.endTime ? new Date(shift.endTime).getTime() : Date.now();
    return orders.filter(o => {
      const time = new Date(o.createdAt).getTime();
      return time >= start && time <= end && o.status === 'paid';
    });
  };

  const calculateTotalSales = (shift: Shift) => {
    return getShiftOrders(shift).reduce((sum, o) => sum + o.totalAmount, 0);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-800">Kelola Shift</h1>
          <p className="text-neutral-500 font-medium mt-1">Atur jam kerja dan rekonsiliasi kas harian</p>
        </div>
        {!activeShift ? (
          <button 
            onClick={() => setIsStarting(true)}
            className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center gap-2"
          >
            <LogIn size={20} />
            <span>Mulai Shift Baru</span>
          </button>
        ) : (
          <button 
            onClick={() => setIsClosing(true)}
            className="bg-red-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-600 transition-all flex items-center gap-2"
          >
            <LogOut size={20} />
            <span>Tutup Shift Sekarang</span>
          </button>
        )}
      </header>

      {activeShift && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm flex items-center gap-6">
            <div className="bg-orange-50 text-orange-500 p-4 rounded-2xl">
              <Wallet size={32} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Kas Awal</p>
              <h3 className="text-2xl font-black text-neutral-800">Rp {activeShift.openingCash.toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm flex items-center gap-6">
            <div className="bg-green-50 text-green-500 p-4 rounded-2xl">
              <TrendingUp size={32} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Penjualan Saat Ini</p>
              <h3 className="text-2xl font-black text-neutral-800">Rp {calculateTotalSales(activeShift).toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm flex items-center gap-6">
            <div className="bg-blue-50 text-blue-500 p-4 rounded-2xl">
              <Clock size={32} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Waktu Mulai</p>
              <h3 className="text-2xl font-black text-neutral-800">{new Date(activeShift.startTime).toLocaleTimeString()}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-black text-neutral-800 flex items-center gap-2">
          <History className="text-orange-500" size={24} />
          Riwayat Shift
        </h2>
        <div className="bg-white rounded-[32px] border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-100">
                  <th className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Waktu</th>
                  <th className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Karyawan</th>
                  <th className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Kas Awal</th>
                  <th className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Kas Akhir</th>
                  <th className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Total Penjualan</th>
                  <th className="p-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {shifts.map(shift => (
                  <tr key={shift.id} className="hover:bg-neutral-50/50 transition-all">
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-neutral-800">
                          {new Date(shift.startTime).toLocaleTimeString()} - {shift.endTime ? new Date(shift.endTime).toLocaleTimeString() : 'Sekarang'}
                        </span>
                        <span className="text-[10px] text-neutral-400">{new Date(shift.startTime).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-bold text-neutral-700">User ID: {shift.userId}</span>
                    </td>
                    <td className="p-6 font-bold text-neutral-800">Rp {shift.openingCash.toLocaleString()}</td>
                    <td className="p-6 font-bold text-neutral-800">
                      {shift.closingCash ? `Rp ${shift.closingCash.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-6 font-black text-orange-500">Rp {calculateTotalSales(shift).toLocaleString()}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        shift.status === 'open' ? 'text-green-500 bg-green-50' : 'text-neutral-400 bg-neutral-100'
                      }`}>
                        {shift.status === 'open' ? 'Aktif' : 'Selesai'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Start Shift Modal */}
      <AnimatePresence>
        {isStarting && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center border-b border-neutral-100">
                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LogIn size={32} />
                </div>
                <h2 className="text-2xl font-black">Mulai Shift</h2>
                <p className="text-neutral-500">Masukkan jumlah kas awal yang dipegang</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Kas Awal (Modal)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-neutral-400">Rp</span>
                    <input 
                      type="number" 
                      placeholder="0" 
                      className="w-full pl-12 pr-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-black text-xl"
                      value={openingCash}
                      onChange={(e) => setOpeningCash(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Catatan (Opsional)</label>
                  <textarea 
                    placeholder="Contoh: Modal dari bos, sisa shift sebelumnya..." 
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all h-24 resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-8 bg-neutral-50 flex gap-4">
                <button 
                  onClick={() => setIsStarting(false)}
                  className="flex-1 py-4 font-bold text-neutral-500 hover:text-neutral-700"
                >
                  Batal
                </button>
                <button 
                  onClick={handleStartShift}
                  className="flex-[2] bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
                >
                  Mulai Shift
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Close Shift Modal */}
      <AnimatePresence>
        {isClosing && activeShift && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center border-b border-neutral-100">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LogOut size={32} />
                </div>
                <h2 className="text-2xl font-black">Tutup Shift</h2>
                <p className="text-neutral-500">Rekonsiliasi kas akhir sebelum pulang</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-orange-400 uppercase tracking-widest">
                    <span>Estimasi Kas Akhir</span>
                    <span>(Awal + Jual)</span>
                  </div>
                  <p className="text-xl font-black text-orange-600">
                    Rp {(activeShift.openingCash + calculateTotalSales(activeShift)).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Kas Akhir Aktual</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-neutral-400">Rp</span>
                    <input 
                      type="number" 
                      placeholder="0" 
                      className="w-full pl-12 pr-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-black text-xl"
                      value={closingCash}
                      onChange={(e) => setClosingCash(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Catatan Penutupan</label>
                  <textarea 
                    placeholder="Contoh: Ada selisih Rp 500 karena pembulatan..." 
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all h-24 resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-8 bg-neutral-50 flex gap-4">
                <button 
                  onClick={() => setIsClosing(false)}
                  className="flex-1 py-4 font-bold text-neutral-500 hover:text-neutral-700"
                >
                  Batal
                </button>
                <button 
                  onClick={handleCloseShift}
                  className="flex-[2] bg-red-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-600 transition-all"
                >
                  Tutup Shift
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
