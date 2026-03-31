import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ChefHat, 
  Package, 
  Menu, 
  MapPin, 
  UserCheck, 
  Table as TableIcon, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Coffee,
  Receipt,
  Clock
} from 'lucide-react';
import { User } from '../types';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'manager'] },
  { path: '/pos', label: 'POS Kasir', icon: ShoppingCart, roles: ['owner', 'manager', 'cashier'] },
  { path: '/kds', label: 'Dapur (KDS)', icon: ChefHat, roles: ['owner', 'manager', 'kitchen'] },
  { path: '/inventory', label: 'Stok Opname', icon: Package, roles: ['owner', 'manager'] },
  { path: '/menu', label: 'Menu & Resep', icon: Menu, roles: ['owner', 'manager'] },
  { path: '/branches', label: 'Cabang', icon: MapPin, roles: ['owner'] },
  { path: '/attendance', label: 'Absensi', icon: UserCheck, roles: ['owner', 'manager', 'cashier', 'kitchen', 'waiter'] },
  { path: '/tables', label: 'Meja', icon: TableIcon, roles: ['owner', 'manager', 'waiter'] },
  { path: '/transactions', label: 'Transaksi', icon: Receipt, roles: ['owner', 'manager', 'cashier'] },
  { path: '/shifts', label: 'Shift', icon: Clock, roles: ['owner', 'manager', 'cashier'] },
];

export default function Layout({ children, user, onLogout }: { children: React.ReactNode, user: User | null, onLogout: () => void }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const filteredNavItems = navItems.filter(item => 
    !user || item.roles.includes(user.role)
  );

  return (
    <div className="flex h-screen bg-neutral-50 font-sans text-neutral-900">
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r border-neutral-200 transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-neutral-100">
          <div className="bg-orange-500 p-2 rounded-xl text-white">
            <Coffee size={24} />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-xl tracking-tight text-neutral-800">CafeFlow</span>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-orange-50 text-orange-600 font-semibold' 
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-orange-600' : 'text-neutral-400'} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          {user && !isCollapsed && (
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden border border-neutral-100">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-neutral-500 capitalize">{user.role}</p>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-white border border-neutral-200 rounded-full p-1 text-neutral-400 hover:text-neutral-600 shadow-sm"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
