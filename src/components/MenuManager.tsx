import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Coffee, 
  Utensils, 
  Cookie,
  ChevronRight,
  Settings,
  Scale
} from 'lucide-react';
import { storage } from '../services/storage';
import { Product, Ingredient } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function MenuManager({ branchId }: { branchId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ 
    name: '', 
    price: 0, 
    category: 'food',
    recipe: []
  });

  useEffect(() => {
    if (!branchId) return;

    const loadData = () => {
      const allProducts = storage.getAll<Product>('products');
      setProducts(allProducts.filter(p => p.branchId === branchId));

      const allIngredients = storage.getAll<Ingredient>('ingredients');
      setIngredients(allIngredients.filter(i => i.branchId === branchId));
    };

    loadData();
    return storage.subscribe(loadData);
  }, [branchId]);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    storage.add('products', {
      ...newProduct,
      branchId,
      recipe: newProduct.recipe || []
    });
    setNewProduct({ name: '', price: 0, category: 'food', recipe: [] });
    setIsAdding(false);
  };

  const addIngredientToRecipe = (ingredientId: string) => {
    const existing = newProduct.recipe?.find(r => r.ingredientId === ingredientId);
    if (existing) return;

    setNewProduct({
      ...newProduct,
      recipe: [...(newProduct.recipe || []), { ingredientId, quantity: 1 }]
    });
  };

  const updateRecipeQuantity = (ingredientId: string, quantity: number) => {
    setNewProduct({
      ...newProduct,
      recipe: newProduct.recipe?.map(r => 
        r.ingredientId === ingredientId ? { ...r, quantity } : r
      )
    });
  };

  const removeIngredientFromRecipe = (ingredientId: string) => {
    setNewProduct({
      ...newProduct,
      recipe: newProduct.recipe?.filter(r => r.ingredientId !== ingredientId)
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Hapus produk ini?')) {
      storage.remove('products', id);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between bg-white p-8 rounded-[32px] border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-neutral-800">Menu & Resep</h1>
          <p className="text-neutral-500 font-medium mt-1">Kelola menu makanan & minuman serta komposisi bahannya</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Tambah Menu</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-[32px] border border-neutral-200 shadow-sm hover:border-orange-200 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-neutral-50 p-4 rounded-2xl text-neutral-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-all">
                  {product.category === 'food' ? <Utensils size={24} /> : 
                   product.category === 'drink' ? <Coffee size={24} /> : <Cookie size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-800">{product.name}</h3>
                  <p className="text-sm text-orange-600 font-black">Rp {product.price.toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => handleDeleteProduct(product.id)} className="text-red-300 hover:text-red-500">
                <Trash2 size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-widest">
                <span>Resep / Bahan</span>
                <span>Porsi</span>
              </div>
              {product.recipe && product.recipe.length > 0 ? (
                product.recipe.map((r, idx) => {
                  const ing = ingredients.find(i => i.id === r.ingredientId);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                      <span className="text-sm font-bold text-neutral-600">{ing?.name || 'Unknown'}</span>
                      <span className="text-sm font-black text-neutral-800">{r.quantity} {ing?.unit}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-neutral-400 italic">Belum ada resep terdaftar</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Left: Basic Info */}
              <div className="flex-1 p-12 border-r border-neutral-100 overflow-y-auto">
                <h2 className="text-3xl font-black mb-8">Detail Menu</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Nama Menu</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Nasi Goreng Spesial" 
                      className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Harga Jual</label>
                      <input 
                        type="number" 
                        placeholder="Rp 25.000" 
                        className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Kategori</label>
                      <select 
                        className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as any })}
                      >
                        <option value="food">Makanan</option>
                        <option value="drink">Minuman</option>
                        <option value="snack">Cemilan</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex gap-4">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 font-bold text-neutral-500 hover:text-neutral-700"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleAddProduct}
                    className="flex-[2] bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
                  >
                    Simpan Menu
                  </button>
                </div>
              </div>

              {/* Right: Recipe Builder */}
              <div className="flex-1 p-12 bg-neutral-50 overflow-y-auto">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Scale className="text-orange-500" size={24} />
                  Rangkai Resep
                </h3>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Pilih Bahan Baku</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ingredients.map(ing => (
                        <button
                          key={ing.id}
                          onClick={() => addIngredientToRecipe(ing.id)}
                          className="p-3 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 hover:border-orange-500 hover:text-orange-500 transition-all text-left"
                        >
                          {ing.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Komposisi Resep</label>
                    <div className="space-y-3">
                      {newProduct.recipe?.map((r, idx) => {
                        const ing = ingredients.find(i => i.id === r.ingredientId);
                        return (
                          <div key={idx} className="bg-white p-4 rounded-2xl border border-neutral-200 flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-bold text-sm text-neutral-800">{ing?.name}</p>
                              <p className="text-[10px] text-neutral-400 uppercase font-bold">{ing?.unit}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <input 
                                type="number" 
                                className="w-16 p-2 bg-neutral-50 border border-neutral-100 rounded-lg text-center font-black text-sm"
                                value={r.quantity}
                                onChange={(e) => updateRecipeQuantity(r.ingredientId, Number(e.target.value))}
                              />
                              <button onClick={() => removeIngredientFromRecipe(r.ingredientId)} className="text-red-300 hover:text-red-500">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {(!newProduct.recipe || newProduct.recipe.length === 0) && (
                        <div className="p-8 border-2 border-dashed border-neutral-200 rounded-2xl text-center text-neutral-400 text-sm italic">
                          Belum ada bahan terpilih
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
