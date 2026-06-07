import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Activity, 
  RefreshCw, 
  ChevronRight,
  Info
} from 'lucide-react';
import { db } from '../App';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { locations } from '../locations';

interface LogisticsProps {
  user: any;
  t: any;
}

export function KhetNetLogistics({ user, t }: LogisticsProps) {
  const [pickupDistrict] = useState(user.region || 'Amritsar');
  const [dropoffDistrict, setDropoffDistrict] = useState('');
  const [vehicleType, setVehicleType] = useState<'ace' | 'bolero' | 'eicher' | 'container'>('ace');
  const [bookingLogs, setBookingLogs] = useState<any[]>([]);
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  // States available in the user's selected state
  const userState = user?.state || 'Punjab';
  const districts = (locations[userState] || locations['Punjab'] || []).filter(d => d !== pickupDistrict);

  const vehicleRates = {
    ace: { name: 'Tata Ace (Small)', capacity: '750 Kg', rate: 14, base: 450, emoji: '🚐' },
    bolero: { name: 'Bolero Pickup (Medium)', capacity: '1.5 Tons', rate: 20, base: 750, emoji: '🛻' },
    eicher: { name: 'Eicher 6-Wheeler (Heavy)', capacity: '5.0 Tons', rate: 29, base: 1200, emoji: '🚚' },
    container: { name: 'Leyland 10-Wheeler (Mega)', capacity: '10.0 Tons', rate: 42, base: 2200, emoji: '🚛' },
  };

  // Re-estimate prices when inputs vary
  useEffect(() => {
    if (dropoffDistrict) {
      // Create a stable seed distance based on string hashes to keep it realistic
      const hash = dropoffDistrict.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const computedDist = (hash % 240) + 25; // 25km to 265km
      setEstimatedDistance(computedDist);

      const rateInfo = vehicleRates[vehicleType];
      const freightCost = rateInfo.base + (computedDist * rateInfo.rate);
      setEstimatedPrice(freightCost);
    } else {
      setEstimatedDistance(0);
      setEstimatedPrice(0);
    }
  }, [dropoffDistrict, vehicleType]);

  // Real-time synchronization of bookings from Firebase
  useEffect(() => {
    if (!user.id) return;
    const q = query(
      collection(db, 'logistics_bookings'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookingLogs(logs);
    }, (error) => {
      console.warn("Logistics real-time snapshot blocked: falling back.", error);
    });

    return () => unsubscribe();
  }, [user.id]);

  const handleBookFreight = async () => {
    if (!dropoffDistrict || !user.id) return;
    setIsBookingInProgress(true);

    try {
      const selectedVehicle = vehicleRates[vehicleType];
      const bookingData = {
        userId: user.id,
        userName: user.name || 'Trader',
        userMobile: user.mobile || '9988776655',
        pickup: pickupDistrict,
        dropoff: dropoffDistrict,
        vehicleName: selectedVehicle.name,
        vehicleCapacity: selectedVehicle.capacity,
        distanceKm: estimatedDistance,
        priceRupees: estimatedPrice,
        status: 'Dispatched', // Steps: Dispatched -> En Route -> Loading -> Completed
        driverName: ['Sukhbir Singh', 'Harpreet Deol', 'Ramesh Kumar', 'Mani Gowda', 'Vijay Naidu'][Math.floor(Math.random() * 5)],
        driverPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        consignmentNo: `KNET-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'logistics_bookings'), bookingData);
      setDropoffDistrict('');
      alert(`Booking Successful! Carrier Consignment ${bookingData.consignmentNo} has been assigned to Driver ${bookingData.driverName}.`);
    } catch (e) {
      console.error(e);
      alert("Freight dispatch failed. Please verify stable connectivity.");
    } finally {
      setIsBookingInProgress(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 space-y-6" id="logistics-root">
      {/* Header and branding */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="p-1 px-2.5 rounded bg-blue-50 text-blue-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Direct Freight Carriage
          </span>
        </div>
        <h2 className="text-2xl font-heading font-black text-gray-950 tracking-tight leading-none italic">KhetNet Transport</h2>
        <p className="text-xs text-gray-400 font-medium">Instantly book reliable country carriers directly to the mandi or warehouse.</p>
      </div>

      {/* Booking Form Card */}
      <div className="bg-white rounded-3xl border-2 border-[#E2F0D9] p-6 space-y-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          {/* Pickup */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block ml-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#4C6B36]" /> Consignment Origin
            </label>
            <div className="w-full p-3.5 bg-gray-50 border border-transparent rounded-xl text-xs font-black text-gray-600">
              {pickupDistrict} (Local)
            </div>
          </div>

          {/* Place of delivery */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block ml-1 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-blue-600" /> Destination Mandi
            </label>
            <select
              value={dropoffDistrict}
              onChange={(e) => setDropoffDistrict(e.target.value)}
              className="w-full p-3.5 bg-white border border-[#E2F0D9] rounded-xl text-xs font-black text-gray-900 outline-none focus:border-blue-500"
            >
              <option value="">Select Target District</option>
              {districts.map(dst => <option key={dst} value={dst}>{dst}</option>)}
            </select>
          </div>
        </div>

        {/* Vehicle Selection list */}
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block ml-1">Select Delivery Fleet Carriage</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(vehicleRates).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setVehicleType(key as any)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${vehicleType === key ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm' : 'border-gray-100 hover:border-blue-200 text-gray-600'}`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className="text-xl">{info.emoji}</span>
                  <span className="text-[9px] bg-white border border-gray-100 px-1.5 py-0.5 rounded font-black text-gray-500">{info.capacity}</span>
                </div>
                <div className="mt-3">
                  <h4 className="text-[11px] font-black truncate">{info.name}</h4>
                  <p className="text-[9px] text-gray-400 font-semibold">₹{info.rate}/Km + base</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Estimator Panel */}
        {dropoffDistrict && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Estimated Dist.</p>
                <h4 className="text-sm font-black text-gray-950">{estimatedDistance} Kilometers</h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Estimated Freight Cost</p>
                <h4 className="text-lg font-black text-blue-600 flex items-center justify-end"><DollarSign className="w-4 h-4 shrink-0 -mr-0.5" />{estimatedPrice}</h4>
              </div>
            </div>

            <div className="p-3 bg-white/70 rounded-xl text-[10px] text-gray-500 leading-relaxed font-semibold flex items-start gap-2">
              <Info className="w-4.5 h-4.5 text-blue-600 shrink-0" />
              <span>Fare includes loading labor charges, regional highway toll taxes, and transport GST clearances. Guaranteed spot rate locking.</span>
            </div>

            <button
              onClick={handleBookFreight}
              disabled={isBookingInProgress}
              className="w-full py-4.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              {isBookingInProgress ? (
                <>
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" /> DISPATCHING CARRIER...
                </>
              ) : (
                <>
                  BOOK CARRIER CARRIAGE <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>

      {/* Booking Logs (Persisted across sessions) */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider block ml-1 flex items-center justify-between">
          <span>Active Transport Shipments ({bookingLogs.length})</span>
          <span className="text-[9px] text-blue-600 flex items-center gap-1 cursor-pointer hover:underline" onClick={() => localStorage.clear()}><Activity className="w-3 h-3 animate-pulse" /> Live updates</span>
        </h3>

        {bookingLogs.length === 0 ? (
          <div className="p-8 border border-dashed border-gray-100 rounded-[28px] text-center text-gray-400 bg-white space-y-2">
            <Truck className="w-10 h-10 mx-auto text-gray-200" />
            <p className="text-xs font-semibold">No active freight dispatches found for your account.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookingLogs.map(log => (
              <div key={log.id} className="bg-white rounded-2xl border border-[#E2F0D9] p-5 space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-50">
                  <div>
                    <h4 className="text-xs font-black text-gray-950 uppercase tracking-wide">Consignment: {log.consignmentNo}</h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{log.vehicleName}</p>
                  </div>
                  <span className="p-1 px-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 animate-pulse">
                    <Activity className="w-3.5 h-3.5" /> {log.status}
                  </span>
                </div>

                {/* Tracker Steps */}
                <div className="grid grid-cols-4 gap-1 text-center relative pt-2">
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100 z-0"></div>
                  {[
                    { label: 'Dispatched', active: true },
                    { label: 'En-Route', active: true },
                    { label: 'Loading', active: false },
                    { label: 'Delivered', active: false },
                  ].map((step, sIdx) => (
                    <div key={step.label} className="relative z-10 flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step.active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {step.active ? '✓' : sIdx + 1}
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 mt-2">{step.label}</span>
                    </div>
                  ))}
                </div>

                {/* Driver information */}
                <div className="pt-2 bg-gray-50 rounded-xl p-3.5 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Assigned Driver</p>
                    <p className="font-extrabold text-gray-950 mt-0.5">{log.driverName}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Driver Contact</p>
                    <a href={`tel:${log.driverPhone}`} className="font-extrabold text-blue-600 mt-0.5 hover:underline block">{log.driverPhone}</a>
                  </div>
                  <div className="col-span-2 border-t border-gray-100 pt-2.5 flex justify-between items-center text-[10px] font-black">
                    <span className="text-gray-400 uppercase tracking-widest">{log.pickup} → {log.dropoff} ({log.distanceKm || 45} Km)</span>
                    <span className="text-gray-900 flex items-center"><DollarSign className="w-3.5 h-3.5 shrink-0" />{log.priceRupees}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
