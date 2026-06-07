import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  Scale, 
  Search, 
  HelpCircle, 
  Activity, 
  MapPin, 
  Building2,
  RefreshCw,
  TrendingUp as TrendIcon,
  BookOpen
} from 'lucide-react';
import { locations } from '../locations';

interface CropPriceItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  unit: string;
  baseChange: number;
}

interface CropPriceItemComputed {
  name: string;
  category: string;
  current: number;
  unit: string;
  change: number;
  trendPoints: number[];
  high: number;
  low: number;
  volume: string;
  forecast: string;
}

interface MarketPricesProps {
  user?: any;
  t?: any;
}

// Stable string hash function to produce deterministic fluctuations per region
const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export function MarketPrices({ user, t }: MarketPricesProps) {
  // Read user preset locations or default to Punjab / Amritsar
  const defaultState = user?.state && locations[user.state] ? user.state : 'Punjab';
  const defaultDistrict = user?.region && locations[defaultState]?.includes(user.region) 
    ? user.region 
    : (locations[defaultState]?.[0] || 'Amritsar');

  const [selectedState, setSelectedState] = useState(defaultState);
  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync state if user changes out of bounds
  useEffect(() => {
    if (user?.state && locations[user.state]) {
      setSelectedState(user.state);
      if (user.region && locations[user.state].includes(user.region)) {
        setSelectedDistrict(user.region);
      } else {
        setSelectedDistrict(locations[user.state][0] || '');
      }
    }
  }, [user]);

  // Handle state change
  const handleStateChange = (st: string) => {
    setSelectedState(st);
    if (locations[st] && locations[st].length > 0) {
      setSelectedDistrict(locations[st][0]);
    } else {
      setSelectedDistrict('');
    }
  };

  // Pre-configured baseline APMC crops with baseline stats
  const baselineCrops: CropPriceItem[] = [
    { id: 'basmati', name: 'Basmati Rice (Lakhmi)', category: 'Cereals', basePrice: 6500, unit: 'quintal', baseChange: 120 },
    { id: 'wheat', name: 'Premium Wheat (Kanak)', category: 'Cereals', basePrice: 2380, unit: 'quintal', baseChange: -15 },
    { id: 'turmeric', name: 'Organic Turmeric (Dry)', category: 'Spices', basePrice: 10800, unit: 'quintal', baseChange: 280 },
    { id: 'mustard', name: 'Yellow Mustard Seeds', category: 'Oilseeds', basePrice: 5500, unit: 'quintal', baseChange: 60 },
    { id: 'mango', name: 'Alfonso Quality Mangoes', category: 'Fruits', basePrice: 14000, unit: 'box (12 doz)', baseChange: 1100 },
    { id: 'onion', name: 'Red Onions (APMC Premium)', category: 'Vegetables', basePrice: 2150, unit: 'quintal', baseChange: -110 },
    { id: 'cotton', name: 'Kapas Cotton (L-Type)', category: 'Fiber', basePrice: 7600, unit: 'quintal', baseChange: 90 },
    { id: 'sugarcane', name: 'Certified Sugarcane Co-0238', category: 'Cereals', basePrice: 380, unit: 'quintal', baseChange: 12 },
    { id: 'soybean', name: 'Yellow Soya Bean (Grade-A)', category: 'Oilseeds', basePrice: 4800, unit: 'quintal', baseChange: -45 },
    { id: 'potato', name: 'Jyoti Potatoes (Cold Storage)', category: 'Vegetables', basePrice: 1450, unit: 'quintal', baseChange: 35 },
    { id: 'gram', name: 'Desi Bengal Gram (Chana)', category: 'Pulses', basePrice: 5120, unit: 'quintal', baseChange: 75 },
    { id: 'bajra', name: 'Pearl Millet (Hybrid Bajra)', category: 'Cereals', basePrice: 2100, unit: 'quintal', baseChange: -20 },
    { id: 'chilli', name: 'Guntur Red Chilli (Teja)', category: 'Spices', basePrice: 18500, unit: 'quintal', baseChange: 450 }
  ];

  // Compute responsive dynamic prices according to state + city combination
  const cropData: CropPriceItemComputed[] = baselineCrops.map(crop => {
    const stateSeed = getHash(selectedState) % 18; // -9% to +9%
    const citySeed = getHash(selectedDistrict) % 12; // -6% to +6%
    const cropSeed = getHash(crop.id + selectedState) % 8; // -4% to +4%

    // Aggregate regional shifts
    const percentageShift = ((stateSeed - 9) + (citySeed - 6) + (cropSeed - 4)) / 100;
    const computedCurrent = Math.round(crop.basePrice * (1 + percentageShift));
    
    // Derived metrics
    const computedChange = Math.round(crop.baseChange * (1 + (percentageShift * 0.5)));
    const computedHigh = Math.round(computedCurrent * (1 + 0.05 + (getHash(crop.id + "high") % 4) / 100));
    const computedLow = Math.round(computedCurrent * (1 - 0.05 - (getHash(crop.id + "low") % 4) / 100));
    
    // Generate organic-looking sparkline coordinate array
    const step1 = getHash(crop.id + selectedDistrict + "1") % 40 + 20;
    const step2 = getHash(crop.id + selectedDistrict + "2") % 45 + 15;
    const step3 = getHash(crop.id + selectedDistrict + "3") % 50 + 25;
    const step4 = getHash(crop.id + selectedDistrict + "4") % 55 + 30;
    const trendPoints = [10, step1, 20, step2, 40, step3, 80, step4];

    // Volume fluctuates deterministically on city size
    const baseVolume = (getHash(crop.id + selectedState) % 25000) + 1200;
    const volumeString = `${baseVolume.toLocaleString('en-IN')} MT`;

    // Adaptive regional insights string
    let forecastString = "Stable demand matches daily market arrivals.";
    const totalShiftVal = stateSeed + citySeed - 15;

    if (percentageShift > 0.04) {
      forecastString = `Highly Bullish: Local supply deficits across ${selectedDistrict} APMC yards.`;
    } else if (percentageShift < -0.04) {
      forecastString = `Bearish pressure: High seasonal arrivals reported in ${selectedState} markets.`;
    } else if (crop.category === 'Cereals') {
      forecastString = `Highly stable: Governed under MSP benchmark rates for ${selectedState}.`;
    } else if (crop.category === 'Spices') {
      forecastString = `Export lead indicators: Demand at ${selectedDistrict} trading counters remains strong.`;
    } else if (crop.category === 'Vegetables') {
      forecastString = `Highly fluid: Wet weather triggers quick shelf-life sales in ${selectedDistrict}.`;
    }

    return {
      name: crop.name,
      category: crop.category,
      current: computedCurrent,
      unit: crop.unit,
      change: computedChange,
      trendPoints,
      high: computedHigh,
      low: computedLow,
      volume: volumeString,
      forecast: forecastString
    };
  });

  const filteredCrops = cropData.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const simulateUpdate = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto p-4 md:p-6" id="market-prices-dynamic-tab">
      
      {/* Location Filter & Search Master Dashboard */}
      <div className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] shadow-sm space-y-5">
        
        {/* Dynamic State - City Selection containing EVERY region from locations.ts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* State Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block ml-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#4C6B36]" /> Selected State
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl text-xs font-black text-gray-900 outline-none focus:border-[#4C6B36] transition-all"
            >
              {Object.keys(locations).map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* City / District Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block ml-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-600" /> Selected APMC Yard / City Part
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl text-xs font-black text-gray-900 outline-none focus:border-[#4C6B36] transition-all"
            >
              {locations[selectedState] ? (
                locations[selectedState].map(city => (
                  <option key={city} value={city}>{city}</option>
                ))
              ) : (
                <option value="">No districts configured</option>
              )}
            </select>
          </div>

        </div>

        {/* Search Input bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center pt-2 border-t border-dashed border-[#F0F7EB]">
          
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${filteredCrops.length} trade items indexed in ${selectedDistrict}...`}
              className="w-full bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#4C6B36] text-xs font-black"
            />
          </div>

          <button
            onClick={simulateUpdate}
            disabled={isSyncing}
            className="w-full sm:w-auto px-5 py-3.5 bg-[#4C6B36] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#3D562B] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Reload Index'}
          </button>

        </div>

      </div>

      {/* Regional Status Spotlight banner */}
      <div className="bg-[#FAFDF6] border border-[#E2F0D9] p-4.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <p className="font-semibold text-gray-700">
            Currently displaying dynamic pricing for <strong className="text-gray-950 font-black">{selectedDistrict} APMC Mandi</strong> in <strong className="text-[#4C6B36] font-black">{selectedState}</strong>.
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white border border-[#E2F0D9] px-2.5 py-1 rounded">
          Last updated: Today, 5:00 AM
        </span>
      </div>

      {/* Grid of Crops */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCrops.map((crop, idx) => {
          const isUp = crop.change >= 0;
          const pointsStr = crop.trendPoints.map((val, i) => `${i * 12},${100 - val}`).join(' ');

          return (
            <motion.div
              key={crop.name}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white p-5 rounded-[28px] border-2 border-[#E2F0D9] shadow-sm hover:border-[#4C6B36] transition-all group flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8px] bg-[#F0F7EB] text-[#4C6B36] px-2.5 py-1 rounded-md uppercase font-black tracking-wider border border-[#E2F0D9]">{crop.category}</span>
                  <h3 className="font-heading font-black text-base text-gray-950 mt-2.5 leading-tight group-hover:text-[#4C6B36] transition-colors">{crop.name}</h3>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{selectedDistrict} Local Spot Price</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-0.5 font-black text-xs font-mono">
                    {isUp ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                    <span className={isUp ? 'text-emerald-500' : 'text-rose-500'}>
                      {isUp ? '+' : ''}₹{crop.change}
                    </span>
                  </div>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Mandi Var.</p>
                </div>
              </div>

              {/* Middle trading block */}
              <div className="grid grid-cols-2 gap-3 items-center my-4 py-3 border-y border-dashed border-[#E2F0D9]">
                <div>
                  <p className="text-xl font-black text-gray-950 font-mono leading-none">
                    ₹{crop.current.toLocaleString('en-IN')}
                    <span className="text-[10px] text-gray-400 font-semibold uppercase"> / {crop.unit}</span>
                  </p>
                  <p className="text-[8px] text-gray-400 font-black mt-1 uppercase tracking-wider">APMC wholesale price</p>
                </div>

                {/* mini sparkline */}
                <div className="h-10 w-full flex items-center justify-end">
                  <svg className="w-20 h-10 overflow-visible" fill="none">
                    <polyline
                      fill="none"
                      stroke={isUp ? '#10b981' : '#f43f5e'}
                      strokeWidth="2.5"
                      points={pointsStr}
                    />
                  </svg>
                </div>
              </div>

              {/* Stats table */}
              <div className="grid grid-cols-2 gap-2 text-[9px] bg-[#FAFDF6] p-3.5 rounded-2xl border border-[#E2F0D9]">
                <div>
                  <span className="text-gray-400 uppercase font-black block tracking-wider">Range (High / Low)</span>
                  <span className="font-extrabold text-gray-950 font-mono">₹{crop.high.toLocaleString('en-IN')} / ₹{crop.low.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase font-black block tracking-wider">Daily Arrivals</span>
                  <span className="font-extrabold text-gray-950 font-mono">{crop.volume}</span>
                </div>
                <div className="col-span-2 pt-1.5 border-t border-gray-100/70">
                  <span className="text-[#4C6B36] uppercase font-black block tracking-wider text-[8px] flex items-center gap-1">
                    <Activity className="w-3 h-3 animate-pulse" /> Climate & Demand advisory
                  </span>
                  <span className="font-semibold text-gray-700 leading-snug block mt-0.5">{crop.forecast}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredCrops.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-400 font-medium mt-3 italic">No matching Mandi crops found in {selectedDistrict} index.</p>
        </div>
      )}

    </div>
  );
}
