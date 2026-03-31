import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode,
  CheckCircle2,
  XCircle,
  Coffee,
  Clock,
  AlertCircle
} from 'lucide-react';
import { storage } from '../services/storage';
import { Product, OrderItem, Table, Order, User, Shift } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export default function POS({ branchId, user }: { branchId: string; user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<'all' | 'food' | 'drink' | 'snack'>('all');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qris' | 'unpaid'>('unpaid');
  const [customerName, setCustomerName] = useState('');
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  useEffect(() => {
    if (!branchId) return;

    const loadData = () => {
      const allProducts = storage.getAll<Product>('products');
      setProducts(allProducts.filter(p => p.branchId === branchId));

      const allTables = storage.getAll<Table>('tables');
      setTables(allTables.filter(t => t.branchId === branchId));

      const currentShift = storage.getActiveShift(user.id, branchId);
      setActiveShift(currentShift || null);
    };

    loadData();
    return storage.subscribe(loadData);
  }, [branchId, user.id]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        productName: product.name, 
        quantity: 1, 
        status: 'pending',
        category: product.category
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const orderData: Partial<Order> = {
      branchId,
      tableId: selectedTable || undefined,
      status: paymentMethod === 'unpaid' ? 'pending' : 'preparing',
      items: cart,
      totalAmount,
      paymentMethod,
      createdAt: new Date().toISOString(),
      customerName: customerName || 'Guest'
    };

    storage.add('orders', orderData);
    
    if (selectedTable) {
      storage.update('tables', selectedTable, { status: 'occupied' });
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setCart([]);
    setSelectedTable(null);
    setCustomerName('');
    setIsCheckingOut(false);
    alert('Order placed successfully!');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (category === 'all' || p.category === category)
  );

  if (!activeShift) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center bg-white rounded-[48px] border-2 border-dashed border-neutral-200 p-12 text-center">
        <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-[32px] flex items-center justify-center mb-8">
          <Clock size={48} />
        </div>
        <h2 className="text-3xl font-black text-neutral-800 mb-4">Shift Belum Dimulai</h2>
        <p className="text-neutral-500 max-w-md mb-8">
          Anda harus memulai shift dan memasukkan kas awal sebelum dapat melakukan transaksi penjualan.
        </p>
        <Link 
          to="/shifts"
          className="bg-orange-500 text-white px-12 py-5 rounded-2xl font-bold text-lg shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all flex items-center gap-3"
        >
          <Clock size={24} />
          Buka Manajemen Shift
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-8 h-[calc(100vh-160px)]">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari produk..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex bg-white p-1 rounded-2xl border border-neutral-200">
            {(['all', 'food', 'drink', 'snack'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  category === cat ? 'bg-orange-500 text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                {cat === 'all' ? 'Semua' : cat === 'food' ? 'Makanan' : cat === 'drink' ? 'Minuman' : 'Cemilan'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-2">
          {filteredProducts.map(product => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-3xl border border-neutral-200 text-left flex flex-col gap-3 hover:border-orange-500 transition-all shadow-sm"
            >
              <div className="w-full aspect-square bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400">
                <Coffee size={48} strokeWidth={1} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-800 line-clamp-1">{product.name}</h3>
                <p className="text-orange-600 font-bold mt-1">Rp {product.price.toLocaleString()}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="w-96 bg-white border border-neutral-200 rounded-[32px] flex flex-col shadow-xl overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-orange-500" size={24} />
            <h2 className="font-bold text-xl">Keranjang</h2>
          </div>
          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
            {cart.reduce((s, i) => s + i.quantity, 0)} item
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-4 opacity-50">
              <ShoppingCart size={64} strokeWidth={1} />
              <p>Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-neutral-800">{item.productName}</h4>
                  <p className="text-xs text-neutral-500">
                    Rp {(products.find(p => p.id === item.productId)?.price || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-neutral-50 p-1 rounded-xl">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:bg-white rounded-lg transition-all">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:bg-white rounded-lg transition-all">
                    <Plus size={14} />
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-neutral-50 border-t border-neutral-100 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span>Rp {totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-neutral-900">
              <span>Total</span>
              <span>Rp {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select 
              className="col-span-2 w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none"
              value={selectedTable || ''}
              onChange={(e) => setSelectedTable(e.target.value || null)}
            >
              <option value="">Pilih Meja</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>Meja {t.number} ({t.status})</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Nama Pelanggan" 
              className="col-span-2 w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <button 
            onClick={() => setIsCheckingOut(true)}
            disabled={cart.length === 0}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 disabled:opacity-50 disabled:shadow-none transition-all"
          >
            Bayar Sekarang
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckingOut && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center border-b border-neutral-100">
                <h2 className="text-2xl font-black mb-2">Metode Pembayaran</h2>
                <p className="text-neutral-500">Total Tagihan: <span className="text-orange-600 font-bold">Rp {totalAmount.toLocaleString()}</span></p>
              </div>

              <div className="p-8 grid grid-cols-2 gap-4">
                {[
                  { id: 'cash', label: 'Tunai', icon: Banknote, color: 'bg-green-50 text-green-600' },
                  { id: 'card', label: 'Kartu', icon: CreditCard, color: 'bg-blue-50 text-blue-600' },
                  { id: 'qris', label: 'QRIS', icon: QrCode, color: 'bg-purple-50 text-purple-600' },
                  { id: 'unpaid', label: 'Nanti', icon: XCircle, color: 'bg-neutral-50 text-neutral-600' },
                ].map(method => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                        paymentMethod === method.id 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-neutral-100 hover:border-neutral-200'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl ${method.color}`}>
                        <Icon size={24} />
                      </div>
                      <span className="font-bold">{method.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-8 bg-neutral-50 flex gap-4">
                <button 
                  onClick={() => setIsCheckingOut(false)}
                  className="flex-1 py-4 font-bold text-neutral-500 hover:text-neutral-700"
                >
                  Batal
                </button>
                <button 
                  onClick={handleCheckout}
                  className="flex-[2] bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all"
                >
                  Konfirmasi Bayar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
