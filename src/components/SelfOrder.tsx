import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Coffee, 
  Utensils, 
  Cookie,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronLeft
} from 'lucide-react';
import { storage } from '../services/storage';
import { Product, OrderItem, Branch, Table } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export default function SelfOrder() {
  const { branchId, tableId } = useParams<{ branchId: string, tableId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [category, setCategory] = useState<'all' | 'food' | 'drink' | 'snack'>('all');
  const [isOrdering, setIsOrdering] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderStatus, setOrderStatus] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    if (!branchId || !tableId) return;

    const fetchInfo = () => {
      const branchDoc = storage.getById<Branch>('branches', branchId);
      if (branchDoc) setBranch(branchDoc);

      const tableDoc = storage.getById<Table>('tables', tableId);
      if (tableDoc) setTable(tableDoc);
      
      const allProducts = storage.getAll<Product>('products');
      setProducts(allProducts.filter(p => p.branchId === branchId));
    };
    fetchInfo();

    return storage.subscribe(fetchInfo);
  }, [branchId, tableId]);

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

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totalAmount = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const handlePlaceOrder = () => {
    if (cart.length === 0 || !customerName || !branchId) return;
    
    storage.add('orders', {
      branchId,
      tableId,
      status: 'pending',
      items: cart,
      totalAmount,
      paymentMethod: 'unpaid',
      createdAt: new Date().toISOString(),
      customerName
    });

    if (tableId) {
      storage.update('tables', tableId, { status: 'occupied' });
    }

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });

    setOrderStatus('success');
    setCart([]);
  };

  if (orderStatus === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="bg-green-100 p-8 rounded-full text-green-600">
          <CheckCircle2 size={80} />
        </div>
        <h1 className="text-4xl font-black text-neutral-800">Pesanan Terkirim!</h1>
        <p className="text-neutral-500 max-w-xs">Pesanan Anda sedang diproses oleh dapur. Silakan tunggu sebentar.</p>
        <button 
          onClick={() => setOrderStatus('idle')}
          className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-100"
        >
          Pesan Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans pb-32">
      {/* Header */}
      <header className="bg-white p-6 sticky top-0 z-30 border-b border-neutral-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-neutral-800">{branch?.name || 'CafeFlow'}</h1>
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">Meja {table?.number || '...'}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-2xl text-orange-500">
            <Coffee size={24} />
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="p-6 flex gap-3 overflow-x-auto no-scrollbar">
        {(['all', 'food', 'drink', 'snack'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-6 py-3 rounded-2xl text-sm font-bold capitalize whitespace-nowrap transition-all ${
              category === cat ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-white text-neutral-500 border border-neutral-200'
            }`}
          >
            {cat === 'all' ? 'Semua' : cat === 'food' ? 'Makanan' : cat === 'drink' ? 'Minuman' : 'Cemilan'}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="p-6 grid grid-cols-1 gap-4">
        {products.filter(p => category === 'all' || p.category === category).map(product => {
          const cartItem = cart.find(i => i.productId === product.id);
          return (
            <div key={product.id} className="bg-white p-4 rounded-[32px] border border-neutral-100 shadow-sm flex items-center gap-4">
              <div className="w-24 h-24 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-300">
                {product.category === 'food' ? <Utensils size={32} /> : 
                 product.category === 'drink' ? <Coffee size={32} /> : <Cookie size={32} />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-neutral-800">{product.name}</h3>
                <p className="text-orange-600 font-black mt-1">Rp {product.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3 bg-neutral-50 p-1 rounded-2xl">
                {cartItem ? (
                  <>
                    <button onClick={() => updateQuantity(product.id, -1)} className="p-2 bg-white rounded-xl shadow-sm">
                      <Minus size={16} />
                    </button>
                    <span className="font-black w-6 text-center">{cartItem.quantity}</span>
                    <button onClick={() => updateQuantity(product.id, 1)} className="p-2 bg-white rounded-xl shadow-sm">
                      <Plus size={16} />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => addToCart(product)}
                    className="bg-orange-500 text-white p-3 rounded-xl shadow-lg shadow-orange-100"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-neutral-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total Pesanan</p>
                <p className="text-2xl font-black text-neutral-800">Rp {totalAmount.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setIsOrdering(true)}
                className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-orange-100"
              >
                Lanjut Pesan
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Modal */}
      <AnimatePresence>
        {isOrdering && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-[40px] sm:rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-neutral-100 flex items-center gap-4">
                <button onClick={() => setIsOrdering(false)} className="p-2 hover:bg-neutral-50 rounded-full">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-black">Konfirmasi Pesanan</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.productId} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="bg-orange-50 text-orange-600 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs">
                          {item.quantity}x
                        </span>
                        <span className="font-bold text-neutral-800">{item.productName}</span>
                      </div>
                      <span className="font-bold text-neutral-500">
                        Rp {(products.find(p => p.id === item.productId)?.price || 0 * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-neutral-100 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Nama Anda</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan nama Anda..." 
                      className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-neutral-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-neutral-500 font-bold">Total Pembayaran</span>
                  <span className="text-2xl font-black text-orange-600">Rp {totalAmount.toLocaleString()}</span>
                </div>
                <button 
                  onClick={handlePlaceOrder}
                  disabled={!customerName}
                  className="w-full bg-orange-500 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-orange-100 hover:bg-orange-600 disabled:opacity-50 transition-all"
                >
                  Pesan Sekarang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
