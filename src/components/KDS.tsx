import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Utensils, 
  Coffee, 
  Cookie,
  Timer
} from 'lucide-react';
import { storage } from '../services/storage';
import { Order, OrderItem } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function KDS({ branchId, section }: { branchId: string, section?: 'food' | 'drink' | 'snack' }) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!branchId) return;

    const loadOrders = () => {
      const allOrders = storage.getAll<Order>('orders');
      setOrders(allOrders.filter(o => o.branchId === branchId && (o.status === 'pending' || o.status === 'preparing')));
    };

    loadOrders();
    return storage.subscribe(loadOrders);
  }, [branchId]);

  const updateItemStatus = (orderId: string, itemIndex: number, newStatus: OrderItem['status']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const newItems = [...order.items];
    newItems[itemIndex] = { ...newItems[itemIndex], status: newStatus };

    // Check if all items are ready
    const allReady = newItems.every(item => item.status === 'ready' || item.status === 'served');
    const anyPreparing = newItems.some(item => item.status === 'preparing');

    storage.update('orders', orderId, { 
      items: newItems,
      status: allReady ? 'served' : (anyPreparing ? 'preparing' : 'pending')
    });
  };

  const filteredOrders = orders.map(order => ({
    ...order,
    items: order.items.filter(item => !section || item.category === section)
  })).filter(order => order.items.length > 0);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-4 rounded-2xl text-white shadow-lg shadow-orange-100">
            <ChefHat size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-neutral-800">Dapur {section ? section.charAt(0).toUpperCase() + section.slice(1) : 'Utama'}</h1>
            <p className="text-neutral-500 font-medium">Memantau pesanan masuk secara real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Pesanan Aktif</p>
            <p className="text-3xl font-black text-orange-500">{filteredOrders.length}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order) => (
            <motion.div
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              key={order.id}
              className="bg-white rounded-[32px] border border-neutral-200 shadow-xl overflow-hidden flex flex-col"
            >
              <div className="p-6 bg-neutral-50 border-b border-neutral-100 flex justify-between items-start">
                <div>
                  <h3 className="font-black text-xl text-neutral-800">Meja {order.tableId || 'Takeaway'}</h3>
                  <p className="text-xs font-bold text-neutral-400 mt-1 uppercase tracking-wider">{order.customerName}</p>
                </div>
                <div className="flex items-center gap-2 text-orange-500 bg-white px-3 py-1.5 rounded-full border border-orange-100 shadow-sm">
                  <Clock size={14} />
                  <span className="text-xs font-black">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: id })}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 group">
                    <div className={`mt-1 p-2 rounded-xl ${
                      item.status === 'ready' ? 'bg-green-100 text-green-600' : 
                      item.status === 'preparing' ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      {item.category === 'food' ? <Utensils size={18} /> : 
                       item.category === 'drink' ? <Coffee size={18} /> : <Cookie size={18} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className={`font-bold ${item.status === 'ready' ? 'line-through text-neutral-300' : 'text-neutral-800'}`}>
                          {item.quantity}x {item.productName}
                        </span>
                      </div>
                      {item.note && <p className="text-xs text-orange-500 font-medium mt-1 italic">"{item.note}"</p>}
                      
                      <div className="mt-3 flex gap-2">
                        {item.status === 'pending' && (
                          <button 
                            onClick={() => updateItemStatus(order.id, idx, 'preparing')}
                            className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition-all shadow-md shadow-blue-100"
                          >
                            Masak
                          </button>
                        )}
                        {item.status === 'preparing' && (
                          <button 
                            onClick={() => updateItemStatus(order.id, idx, 'ready')}
                            className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition-all shadow-md shadow-green-100"
                          >
                            Selesai
                          </button>
                        )}
                        {item.status === 'ready' && (
                          <div className="flex-1 flex items-center justify-center gap-2 text-green-600 font-bold text-xs py-2 bg-green-50 rounded-xl">
                            <CheckCircle2 size={14} />
                            Siap Saji
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-neutral-50 border-t border-neutral-100">
                <div className="flex items-center justify-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-widest">
                  <Timer size={14} />
                  <span>ID: {order.id.slice(-6)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
