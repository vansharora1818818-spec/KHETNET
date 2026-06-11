import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  MapPin, 
  Phone, 
  Layers, 
  Share2, 
  Bell, 
  Settings, 
  FileSpreadsheet, 
  ShieldAlert, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Coins, 
  ExternalLink,
  Award,
  LogOut,
  Sparkles,
  ClipboardCheck
} from 'lucide-react';
import { SubscriptionPlans } from './SubscriptionPlans';
import KhetKhata from './KhetKhata';

interface FarmerProfileProps {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  t: any;
  onLogout: () => void;
  lang: string;
  setLang: (lang: any) => void;
  triggerPlanChoice: (plan: any, price: any) => void;
}

export default function FarmerProfile({ 
  user, 
  setUser, 
  t, 
  onLogout, 
  lang, 
  setLang,
  triggerPlanChoice
}: FarmerProfileProps) {
  const [activeMoreSection, setActiveMoreSection] = useState<'none' | 'analytics' | 'subscription' | 'referral' | 'notifications' | 'settings' | 'account'>('none');
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [notifSms, setNotifSms] = useState(true);
  const [notifWeather, setNotifWeather] = useState(true);
  const [notifMandi, setNotifMandi] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`KHETNET-${user.id ? user.id.slice(0, 5).toUpperCase() : 'GROW'}`);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-4 space-y-6">
      
      {/* 1. Core Profile Card Details */}
      <div className="bg-gradient-to-br from-[#FAFDF6] to-white border-2 border-[#E2F0D9] p-6.5 rounded-[35px] text-left shadow-sm relative overflow-hidden flex items-center gap-4">
        <div className="w-16 h-16 bg-[#4C6B36] text-white text-2xl font-black rounded-2xl flex items-center justify-center shadow-md border-2 border-white uppercase shrink-0">
          {user.name ? user.name[0] : 'K'}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] bg-[#E2F0D9] text-[#2C411E] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest inline-block mb-1">
            {user.role === 'farmer' ? 'Verified Farmer / किसान' : 'Wholesale Wholesaler'}
          </span>
          <h3 className="text-xl font-heading font-black text-gray-950 truncate leading-tight">
            {user.name || 'KhetNet User'}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500 font-semibold">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" /> {user.region || 'Amritsar'}, {user.state || 'Punjab'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> +91 {user.mobile || '9988776655'}
            </span>
          </div>
        </div>
      </div>

      {/* Subscription details ticker */}
      <div className="bg-neutral-900 text-white p-4.5 rounded-[24px] text-left shadow-sm flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-[8px] bg-emerald-600 text-white font-black uppercase tracking-wider px-2 py-0.5 rounded">Active Tier</span>
          <p className="text-sm font-black text-white capitalize">{user.subscriptionTier ? user.subscriptionTier.replace('_', ' ') : 'Free Member Tier'}</p>
        </div>
        <button 
          onClick={() => setActiveMoreSection(activeMoreSection === 'subscription' ? 'none' : 'subscription')}
          className="py-1.5 px-3 bg-white text-gray-900 hover:bg-neutral-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
        >
          {activeMoreSection === 'subscription' ? 'Close Plans' : 'View Billing'}
        </button>
      </div>

      {/* 2. ADVANCED FEATURES ("Profile -> More") */}
      <div className="space-y-3">
        <h3 className="text-xs text-gray-400 font-extrabold uppercase tracking-widest text-left block">
          ⚙️ More / अधिक विकल्प (Advanced Control panel)
        </h3>

        {/* Accordions map */}
        <div className="space-y-2 text-left">
          
          {/* A. Analytics & Reports */}
          <div className="border border-[#E2F0D9] rounded-2xl bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveMoreSection(activeMoreSection === 'analytics' ? 'none' : 'analytics')}
              className="w-full p-4 flex items-center justify-between hover:bg-[#FAFDF6] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📈</span>
                <div>
                  <h4 className="text-xs font-black text-gray-950 uppercase tracking-wide">Analytics & Reports</h4>
                  <p className="text-[10px] text-gray-400 font-bold leading-none mt-0.5">Profit stats, crop ledger logs & expense audit</p>
                </div>
              </div>
              {activeMoreSection === 'analytics' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            <AnimatePresence>
              {activeMoreSection === 'analytics' && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden bg-[#FAFDF6] border-t border-[#E2F0D9]"
                >
                  <div className="p-4 space-y-4">
                    <div className="p-4 bg-white border border-[#E2F0D9] rounded-xl space-y-3">
                      <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-black uppercase tracking-wider block w-max">Smart Crop Audit report</span>
                      <p className="text-xs font-bold text-gray-800 leading-normal">
                        Your highest expenditure block is currently listed as <b>Fertilizers (खाद)</b>. Keep an eye on regional climate warnings to avoid rain-wash pesticide waste.
                      </p>
                      
                      {/* Fake spreadsheet generator trigger */}
                      <button
                        onClick={() => alert("Excel AgriSpreadsheet statement compiled. Downloading to device...")}
                        className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-neutral-800 transition-all active:scale-95"
                      >
                        <FileSpreadsheet className="w-4 h-4" /> Download Complete Ledger (Spreadsheet)
                      </button>
                    </div>

                    {/* Render KhetKhata ledger */}
                    <div className="p-2 border border-gray-100 rounded-xl bg-white">
                      <KhetKhata user={user} t={t} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* B. Subscription Management */}
          <div className="border border-[#E2F0D9] rounded-2xl bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveMoreSection(activeMoreSection === 'subscription' ? 'none' : 'subscription')}
              className="w-full p-4 flex items-center justify-between hover:bg-[#FAFDF6] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👑</span>
                <div>
                  <h4 className="text-xs font-black text-gray-950 uppercase tracking-wide">Subscription Management</h4>
                  <p className="text-[10px] text-gray-400 font-bold leading-none mt-0.5">Upgrade tiers, manage auto-billing, unlock wholesalers direct line</p>
                </div>
              </div>
              {activeMoreSection === 'subscription' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            <AnimatePresence>
              {activeMoreSection === 'subscription' && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden bg-[#FAFDF6] border-t border-[#E2F0D9]"
                >
                  <div className="p-4">
                    <SubscriptionPlans 
                      t={t} 
                      currentUser={user} 
                      onSelectPlan={triggerPlanChoice} 
                      onBackToHome={() => setActiveMoreSection('none')} 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* C. Referral Program */}
          <div className="border border-[#E2F0D9] rounded-2xl bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveMoreSection(activeMoreSection === 'referral' ? 'none' : 'referral')}
              className="w-full p-4 flex items-center justify-between hover:bg-[#FAFDF6] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🤝</span>
                <div>
                  <h4 className="text-xs font-black text-gray-950 uppercase tracking-wide">Referral Program (मित्रां नु जोड़ें)</h4>
                  <p className="text-[10px] text-gray-400 font-bold leading-none mt-0.5">Invite neighbors & earn 500 fuel coins on every enrollment</p>
                </div>
              </div>
              {activeMoreSection === 'referral' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            <AnimatePresence>
              {activeMoreSection === 'referral' && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden bg-[#FAFDF6] border-t border-[#E2F0D9]"
                >
                  <div className="p-5.5 space-y-4">
                    <div className="bg-white border border-[#E2F0D9] p-4.5 rounded-2xl space-y-3.5">
                      <div className="flex justify-between items-center bg-amber-50 p-3 rounded-xl border border-amber-200">
                        <span className="text-xs font-bold font-serif text-amber-900">Your Shareable Code:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-black tracking-widest bg-white py-1 px-2.5 rounded border border-amber-300 font-mono">
                            KHETNET-{user.id ? user.id.slice(0, 5).toUpperCase() : 'GROW'}
                          </code>
                          <button
                            onClick={handleCopyCode}
                            className="p-1 px-2 bg-amber-500 text-white rounded text-[10px] font-black uppercase tracking-wider"
                          >
                            {copiedReferral ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-center">
                        <p className="text-xs font-bold text-gray-800">
                          How it works:
                        </p>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                          Every time a nearby farmer registers with your code and submits their first mandi listing, you both get <b>500 premium reward coins</b> valid for freight carrier logistics discounts.
                        </p>
                      </div>

                      {/* Achievements gauge */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold">
                          <span>Invitations Completed: 3 farmers</span>
                          <span className="text-gray-800">Goal: 5 farmers for 1 FREE Delivery</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 w-[60%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* D. Alerts & Notifications */}
          <div className="border border-[#E2F0D9] rounded-2xl bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveMoreSection(activeMoreSection === 'notifications' ? 'none' : 'notifications')}
              className="w-full p-4 flex items-center justify-between hover:bg-[#FAFDF6] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <div>
                  <h4 className="text-xs font-black text-gray-950 uppercase tracking-wide">Notifications & Alerts</h4>
                  <p className="text-[10px] text-gray-400 font-bold leading-none mt-0.5">Toggle instant SMS alerts for wholesale crop bids & rain alarms</p>
                </div>
              </div>
              {activeMoreSection === 'notifications' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            <AnimatePresence>
              {activeMoreSection === 'notifications' && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden bg-[#FAFDF6] border-t border-[#E2F0D9]"
                >
                  <div className="p-5 space-y-4 bg-white">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <div>
                        <h5 className="text-xs font-black text-gray-950">SMS Bid Updates</h5>
                        <p className="text-[10px] text-gray-400 font-bold">Receive instant phone SMS when wholesalers quote on your listings</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={notifSms}
                        onChange={() => setNotifSms(!notifSms)}
                        className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <div>
                        <h5 className="text-xs font-black text-gray-950">Urgent Rain & Climate Alarms</h5>
                        <p className="text-[10px] text-gray-400 font-bold">Loud automated alarm when soil moisture or downpours threaten spray windows</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={notifWeather}
                        onChange={() => setNotifWeather(!notifWeather)}
                        className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <div>
                        <h5 className="text-xs font-black text-gray-950">Daily APMC Price Indices</h5>
                        <p className="text-[10px] text-gray-400 font-bold">Daily morning summary of your favorite crop prices via regional charts</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={notifMandi}
                        onChange={() => setNotifMandi(!notifMandi)}
                        className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* E. Advanced Settings */}
          <div className="border border-[#E2F0D9] rounded-2xl bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveMoreSection(activeMoreSection === 'settings' ? 'none' : 'settings')}
              className="w-full p-4 flex items-center justify-between hover:bg-[#FAFDF6] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚙️</span>
                <div>
                  <h4 className="text-xs font-black text-gray-950 uppercase tracking-wide">Advanced Settings</h4>
                  <p className="text-[10px] text-gray-400 font-bold leading-none mt-0.5">Change languages, edit regional settings & climate offsets</p>
                </div>
              </div>
              {activeMoreSection === 'settings' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            <AnimatePresence>
              {activeMoreSection === 'settings' && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden bg-[#FAFDF6] border-t border-[#E2F0D9]"
                >
                  <div className="p-4 space-y-4">
                    <div className="bg-white p-4.5 border border-[#E2F0D9] rounded-2xl space-y-3">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase block tracking-wider">Quick Language Switcher</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { code: 'hi', label: 'हिंदी' },
                          { code: 'pa', label: 'ਪੰਜਾਬੀ' },
                          { code: 'en', label: 'English' }
                        ].map(l => (
                          <button
                            key={l.code}
                            onClick={() => {
                              setLang(l.code);
                              localStorage.setItem('khetnet_lang', l.code);
                              alert(`App dialect updated to: ${l.label}`);
                            }}
                            className={`py-2 px-1 text-center font-black rounded-lg border text-xs ${lang === l.code ? 'bg-[#F0F7EB] border-[#4C6B36] text-gray-950' : 'bg-white border-gray-100 text-gray-600'}`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* F. Account Management */}
          <div className="border border-[#E2F0D9] rounded-2xl bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveMoreSection(activeMoreSection === 'account' ? 'none' : 'account')}
              className="w-full p-4 flex items-center justify-between hover:bg-[#FAFDF6] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="text-xs font-black text-[#A12B2B] uppercase tracking-wide">Account Management</h4>
                  <p className="text-[10px] text-gray-400 font-bold leading-none mt-0.5">Toggle whistleblower membership, lock profile, deactivate or delete account</p>
                </div>
              </div>
              {activeMoreSection === 'account' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            <AnimatePresence>
              {activeMoreSection === 'account' && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden bg-[#FFF5F5] border-t border-[#FCDCDC]"
                >
                  <div className="p-4 space-y-3">
                    <div className="p-4 bg-white border border-[#FCDCDC] rounded-xl text-xs space-y-3">
                      <span className="text-[9px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-black uppercase tracking-wider block w-max">Destructive actions</span>
                      <p className="font-semibold text-gray-650">Once deactivated, your active harvest listings will be instantly hidden from the regional wholesaler feed board.</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to temporarily suspend your KhetNet listings?")) {
                              setUser((prev: any) => ({ ...prev, isSuspended: true }));
                              alert("Profile Listings Hidden.");
                            }
                          }}
                          className="py-2.5 bg-gray-50 border border-gray-200 text-[10px] font-black uppercase tracking-wider rounded-xl text-gray-600 hover:bg-gray-100 transition-all text-center"
                        >
                          Hide Listings
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Confirm permanently deleting your KhetNet agricultural credential profile? This action is irreversible.")) {
                              onLogout();
                            }
                          }}
                          className="py-2.5 bg-red-650 hover:bg-red-750 text-white border border-red-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-center"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="w-full py-4.5 border border-[#FCDCDC] text-red-650 bg-[#FFF5F5]/40 hover:bg-red-50 hover:text-red-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        <LogOut className="w-4 h-4" /> Logout from active workspace
      </button>

    </div>
  );
}
