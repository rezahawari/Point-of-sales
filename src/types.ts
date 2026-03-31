export type UserRole = 'owner' | 'manager' | 'cashier' | 'kitchen' | 'waiter';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: string;
  photoUrl?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  location?: { lat: number; lng: number };
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: number;
  branchId: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'food' | 'drink' | 'snack';
  branchId: string;
  recipe?: { ingredientId: string; quantity: number }[];
}

export interface Table {
  id: string;
  number: string;
  branchId: string;
  status: 'available' | 'occupied';
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  note?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  category: string;
}

export interface Order {
  id: string;
  tableId?: string;
  branchId: string;
  status: 'pending' | 'preparing' | 'served' | 'paid' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'qris' | 'unpaid';
  createdAt: string;
  customerName?: string;
}

export interface Attendance {
  id: string;
  userId: string;
  branchId: string;
  type: 'in' | 'out';
  timestamp: string;
  location?: { lat: number; lng: number };
  photoUrl?: string;
}

export interface StockLog {
  id: string;
  ingredientId: string;
  branchId: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  timestamp: string;
}

export interface Shift {
  id: string;
  userId: string;
  branchId: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCash?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface TransactionCorrection {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  timestamp: string;
  previousAmount: number;
  newAmount: number;
  previousItems: OrderItem[];
  newItems: OrderItem[];
}
