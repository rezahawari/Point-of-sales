import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Users, 
  Building2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { storage } from '../services/storage';
import { Branch, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function BranchManager() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', address: '' });

  useEffect(() => {
    const loadData = () => {
      setBranches(storage.getAll<Branch>('branches'));
      setUsers(storage.getAll<User>('users'));
    };

    loadData();
    return storage.subscribe(loadData);
  }, []);

  const handleAddBranch = () => {
    if (!newBranch.name || !newBranch.address) return;
    storage.add('branches', { ...newBranch, createdAt: new Date().toISOString() });
    setNewBranch({ name: '', address: '' });
    setIsAdding(false);
  };

  const handleAssignUser = (userId: string, branchId: string) => {
    storage.update('users', userId, { branchId });
    alert('Karyawan berhasil ditugaskan!');
  };

  const handleDeleteBranch = (id: string) => {
    if (confirm('Hapus cabang ini?')) {
      storage.remove('branches', id);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-neutral-800">Manajemen Cabang</h1>
          <p className="text-neutral-500 font-medium mt-1">Kelola lokasi outlet dan penempatan karyawan</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Tambah Cabang</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Branch List */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-neutral-800 flex items-center gap-2">
            <Building2 className="text-orange-500" size={24} />
            Daftar Outlet
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {branches.map(branch => (
              <div key={branch.id} className="bg-white p-6 rounded-[32px] border border-neutral-200 shadow-sm hover:border-orange-200 transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-orange-50 text-orange-500 p-4 rounded-2xl">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-neutral-800">{branch.name}</h3>
                      <p className="text-sm text-neutral-500">{branch.address}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteBranch(branch.id)} className="text-red-300 hover:text-red-500 transition-all">
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <div className="mt-6 pt-6 border-t border-neutral-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-neutral-400" />
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                      {users.filter(u => u.branchId === branch.id).length} Karyawan
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {users.filter(u => u.branchId === branch.id).slice(0, 3).map(u => (
                      <div key={u.id} className="w-8 h-8 rounded-full bg-neutral-200 border-2 border-white overflow-hidden">
                        {u.photoUrl ? <img src={u.photoUrl} alt={u.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">{u.name[0]}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Employee Assignment */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-neutral-800 flex items-center gap-2">
            <Users className="text-orange-500" size={24} />
            Penugasan Karyawan
          </h2>
          <div className="bg-white rounded-[32px] border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-50 bg-neutral-50/50">
              <div className="flex justify-between text-xs font-bold text-neutral-400 uppercase tracking-widest">
                <span>Nama Karyawan</span>
                <span>Penempatan</span>
              </div>
            </div>
            <div className="divide-y divide-neutral-50">
              {users.map(user => (
                <div key={user.id} className="p-6 flex items-center justify-between hover:bg-neutral-50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 overflow-hidden">
                      {user.photoUrl ? <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-neutral-400">{user.name[0]}</div>}
                    </div>
                    <div>
                      <p className="font-bold text-neutral-800">{user.name}</p>
                      <p className="text-xs text-neutral-400 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <select 
                    className="bg-neutral-100 border-none px-4 py-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    value={user.branchId || ''}
                    onChange={(e) => handleAssignUser(user.id, e.target.value)}
                  >
                    <option value="">Belum Ditugaskan</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Branch Modal */}
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
                <h2 className="text-2xl font-black mb-2">Tambah Cabang Baru</h2>
                <p className="text-neutral-500">Masukkan detail lokasi outlet Anda</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Nama Cabang</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: CafeFlow Sudirman" 
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Alamat Lengkap</label>
                  <textarea 
                    placeholder="Jl. Sudirman No. 123..." 
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all h-24 resize-none"
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
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
                  onClick={handleAddBranch}
                  className="flex-[2] bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
                >
                  Simpan Cabang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
