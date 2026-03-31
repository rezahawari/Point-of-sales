import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { storage } from './services/storage';
import { User, UserRole } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import KDS from './components/KDS';
import Inventory from './components/Inventory';
import Attendance from './components/Attendance';
import SelfOrder from './components/SelfOrder';
import BranchManager from './components/BranchManager';
import TableManager from './components/TableManager';
import MenuManager from './components/MenuManager';
import TransactionManager from './components/TransactionManager';
import ShiftManager from './components/ShiftManager';
import { Coffee, LogIn, Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in local storage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (role: UserRole) => {
    const dummyUsers = storage.getAll<User>('users');
    const selectedUser = dummyUsers.find(u => u.role === role) || dummyUsers[0];
    setUser(selectedUser);
    localStorage.setItem('currentUser', JSON.stringify(selectedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-neutral-50">
        <div className="bg-orange-500 p-4 rounded-2xl text-white animate-bounce shadow-xl shadow-orange-100">
          <Coffee size={48} />
        </div>
        <div className="flex items-center gap-2 text-neutral-400 font-bold">
          <Loader2 className="animate-spin" size={20} />
          <span>Memuat CafeFlow...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Self-Order Route */}
        <Route path="/order/:branchId/:tableId" element={<SelfOrder />} />

        {/* Auth Route */}
        {!user ? (
          <Route path="*" element={
            <div className="h-screen flex flex-col items-center justify-center bg-neutral-50 p-6">
              <div className="w-full max-w-md bg-white p-12 rounded-[48px] shadow-2xl border border-neutral-100 text-center space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-orange-500 p-6 rounded-3xl text-white shadow-2xl shadow-orange-100">
                    <Coffee size={64} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-neutral-800 tracking-tight">CafeFlow</h1>
                    <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs mt-2">Sistem POS Cerdas & Terpadu</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-neutral-500 font-medium">Silakan masuk untuk demo aplikasi</p>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => handleLogin('owner')}
                      className="w-full bg-orange-500 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
                    >
                      Masuk sebagai Owner
                    </button>
                    <button 
                      onClick={() => handleLogin('cashier')}
                      className="w-full bg-white border-2 border-neutral-100 p-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:border-orange-500 hover:bg-orange-50 transition-all shadow-sm"
                    >
                      Masuk sebagai Kasir
                    </button>
                    <button 
                      onClick={() => handleLogin('kitchen')}
                      className="w-full bg-white border-2 border-neutral-100 p-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:border-orange-500 hover:bg-orange-50 transition-all shadow-sm"
                    >
                      Masuk sebagai Kitchen
                    </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-neutral-50 text-[10px] text-neutral-300 font-bold uppercase tracking-widest">
                  &copy; 2026 CafeFlow POS System - Demo Mode
                </div>
              </div>
            </div>
          } />
        ) : (
          <>
            <Route path="/dashboard" element={<Layout user={user} onLogout={handleLogout}><Dashboard user={user} /></Layout>} />
            <Route path="/pos" element={<Layout user={user} onLogout={handleLogout}><POS branchId={user.branchId || 'b1'} user={user} /></Layout>} />
            <Route path="/kds" element={<Layout user={user} onLogout={handleLogout}><KDS branchId={user.branchId || 'b1'} /></Layout>} />
            <Route path="/inventory" element={<Layout user={user} onLogout={handleLogout}><Inventory branchId={user.branchId || 'b1'} /></Layout>} />
            <Route path="/attendance" element={<Layout user={user} onLogout={handleLogout}><Attendance user={user} /></Layout>} />
            <Route path="/menu" element={<Layout user={user} onLogout={handleLogout}><MenuManager branchId={user.branchId || 'b1'} /></Layout>} />
            <Route path="/branches" element={<Layout user={user} onLogout={handleLogout}><BranchManager /></Layout>} />
            <Route path="/tables" element={<Layout user={user} onLogout={handleLogout}><TableManager branchId={user.branchId || 'b1'} /></Layout>} />
            <Route path="/transactions" element={<Layout user={user} onLogout={handleLogout}><TransactionManager branchId={user.branchId || 'b1'} user={user} /></Layout>} />
            <Route path="/shifts" element={<Layout user={user} onLogout={handleLogout}><ShiftManager branchId={user.branchId || 'b1'} user={user} /></Layout>} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
