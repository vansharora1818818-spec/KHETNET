import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Umbrella, DollarSign, Percent, Shield, ArrowUpRight, HelpCircle, RefreshCw, CheckCircle, Award } from 'lucide-react';
import { db } from '../App';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';

interface InsuranceProps {
  user: any;
  t: any;
}

export function CropInsurance({ user, t }: InsuranceProps) {
  const [cropName, setCropName] = useState('Basmati Rice');
  const [acreage, setAcreage] = useState(5);
  const [sumAssured, setSumAssured] = useState(250000);
  const [selectedProvider, setSelectedProvider] = useState('pmfby');
  const [enrolledPolicies, setEnrolledPolicies] = useState<any[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [syncLoading, setSyncLoading] = useState(true);

  const riskFactors = {
    pmfby: { name: 'PMFBY (Govt of India)', premiumRate: 0.015, description: 'National government subsidized multi-peril insurance.', claimsRatio: '96.4%' },
    icici: { name: 'ICICI Lombard Agri Guard', premiumRate: 0.035, description: 'Direct weather index coverage against temperature/rain anomalies.', claimsRatio: '92.1%' },
    hdfc: { name: 'HDFC ERGO Crop Shield', premiumRate: 0.040, description: 'Acreage-based post-harvest rain and hail damage insurance.', claimsRatio: '94.8%' },
    sbi: { name: 'SBI General Rural Suraksha', premiumRate: 0.030, description: 'Localized pest and drought damage cover.', claimsRatio: '89.5%' }
  };

  const currentProvider = riskFactors[selectedProvider as keyof typeof riskFactors];
  const calculatedPremium = Math.round(sumAssured * currentProvider.premiumRate * (acreage / 10));
  const khetnetCommission = Math.round(calculatedPremium * 0.02); // 2% of premium as platform core commission monetization

  useEffect(() => {
    if (!user.id) return;
    const q = query(
      collection(db, 'crop_insurances'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEnrolledPolicies(docs);
      setSyncLoading(false);
    }, (error) => {
      console.warn("Insurance snaps blocked: fallback.", error);
      setSyncLoading(false);
    });

    return () => unsubscribe();
  }, [user.id]);

  const handleEnrollPolicy = async () => {
    if (!user.id) return;
    setIsEnrolling(true);
    try {
      const insuranceData = {
        userId: user.id,
        userName: user.name || 'Farmer',
        policyType: `Multi-Peril Crop Shield (Grade A)`,
        providerName: currentProvider.name,
        premiumRupees: calculatedPremium,
        sumAssuredRupees: sumAssured,
        cropName: cropName,
        acreage: acreage,
        status: 'Active Underwriting',
        commissionRupees: khetnetCommission,
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'crop_insurances'), insuranceData);
      alert(`Success! Policy bought from ${currentProvider.name}. Initial premium payment generated commission share. Your certificate is stored securely.`);
    } catch (err: any) {
      console.error(err);
      alert("Policy acquisition failed. Confirm network connectivity.");
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 space-y-6" id="crop-insurance-system-portal">
      <div className="space-y-1">
        <span className="p-1 px-2.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[9px] uppercase tracking-widest inline-flex items-center gap-1">
          <Umbrella className="w-3.5 h-3.5 fill-emerald-50" /> National Crop Insurance Schemes
        </span>
        <h2 className="text-2xl font-heading font-black text-gray-950 tracking-tight leading-none italic">Crop Insurance Section</h2>
        <p className="text-xs text-gray-400 font-medium font-serif">Protect your farm outputs against weather fluctuation, unseasonal rains, and localized pests with licensed underwriters.</p>
      </div>

      {/* Insurance Calculator Grid */}
      <div className="bg-white rounded-3xl border-2 border-[#E2F0D9] p-6 space-y-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          
          {/* Crop select */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block ml-1">Cultivated Crop</label>
            <select
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              className="w-full p-3 bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl text-xs font-black outline-none focus:border-[#4C6B36]"
            >
              <option value="Basmati Rice">Basmati Rice</option>
              <option value="Premium Wheat">Premium Wheat</option>
              <option value="Kapas Cotton">Kapas Cotton</option>
              <option value="Dry Turmeric">Dry Turmeric</option>
              <option value="Yellow Mustard">Yellow Mustard Seeds</option>
            </select>
          </div>

          {/* Acreage */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block ml-1">Cultivated Acreage (Acres)</label>
            <input
              type="number"
              min={1}
              value={acreage}
              onChange={(e) => setAcreage(Math.max(1, Number(e.target.value)))}
              className="w-full p-3 bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl text-xs font-black text-center outline-none focus:border-[#4C6B36]"
            />
          </div>

          {/* Sum Assured coverage amount */}
          <div className="col-span-2 space-y-1">
            <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block ml-1">Sum Assured Valuation Target (₹)</label>
            <select
              value={sumAssured}
              onChange={(e) => setSumAssured(Number(e.target.value))}
              className="w-full p-3 bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl text-xs font-black outline-none focus:border-[#4C6B36]"
            >
              <option value={100000}>₹1,00,000 (Basic Protection)</option>
              <option value={250000}>₹2,50,000 (Mandi Standard Coverage)</option>
              <option value={500000}>₹5,00,000 (Premium Yield Guarantee)</option>
              <option value={1000000}>₹10,00,000 (Mega Plantation Insurance)</option>
            </select>
          </div>

        </div>

        {/* Provider selection tabs */}
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block ml-1">Select Underwriting Partner Corp</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(riskFactors).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedProvider(key)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${selectedProvider === key ? 'border-[#4C6B36] bg-[#4C6B36]/5 text-[#4C6B36] shadow-sm' : 'border-gray-100 hover:border-[#E2F0D9] text-gray-600'}`}
              >
                <div className="flex justify-between items-baseline w-full">
                  <h4 className="text-[11px] font-black truncate">{info.name}</h4>
                  <span className="text-[8px] bg-white border border-gray-105 px-1.5 py-0.5 rounded font-black text-gray-400 shrink-0">{info.claimsRatio} Claims</span>
                </div>
                <p className="text-[9px] text-gray-400 font-semibold leading-snug mt-2 truncate">{info.description}</p>
                <span className="text-[9px] font-mono font-extrabold text-[#4C6B36] mt-1">Rate: {(info.premiumRate * 100).toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Calculation Deck */}
        <div className="bg-[#FAFDF6] border border-[#E2F0D9] p-5 rounded-2xl space-y-3.5 text-xs font-serif">
          <div className="flex justify-between items-center text-sm pb-2 border-b border-dashed border-[#E2F0D9]">
            <span className="font-extrabold text-gray-900">Total Yield Underwritten:</span>
            <span className="font-black text-gray-950 font-mono">₹{sumAssured.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-medium">Estimated Premium Due:</span>
            <span className="font-black text-gray-900 font-mono">₹{calculatedPremium.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold italic">
            <span>KhetNet brokerage share included (2%):</span>
            <span>₹{khetnetCommission} commission</span>
          </div>

          <button
            onClick={handleEnrollPolicy}
            disabled={isEnrolling}
            className="w-full py-4 bg-[#4C6B36] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#3D562B] transition-colors shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            {isEnrolling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> PROVISIONING RISK POLICY ACTIVE...
              </>
            ) : (
              <>
                BUY SHIELD POLICY NOW <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active policies registry */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider block ml-1">Your Registered Active Insurance Policies ({enrolledPolicies.length})</h3>
        
        {syncLoading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#E2F0D9] flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 text-[#4C6B36] animate-spin" />
            <p className="text-[10px] font-black text-gray-400 animate-pulse uppercase tracking-wider">Syncing historical policies...</p>
          </div>
        ) : enrolledPolicies.length === 0 ? (
          <div className="p-8 border border-dashed border-gray-105 rounded-[28px] text-center text-gray-400 bg-white">
            <Umbrella className="w-10 h-10 mx-auto text-gray-200 mb-2" />
            <p className="text-xs font-semibold">No crop protection coverages are active for your account currently.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {enrolledPolicies.map(policy => (
              <div key={policy.id} className="bg-white rounded-2xl border border-[#E2F0D9] p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-gray-950 uppercase tracking-wide">{policy.policyType}</h4>
                    <p className="text-[9px] text-[#4C6B36] font-bold uppercase tracking-wider mt-0.5">{policy.providerName}</p>
                  </div>
                  <span className="p-1 px-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 font-sans">
                    <Shield className="w-3.5 h-3.5 fill-emerald-50" /> {policy.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-serif bg-[#FAFDF6] rounded-xl p-3 border border-gray-100">
                  <div>
                    <span className="text-[8px] text-gray-400 font-black uppercase">Insured Variety</span>
                    <p className="font-extrabold text-gray-900">{policy.cropName} ({policy.acreage || 5} Acres)</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-400 font-black uppercase">Total Cover Sum</span>
                    <p className="font-black text-gray-950 font-mono">₹{policy.sumAssuredRupees?.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-serif font-semibold text-gray-500">
                  <span>Premium Rubies Paid: <strong className="text-gray-900 font-mono">₹{policy.premiumRupees}</strong></span>
                  <span>Registered: {new Date(policy.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
