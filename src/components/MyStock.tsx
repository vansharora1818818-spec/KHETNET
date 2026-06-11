import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Warehouse, 
  Calendar, 
  Sparkles,
  ChevronRight,
  PackageCheck,
  CircleAlert
} from 'lucide-react';
import { db } from '../App';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc, 
  doc,
  updateDoc 
} from 'firebase/firestore';

interface StockItem {
  id: string;
  userId: string;
  cropName: string;
  quantity: number;
  grade: string;
  location: string;
  addedDate: string;
}

interface MyStockProps {
  user: any;
  t: any;
}

const COMMON_CROPS = [
  { name: 'Wheat (गेहूं)', defaultPrice: 45, icon: '🌾' },
  { name: 'Basmati Rice (धान)', defaultPrice: 65, icon: '🌾' },
  { name: 'Onion (प्याज)', defaultPrice: 25, icon: '🧅' },
  { name: 'Potatoes (आलू)', defaultPrice: 18, icon: '🥔' },
  { name: 'Cotton (कपास)', defaultPrice: 58, icon: '☁️' }
];

export default function MyStock({ user, t }: MyStockProps) {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form states
  const [cropName, setCropName] = useState('Wheat (गेहूं)');
  const [customCrop, setCustomCrop] = useState('');
  const [quantity, setQuantity] = useState('500');
  const [grade, setGrade] = useState('A');
  const [location, setLocation] = useState('Home Granary (घर का गोदाम)');
  const [addedDate, setAddedDate] = useState(new Date().toISOString().split('T')[0]);

  // Read Stock list in Real-time from Firestore
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    const q = query(
      collection(db, 'stocks'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: StockItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId,
          cropName: data.cropName,
          quantity: Number(data.quantity) || 0,
          grade: data.grade || 'A',
          location: data.location || 'Warehouse',
          addedDate: data.addedDate || ''
        });
      });
      setStocks(items);
      setLoading(false);
    }, (err) => {
      console.warn("MyStock loading fallback offline state: ", err);
      // Fallback local persistence if offline
      const stored = localStorage.getItem(`khetnet_stock_${user.id}`);
      if (stored) {
        setStocks(JSON.parse(stored));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Sync to local storage for instant loading / offline support
  useEffect(() => {
    if (stocks.length > 0 && user?.id) {
      localStorage.setItem(`khetnet_stock_${user.id}`, JSON.stringify(stocks));
    }
  }, [stocks, user?.id]);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const finalCropName = cropName === 'Other (अन्य)' ? customCrop : cropName;
    if (!finalCropName) return;

    const newStock = {
      userId: user.id,
      cropName: finalCropName,
      quantity: Number(quantity) || 100,
      grade,
      location,
      addedDate,
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'stocks'), newStock);
      setIsAdding(false);
      // Reset
      setCustomCrop('');
      setQuantity('500');
    } catch (e) {
      console.error("Error writing stock document:", e);
      // Offline fallback
      const offlineItem: StockItem = {
        id: 'temp_' + Date.now(),
        ...newStock
      };
      setStocks(prev => [offlineItem, ...prev]);
      setIsAdding(false);
    }
  };

  const handleUpdateQty = async (itemId: string, currentQty: number, delta: number) => {
    const updatedQty = Math.max(0, currentQty + delta);
    if (updatedQty === 0) {
      // Confirm delete if it hits 0
      handleDelete(itemId);
      return;
    }

    // Is it a temp firebase ID?
    if (itemId.startsWith('temp_')) {
      setStocks(prev => prev.map(s => s.id === itemId ? { ...s, quantity: updatedQty } : s));
      return;
    }

    try {
      const stockRef = doc(db, 'stocks', itemId);
      await updateDoc(stockRef, { quantity: updatedQty });
    } catch (err) {
      console.error("Error updating stock quantity", err);
      // Update local state if error / offline
      setStocks(prev => prev.map(s => s.id === itemId ? { ...s, quantity: updatedQty } : s));
    }
  };

  const handleDelete = async (itemId: string) => {
    if (itemId.startsWith('temp_')) {
      setStocks(prev => prev.filter(s => s.id !== itemId));
      return;
    }

    try {
      await deleteDoc(doc(db, 'stocks', itemId));
    } catch (err) {
      console.error("Error deleting stock item", err);
      setStocks(prev => prev.filter(s => s.id !== itemId));
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-4 space-y-6">
      
      {/* Title block */}
      <div className="flex justify-between items-center bg-gradient-to-r from-[#F0F7EB] to-white p-5 rounded-[28px] border border-[#E2F0D9]">
        <div>
          <span className="text-[10px] text-[#4C6B36] font-black uppercase tracking-wider block bg-white border border-[#E2F0D9] px-2 py-0.5 rounded-full w-max">📦 Storage House / गोदाम</span>
          <h2 className="text-2xl font-black text-gray-950 mt-1 font-heading">My Stock (मेला स्टॉक)</h2>
          <p className="text-xs text-gray-400 mt-1">Check quantities, add or update bags in cold storage</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-14 h-14 bg-[#4C6B36] text-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all text-xl"
            title="Add Seed Stock"
            id="add-stock-trigger-btn"
          >
            <Plus className="w-7 h-7" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="add-stock-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border-2 border-[#4C6B36] p-6.5 rounded-[32px] shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center text-left">
              <h3 className="font-heading font-black text-lg text-gray-950">📦 Add New Stock Item</h3>
              <button 
                onClick={() => setIsAdding(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-bold uppercase py-1 px-3 rounded-xl bg-gray-50"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddStock} className="space-y-4 text-left">
              
              {/* Crop selection */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide block">Select Crop Variety</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_CROPS.map((cr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCropName(cr.name);
                      }}
                      className={`p-3 rounded-2xl border text-xs font-black text-center transition-all ${cropName === cr.name ? 'bg-[#F0F7EB] border-[#4C6B36] text-gray-950' : 'bg-[#FAFDF6] border-[#E2F0D9] text-gray-700 hover:bg-[#F3F9EF]'}`}
                    >
                      <span className="block text-lg mb-1">{cr.icon}</span>
                      {cr.name.split(' ')[0]}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCropName('Other (अन्य)')}
                    className={`p-3 rounded-2xl border text-xs font-black text-center transition-all col-span-1 sm:col-span-1 ${cropName === 'Other (अन्य)' ? 'bg-[#F0F7EB] border-[#4C6B36] text-gray-950' : 'bg-[#FAFDF6] border-[#E2F0D9] text-gray-700 hover:bg-[#F3F9EF]'}`}
                  >
                    <span className="block text-lg mb-1">🌾</span>
                    Other / अन्य
                  </button>
                </div>
              </div>

              {cropName === 'Other (अन्य)' && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wide block">Enter Crop Name</label>
                  <input
                    required
                    type="text"
                    value={customCrop}
                    onChange={(e) => setCustomCrop(e.target.value)}
                    placeholder="e.g. Mustard, Garlic"
                    className="w-full bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl py-3 px-4 outline-none text-xs font-bold"
                  />
                </div>
              )}

              {/* Quantity in KG */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wide block">Total Quantity (kg) / कुल वजन</label>
                <div className="flex gap-2 items-center">
                  <input
                    required
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1 bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl py-3 px-4 outline-none text-sm font-bold"
                  />
                  <div className="grid grid-cols-2 gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => String(Math.max(1, Number(prev) + 100)))}
                      className="py-1 px-3 bg-[#FAFDF6] border border-[#E2F0D9] rounded-lg text-[10px] font-black"
                    >
                      +100
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => {
                        const val = Math.max(1, Number(prev) - 100);
                        return String(val);
                      })}
                      className="py-1 px-3 bg-[#FAFDF6] border border-[#E2F0D9] rounded-lg text-[10px] font-black"
                    >
                      -100
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Crop Grade selection */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wide block">Quality Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl py-3 px-3 outline-none text-xs font-bold"
                  >
                    <option value="A">Grade A (Premium / उत्तम)</option>
                    <option value="B">Grade B (Standard / साधारण)</option>
                    <option value="C">Grade C (Slight Moisture)</option>
                  </select>
                </div>

                {/* Storage Storage Location */}
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wide block">Storage House</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl py-3 px-3 outline-none text-xs font-bold"
                  >
                    <option value="Home Granary (घर का गोदाम)">Home Granary (घर)</option>
                    <option value="APMC Storage (मंडी शीतगृह)">APMC Storage (मंडी)</option>
                    <option value="Cold Storage No 3 (कोल्ड स्टोर)">Cold Storage (कोल्ड)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4.5 bg-[#4C6B36] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-[#3D562B] transition-all"
                id="submit-stock-btn"
              >
                ✓ Add to My Stock / स्टॉक में जोड़ें
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="stock-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {loading ? (
              <div className="py-20 text-center">
                <p className="text-xs font-black uppercase text-[#4C6B36] tracking-widest">Loading physical stock files...</p>
              </div>
            ) : stocks.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-[32px] border-2 border-dashed border-[#E2F0D9] space-y-4">
                <span className="text-4xl block">📦</span>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-gray-950">Your Granary is Currently Empty</h4>
                  <p className="text-xs text-gray-400">Keep track of your agricultural seed storage bags here with one-tap balance updates.</p>
                </div>
                <button
                  onClick={() => setIsAdding(true)}
                  className="py-3 px-6 bg-[#FAFDF6] border border-[#4C6B36] text-[#4C6B36] hover:bg-[#F0F7EB] rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  + Add First Stock Bag
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {stocks.map((item) => (
                  <motion.div
                    key={item.id}
                    layoutId={`stock-item-${item.id}`}
                    className="p-5 bg-white border border-[#E2F0D9] rounded-[28px] shadow-sm flex items-center justify-between gap-4 hover:border-[#4C6B36]/40 transition-all text-left group"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] bg-[#F0F7EB] text-[#4C6B36] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                          Grade {item.grade}
                        </span>
                        <span className="text-[9px] bg-gray-50 text-gray-500 font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                          <Warehouse className="w-3 h-3 text-gray-400" /> {item.location.split(' ')[0]}
                        </span>
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className="text-base font-black text-gray-950 leading-tight truncate">
                          {item.cropName}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold mt-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" /> Added {item.addedDate}
                        </div>
                      </div>
                    </div>

                    {/* Quantity balancer control buttons for ultra-low literacy - big buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center bg-[#FAFDF6] border border-[#E2F0D9] p-1.5 rounded-2xl gap-3">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity, -50)}
                          className="w-10 h-10 bg-white hover:bg-rose-50 hover:text-rose-600 font-black border border-[#E1F0D8] text-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-90 select-none text-xs"
                          title="Subtract 50kg"
                        >
                          -50k
                        </button>
                        
                        <div className="text-center px-1">
                          <span className="block text-base font-black text-gray-950 font-mono leading-none">{item.quantity}</span>
                          <span className="text-[8px] text-gray-400 font-black uppercase mt-1 block">Kilograms</span>
                        </div>
                        
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity, 50)}
                          className="w-10 h-10 bg-white hover:bg-green-50 hover:text-green-700 font-black border border-[#E1F0D8] text-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-90 select-none text-xs"
                          title="Add 50kg"
                        >
                          +50k
                        </button>
                      </div>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-3 bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Stock capacity visualizer */}
                <div className="p-4.5 bg-[#FAFDF6] border border-[#E2F0D9] rounded-[24px] space-y-2.5 text-left">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-gray-500">
                    <span className="flex items-center gap-1">📊 Granary Holding Fill</span>
                    <span className="font-mono text-gray-900">
                      {stocks.reduce((acc, s) => acc + s.quantity, 0)} / 5,000 kg occupied
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-[#4C6B36] h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (stocks.reduce((acc, s) => acc + s.quantity, 0) / 5000) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
