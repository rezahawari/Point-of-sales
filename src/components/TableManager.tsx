import React, { useState, useEffect } from 'react';
import { 
  Table as TableIcon, 
  Plus, 
  Trash2, 
  QrCode, 
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { storage } from '../services/storage';
import { Table, Branch } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';

export default function TableManager({ branchId }: { branchId: string }) {
  const [tables, setTables] = useState<Table[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  useEffect(() => {
    if (!branchId) return;

    const loadTables = () => {
      const allTables = storage.getAll<Table>('tables');
      setTables(allTables.filter(t => t.branchId === branchId));
    };

    loadTables();
    return storage.subscribe(loadTables);
  }, [branchId]);

  const handleAddTable = () => {
    if (!newTableNumber) return;
    storage.add('tables', {
      number: newTableNumber,
      branchId,
      status: 'available'
    });
    setNewTableNumber('');
    setIsAdding(false);
  };

  const handleDeleteTable = (id: string) => {
    if (confirm('Hapus meja ini?')) {
      storage.remove('tables', id);
    }
  };

  const getOrderUrl = (table: Table) => {
    return `${window.location.origin}/order/${branchId}/${table.id}`;
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-neutral-800">Manajemen Meja</h1>
          <p className="text-neutral-500 font-medium mt-1">Atur tata letak meja dan generate QR Code pesanan mandiri</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Tambah Meja</span>
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {tables.map(table => (
          <motion.div
            layout
            key={table.id}
            onClick={() => setSelectedTable(table)}
            className={`bg-white p-6 rounded-[32px] border-2 transition-all cursor-pointer group relative ${
              selectedTable?.id === table.id ? 'border-orange-500 shadow-xl shadow-orange-50' : 'border-neutral-100 hover:border-orange-200'
            }`}
          >
            <div className={`p-4 rounded-2xl mb-4 flex items-center justify-center ${
              table.status === 'occupied' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'
            }`}>
              <TableIcon size={32} />
            </div>
            <div className="text-center">
              <h3 className="font-black text-xl text-neutral-800">Meja {table.number}</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                table.status === 'occupied' ? 'text-orange-500' : 'text-green-500'
              }`}>
                {table.status === 'occupied' ? 'Terisi' : 'Tersedia'}
              </p>
            </div>
            
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id); }}
                className="text-red-300 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* QR Code Detail */}
      <AnimatePresence>
        {selectedTable && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white p-12 rounded-[48px] border border-neutral-200 shadow-2xl flex flex-col md:flex-row items-center gap-12"
          >
            <div className="bg-neutral-50 p-8 rounded-[40px] border border-neutral-100 shadow-inner">
              <QRCodeSVG 
                value={getOrderUrl(selectedTable)} 
                size={200} 
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: "https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png",
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div>
                <h2 className="text-4xl font-black text-neutral-800">QR Code Meja {selectedTable.number}</h2>
                <p className="text-neutral-500 font-medium mt-2">Pelanggan dapat memindai kode ini untuk melakukan pemesanan mandiri dari meja mereka.</p>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <a 
                  href={getOrderUrl(selectedTable)} 
                  target="_blank" 
                  className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
                >
                  <ExternalLink size={20} />
                  Buka Link Order
                </a>
                <button className="bg-white border border-neutral-200 text-neutral-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-neutral-50 transition-all">
                  <Download size={20} />
                  Download QR
                </button>
              </div>
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs font-mono text-neutral-400 break-all">
                {getOrderUrl(selectedTable)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Table Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center border-b border-neutral-100">
                <h2 className="text-2xl font-black mb-2">Tambah Meja Baru</h2>
                <p className="text-neutral-500">Masukkan nomor atau identitas meja</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Nomor Meja</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 01, VIP-1, Outdoor-A" 
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-8 bg-neutral-50 flex gap-4">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 font-bold text-neutral-500 hover:text-neutral-700"
                >
                  Batal
                </button>
                <button 
                  onClick={handleAddTable}
                  className="flex-[2] bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
                >
                  Simpan Meja
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
