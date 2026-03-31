import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Search, 
  Package, 
  History,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { storage } from '../services/storage';
import { Ingredient, StockLog } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function Inventory({ branchId }: { branchId: string }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingStock, setIsAddingStock] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (!branchId) return;

    const loadData = () => {
      const allIngredients = storage.getAll<Ingredient>('ingredients');
      setIngredients(allIngredients.filter(i => i.branchId === branchId));

      const allLogs = storage.getAll<StockLog>('stockLogs');
      setLogs(allLogs.filter(l => l.branchId === branchId).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    };

    loadData();
    return storage.subscribe(loadData);
  }, [branchId]);

  const handleAdjustStock = (ingredientId: string, type: 'in' | 'out') => {
    if (adjustAmount <= 0) return;

    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;

    const amount = type === 'in' ? adjustAmount : -adjustAmount;
    const newStock = (ingredient.stock || 0) + amount;

    storage.update('ingredients', ingredientId, {
      stock: newStock
    });

    storage.add('stockLogs', {
      ingredientId,
      branchId,
      type,
      quantity: adjustAmount,
      reason: adjustReason || (type === 'in' ? 'Stock In' : 'Stock Out'),
      timestamp: new Date().toISOString()
    });

    setIsAddingStock(null);
    setAdjustAmount(0);
    setAdjustReason('');
    alert('Stok berhasil diperbarui!');
  };

  const filteredIngredients = ingredients.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-neutral-800">Manajemen Stok</h1>
          <p className="text-neutral-500 font-medium mt-1">Pantau dan kelola ketersediaan bahan baku</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              showLogs ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <History size={20} />
            <span>Riwayat Stok</span>
          </button>
          <button className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center gap-2">
            <Plus size={20} />
            <span>Tambah Bahan</span>
          </button>
        </div>
      </header>

      <div className="flex gap-8">
        <div className="flex-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari bahan baku..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIngredients.map(ing => (
              <div key={ing.id} className="bg-white p-6 rounded-[32px] border border-neutral-200 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${ing.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-800">{ing.name}</h3>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">{ing.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Stok Saat Ini</p>
                    <p className={`text-2xl font-black ${ing.stock < 10 ? 'text-red-500' : 'text-neutral-800'}`}>
                      {ing.stock}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => setIsAddingStock(ing.id)}
                      className="p-3 bg-neutral-100 text-neutral-600 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showLogs && (
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-96 bg-white border border-neutral-200 rounded-[40px] shadow-xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-neutral-100">
              <h2 className="text-xl font-black text-neutral-800">Riwayat Pergerakan</h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Log Stok Terakhir</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {logs.map(log => {
                const ing = ingredients.find(i => i.id === log.ingredientId);
                return (
                  <div key={log.id} className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl mt-1 ${log.type === 'in' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {log.type === 'in' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-neutral-800">{ing?.name || 'Unknown'}</h4>
                        <span className={`text-sm font-black ${log.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                          {log.type === 'in' ? '+' : '-'}{log.quantity}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">{log.reason}</p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-2">
                        {format(new Date(log.timestamp), 'dd MMM, HH:mm', { locale: id })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      <AnimatePresence>
        {isAddingStock && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center border-b border-neutral-100">
                <h2 className="text-2xl font-black mb-2">Update Stok</h2>
                <p className="text-neutral-500">
                  Bahan: <span className="text-orange-600 font-bold">
                    {ingredients.find(i => i.id === isAddingStock)?.name}
                  </span>
                </p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Jumlah Perubahan</label>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setAdjustAmount(Math.max(0, adjustAmount - 1))}
                      className="p-4 bg-neutral-100 rounded-2xl hover:bg-neutral-200 transition-all"
                    >
                      <Minus size={20} />
                    </button>
                    <input 
                      type="number" 
                      className="flex-1 text-center text-3xl font-black text-neutral-800 outline-none"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    />
                    <button 
                      onClick={() => setAdjustAmount(adjustAmount + 1)}
                      className="p-4 bg-neutral-100 rounded-2xl hover:bg-neutral-200 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Alasan / Keterangan</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Belanja Mingguan" 
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-8 bg-neutral-50 flex gap-4">
                <button 
                  onClick={() => handleAdjustStock(isAddingStock, 'out')}
                  className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownRight size={20} />
                  Kurangi
                </button>
                <button 
                  onClick={() => handleAdjustStock(isAddingStock, 'in')}
                  className="flex-1 bg-green-50 text-green-600 py-4 rounded-2xl font-bold hover:bg-green-100 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowUpRight size={20} />
                  Tambah
                </button>
              </div>
              <button 
                onClick={() => setIsAddingStock(null)}
                className="w-full py-4 text-neutral-400 font-bold hover:text-neutral-600 transition-all text-sm"
              >
                Batal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
