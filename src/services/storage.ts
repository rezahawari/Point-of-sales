import { 
  User, 
  Branch, 
  Ingredient, 
  Product, 
  Table, 
  Order, 
  Attendance, 
  StockLog,
  Shift
} from '../types';

const DUMMY_BRANCHES: Branch[] = [
  { id: 'b1', name: 'CafeFlow Sudirman', address: 'Jl. Jend. Sudirman No. 1, Jakarta', location: { lat: -6.2088, lng: 106.8456 } },
  { id: 'b2', name: 'CafeFlow Dago', address: 'Jl. Ir. H. Juanda No. 10, Bandung', location: { lat: -6.8915, lng: 107.6107 } },
];

const DUMMY_USERS: User[] = [
  { id: 'u1', name: 'Reza Hawari', email: 'rezahawari19@gmail.com', role: 'owner', photoUrl: 'https://picsum.photos/seed/reza/100/100' },
  { id: 'u2', name: 'Budi Kasir', email: 'budi@cafeflow.com', role: 'cashier', branchId: 'b1', photoUrl: 'https://picsum.photos/seed/budi/100/100' },
  { id: 'u3', name: 'Siti Kitchen', email: 'siti@cafeflow.com', role: 'kitchen', branchId: 'b1', photoUrl: 'https://picsum.photos/seed/siti/100/100' },
];

const DUMMY_INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: 'Biji Kopi Arabica', unit: 'kg', stock: 25, branchId: 'b1' },
  { id: 'i2', name: 'Susu Fresh', unit: 'liter', stock: 15, branchId: 'b1' },
  { id: 'i3', name: 'Gula Aren', unit: 'kg', stock: 5, branchId: 'b1' },
  { id: 'i4', name: 'Teh Celup', unit: 'box', stock: 10, branchId: 'b1' },
];

const DUMMY_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Kopi Susu Gula Aren', price: 22000, category: 'drink', branchId: 'b1', recipe: [{ ingredientId: 'i1', quantity: 0.02 }, { ingredientId: 'i2', quantity: 0.15 }, { ingredientId: 'i3', quantity: 0.02 }] },
  { id: 'p2', name: 'Americano', price: 18000, category: 'drink', branchId: 'b1', recipe: [{ ingredientId: 'i1', quantity: 0.02 }] },
  { id: 'p3', name: 'Nasi Goreng Spesial', price: 35000, category: 'food', branchId: 'b1' },
  { id: 'p4', name: 'Kentang Goreng', price: 15000, category: 'snack', branchId: 'b1' },
];

const DUMMY_TABLES: Table[] = [
  { id: 't1', number: '01', branchId: 'b1', status: 'available' },
  { id: 't2', number: '02', branchId: 'b1', status: 'occupied' },
  { id: 't3', number: '03', branchId: 'b1', status: 'available' },
  { id: 't4', number: '04', branchId: 'b1', status: 'available' },
];

const DUMMY_ORDERS: Order[] = [
  { 
    id: 'o1', 
    branchId: 'b1', 
    tableId: 't2', 
    status: 'preparing', 
    customerName: 'Andi',
    totalAmount: 40000, 
    paymentMethod: 'unpaid', 
    createdAt: new Date().toISOString(),
    items: [
      { productId: 'p1', productName: 'Kopi Susu Gula Aren', quantity: 1, status: 'preparing', category: 'drink' },
      { productId: 'p2', productName: 'Americano', quantity: 1, status: 'pending', category: 'drink' }
    ]
  }
];

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  private set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  constructor() {
    if (!localStorage.getItem('branches')) this.set('branches', DUMMY_BRANCHES);
    if (!localStorage.getItem('users')) this.set('users', DUMMY_USERS);
    if (!localStorage.getItem('ingredients')) this.set('ingredients', DUMMY_INGREDIENTS);
    if (!localStorage.getItem('products')) this.set('products', DUMMY_PRODUCTS);
    if (!localStorage.getItem('tables')) this.set('tables', DUMMY_TABLES);
    if (!localStorage.getItem('orders')) this.set('orders', DUMMY_ORDERS);
    if (!localStorage.getItem('attendance')) this.set('attendance', []);
    if (!localStorage.getItem('stockLogs')) this.set('stockLogs', []);
    if (!localStorage.getItem('shifts')) this.set('shifts', []);
    if (!localStorage.getItem('transactionCorrections')) this.set('transactionCorrections', []);
  }

  // Generic CRUD
  getAll<T>(key: string): T[] {
    return this.get<T[]>(key, []);
  }

  getById<T extends { id: string }>(key: string, id: string): T | undefined {
    return this.getAll<T>(key).find(i => i.id === id);
  }

  getActiveShift(userId: string, branchId: string): Shift | undefined {
    const shifts = this.getAll<Shift>('shifts');
    return shifts.find(s => s.userId === userId && s.branchId === branchId && s.status === 'open');
  }

  add<T extends { id?: string }>(key: string, item: any): T {
    const items = this.getAll<any>(key);
    const newItem = { ...item, id: item.id || Math.random().toString(36).substr(2, 9) };
    items.push(newItem);
    this.set(key, items);
    window.dispatchEvent(new Event('storage-update'));
    return newItem as T;
  }

  update<T extends { id: string }>(key: string, id: string, updates: any): void {
    const items = this.getAll<any>(key);
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.set(key, items);
      window.dispatchEvent(new Event('storage-update'));
    }
  }

  remove(key: string, id: string): void {
    const items = this.getAll<{ id: string }>(key);
    const filtered = items.filter(i => i.id !== id);
    this.set(key, filtered);
    window.dispatchEvent(new Event('storage-update'));
  }

  delete(key: string, id: string): void {
    this.remove(key, id);
  }

  // Custom Listeners (Simulated)
  subscribe(callback: () => void) {
    window.addEventListener('storage-update', callback);
    return () => window.removeEventListener('storage-update', callback);
  }
}

export const storage = new StorageService();
