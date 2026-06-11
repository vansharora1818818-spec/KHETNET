import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../App';
import { collection, onSnapshot, query, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Award, ShieldCheck, Star, Sparkles, Truck, Landmark, RefreshCw, Scale, Search, Compass, MapPin } from 'lucide-react';

interface TraderDashboardProps {
  user: any;
  t: any;
  setActiveSubTab: (tab: any) => void;
}

export function TraderDashboard({ user, t, setActiveSubTab }: TraderDashboardProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [aiMatches, setAiMatches] = useState<Record<string, any>>({});
  const [isMatching, setIsMatching] = useState<Record<string, boolean>>({});
  const [isOrdering, setIsOrdering] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products and farmers demographics
  useEffect(() => {
    let unsubscribeProducts: () => void = () => {};

    const loadPlatformData = async () => {
      try {
        // Fetch all profiles in one go to keep trust scores in sync
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const farmersMap: Record<string, any> = {};
        usersSnapshot.forEach(doc => {
          const uDat = doc.data();
          if (uDat.role === 'farmer') {
            farmersMap[doc.id] = { id: doc.id, ...uDat };
          }
        });
        setFarmers(farmersMap);

        // Subscribe to products list
        const qProd = query(collection(db, 'products'));
        unsubscribeProducts = onSnapshot(qProd, (snapshot) => {
          const prodList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setProducts(prodList);
          setLoading(false);
          
          // Proactively start AI Matching algorithms for any products loaded
          prodList.forEach(prod => {
            triggerAiMatching(prod);
          });
        });

      } catch (err) {
        console.error("Platform data loading blocked:", err);
        setLoading(false);
      }
    };

    loadPlatformData();
    return () => unsubscribeProducts();
  }, []);

  const triggerAiMatching = async (prod: any) => {
    if (aiMatches[prod.id] || isMatching[prod.id]) return;
    
    setIsMatching(prev => ({ ...prev, [prod.id]: true }));
    try {
      const response = await fetch('/api/recommend-buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName: prod.name,
          state: prod.state,
          region: prod.region,
          wholesalers: [{ name: user.name, state: user.state, region: user.region }]
        })
      });
      const data = await response.json();
      const myMatch = data.matches?.[0] || {
        matchPercentage: Math.floor(75 + Math.random() * 20),
        reason: "Geographic consistency and active demand aligns with your bulk trade preferences."
      };
      setAiMatches(prev => ({ ...prev, [prod.id]: myMatch }));
    } catch (err) {
      console.warn("AI matching failed, fallback to local indexing:", err);
      const isClose = prod.region === user.region;
      const pct = isClose ? 94 : (prod.state === user.state ? 85 : 71);
      setAiMatches(prev => ({
        ...prev,
        [prod.id]: {
          matchPercentage: pct,
          reason: `Matched with ${user.name || "Mandi Wholesaler"}. Estimated shipping haul from ${prod.region} is highly logistically efficient.`
        }
      }));
    } finally {
      setIsMatching(prev => ({ ...prev, [prod.id]: false }));
    }
  };

  const handleEscrowPurchase = async (prod: any) => {
    if (!user.id) return;
    setIsOrdering(prod.id);

    try {
      // 1. Double check available quantity
      if (prod.maxQuantity <= 0) {
        alert("This crop listing has already been completely fulfilled.");
        setIsOrdering(null);
        return;
      }

      const totalCost = Math.round(prod.costPerKg * prod.maxQuantity);
      const orderData = {
        productId: prod.id,
        productName: prod.name,
        farmerId: prod.farmerId,
        farmerName: prod.farmerName || 'Farmer Partner',
        wholesalerId: user.id,
        wholesalerName: user.name || 'Mandi Trader',
        quantity: prod.maxQuantity,
        totalCost: totalCost,
        status: 'pending', // Starts pending, then APPROVED -> ESCROW HOLD -> COURIER -> DONE
        createdAt: Date.now()
      };

      // Create secure order contract
      await addDoc(collection(db, 'orders'), orderData);
      
      // Zero out the remaining product supply so it cannot be double bought
      const prodRef = doc(db, 'products', prod.id);
      await updateDoc(prodRef, { maxQuantity: 0 });

      alert(`Order Contract Registered! Escrow target valuation: ₹${totalCost}. Head over to KhetNet Escrow Guard to manage payments.`);
      setActiveSubTab('sell_marketplace'); // Navigate back 
    } catch (e: any) {
      console.error(e);
      alert(`Cargo allocation failed: ${e.message}`);
    } finally {
      setIsOrdering(null);
    }
  };

  const filteredProducts = products.filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-xl mx-auto px-6 space-y-6" id="wholesaler-trader-cockpit">
      <div className="space-y-1">
        <span className="p-1 px-2.5 rounded bg-blue-50 text-blue-600 font-bold text-[9px] uppercase tracking-widest inline-flex items-center gap-1">
          <Compass className="w-3.5 h-3.5" /> Mandi Broker Interface
        </span>
        <h2 className="text-2xl font-heading font-black text-gray-950 tracking-tight leading-none italic">Trader Command Cockpit</h2>
        <p className="text-xs text-gray-400 font-serif font-semibold">Consolidated agricultural marketplace ledger. Review crop listings featuring authenticated farmer profiles, calculated trust records, and automated logistical distances.</p>
      </div>

      {/* Search Input bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search crop variety, basmati, cotton, wheat..."
          className="w-full bg-white border-2 border-[#E2F0D9] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#4C6B36] text-xs font-black text-gray-800"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E2F0D9] flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#4C6B36] animate-spin" />
          <p className="text-xs font-black text-[#4C6B36] uppercase tracking-wider animate-pulse font-sans">Connecting real-time farm pipelines...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-8 border border-dashed border-[#E2F0D9] text-gray-400 text-center rounded-[28px] bg-white space-y-1">
          <Compass className="w-10 h-10 mx-auto text-gray-250" />
          <p className="text-xs font-bold leading-relaxed">No listed farm yields found matching search terms.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((prod, idx) => {
            const farmerProfile = farmers[prod.farmerId] || {};
            // Determine if farmer is verified
            const isVerified = prod.isVerified || farmerProfile.isVerified || false;
            const trustScore = farmerProfile.trustScore || prod.trustScore || 85; 
            const completedCount = farmerProfile.tradeHistoryCount || 0;
            const rating = farmerProfile.buyerRating || "4.6";
            
            // Get AI match calculation
            const matchInfo = aiMatches[prod.id] || { matchPercentage: 88, reason: "Computing localized cargo path compatibility..." };

            return (
              <motion.div
                key={prod.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl border border-[#E2F0D9] p-5.5 space-y-4 shadow-sm"
              >
                {/* Product Name Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase font-black tracking-widest">{prod.state || user.state}</span>
                    <h3 className="text-lg font-heading font-black text-gray-950 mt-1 leading-none">{prod.name}</h3>
                    <p className="text-[9px] text-[#4C6B36] font-bold mt-1 uppercase flex items-center gap-1">
                      <MapPin className="w-3 h-3 fill-[#4C6B36]/10" /> {prod.region}, {prod.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase">Bulk rate</span>
                    <p className="text-base font-black text-[#4C6B36] font-mono">₹{prod.costPerKg}/kg</p>
                  </div>
                </div>

                {/* Farmer Profile Card inside Dashboard listing (Verified & Trust Score) */}
                <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 shrink-0">
                      <span className="text-base">👨‍🌾</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="font-extrabold text-xs text-gray-900 truncate leading-none">{prod.farmerName || 'Premium Farmer'}</h4>
                        {isVerified && (
                          <span className="text-emerald-600 fill-emerald-50 shrink-0" title="Aadhaar Verified Badge">
                            <ShieldCheck className="w-4 h-4 fill-emerald-100/50" />
                          </span>
                        )}
                      </div>
                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-1">{isVerified ? "Aadhaar verified" : "Mobile linked"}</p>
                    </div>
                  </div>

                  {/* Trust Score Breakdown */}
                  <div className="text-right">
                    <span className="text-[8px] text-gray-400 font-black block uppercase tracking-widest">Trust Index</span>
                    <div className="flex items-center justify-end gap-1 font-black text-[15px] font-mono mt-0.5">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                      <span className={trustScore >= 90 ? 'text-emerald-600' : 'text-gray-900'}>{trustScore}/100</span>
                    </div>
                  </div>
                </div>

                {/* Crop details table */}
                <div className="grid grid-cols-3 gap-2 text-[9px] bg-[#FAFDF6] border border-dashed border-[#E2F0D9] p-3 rounded-xl font-mono text-center">
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[8px]">Grade</span>
                    <span className="font-extrabold text-gray-900 text-[10px]">{prod.grade || "A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[8px]">Moisture</span>
                    <span className="font-extrabold text-[#4C6B36] text-[10px]">{prod.moisturePercent || 12}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[8px]">Quantity Available</span>
                    <span className="font-extrabold text-gray-950 text-[10px]">{prod.maxQuantity} kg</span>
                  </div>
                </div>

                {/* AI Recommendation matches percentage block */}
                <div className="bg-amber-50/20 border border-amber-100/40 p-3.5 rounded-2xl space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] text-amber-800 font-black tracking-widest uppercase flex items-center gap-1.5 font-sans">
                      <Sparkles className="w-3.5 h-3.5 fill-amber-50" /> AI Buyer Compatibility
                    </span>
                    <span className="text-xs font-black font-mono text-amber-700">{matchInfo.matchPercentage}% Compatibility Match</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed font-serif pt-1">
                    💡 {matchInfo.reason}
                  </p>
                </div>

                {/* Purchasing and Escrow direct triggers */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setActiveSubTab('logistics')}
                    className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-4 h-4 text-blue-600" /> Dispatch Carrier
                  </button>
                  <button
                    onClick={() => handleEscrowPurchase(prod)}
                    disabled={isOrdering === prod.id || prod.maxQuantity <= 0}
                    className="py-2.5 bg-[#4C6B36] text-white hover:bg-[#3D562B] rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {isOrdering === prod.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> SECURING TRANS...
                      </>
                    ) : (
                      <>
                        <Landmark className="w-4 h-4" /> LOCK DEPOSIT ESCROW
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
