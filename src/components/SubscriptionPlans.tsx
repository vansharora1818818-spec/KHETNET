import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Star, 
  Trophy, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  Percent, 
  TrendingUp, 
  HelpCircle, 
  X, 
  Building2, 
  Users2, 
  CheckCircle2, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock
} from 'lucide-react';
import { db } from '../App';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SubscriptionPlansProps {
  t: any;
  currentUser: any;
  onSelectPlan: (tier: any, price: number, isTrialActive?: boolean) => void;
  onBackToHome?: () => void;
}

export function SubscriptionPlans({ t, currentUser, onSelectPlan, onBackToHome }: SubscriptionPlansProps) {
  // Toggle for billing cycle: true = Annual (20% savings), false = Monthly
  const [isAnnual, setIsAnnual] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
  // Enterprise form status
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [interestType, setInterestType] = useState('FPO collaboration');
  const [isSubmittingEnterprise, setIsSubmittingEnterprise] = useState(false);
  const [enterpriseFeedback, setEnterpriseFeedback] = useState<string | null>(null);

  // Downgrade confirmation status
  const [downgradeTarget, setDowngradeTarget] = useState<any | null>(null);

  // Define the plans list with precise specifications
  const plans = [
    {
      id: 'free_farmer' as const,
      name: 'Free Farmer Plan',
      priceMonthly: 0,
      priceAnnual: 0,
      period: 'Forever Useful',
      accent: 'border-[#E2F0D9] bg-white text-gray-900',
      tagline: 'Perfect for smallholder growers wanting baseline Agmarket rate tracking.',
      badge: null,
      icon: <Zap className="w-5 h-5 text-gray-400" />,
      features: [
        'National APMC Mandi prices',
        'Daily regional weather updates',
        'Grower social community access',
        'Basic multilingual AI assistant',
        'Basic digital crop logs & bookkeeping',
        'Limited to 5 AI chatbot queries/day',
      ],
      cta: 'Free Tier Active',
      descriptionAlt: 'Base features',
      isFarmerPlan: true,
    },
    {
      id: 'premium_farmer' as const,
      name: 'Premium Farmer Plan',
      priceMonthly: 49,
      priceAnnual: 39, // equivalent to ~₹468 yearly (saving ₹120)
      period: 'month',
      accent: 'border-[#4C6B36] bg-emerald-50/20 ring-2 ring-[#4C6B36]/30 shadow-xl relative',
      tagline: 'Ideal for tech-forward growers seeking smart analytics & continuous expert guidance.',
      badge: 'Most Popular',
      badgeStyle: 'bg-[#4C6B36] text-white',
      icon: <Star className="w-5 h-5 text-amber-500 fill-amber-500" />,
      features: [
        'Unlimited AI queries with no daily caps',
        'Precision yield & productivity predictions',
        'AI crop disease scanner & instant fixes',
        'Smart regional sowing recommendations',
        'Interactive harvest scheduler & tracker',
        'Advanced monthly financial analytics',
        'Priority agronomy assistance support',
      ],
      cta: 'Start 30-Day Free Trial',
      descriptionAlt: 'Risk-Free Trial',
      isFarmerPlan: true,
      hasTrial: true,
    },
    {
      id: 'pro_farmer' as const,
      name: 'Pro Farmer Plan',
      priceMonthly: 99,
      priceAnnual: 79, // equivalent to ~₹948 yearly
      period: 'month',
      accent: 'border-yellow-600/30 bg-yellow-50/5 shadow-lg relative',
      tagline: 'Advanced automation, sound-based voice advisors, and ledger management.',
      badge: 'Best Value',
      badgeStyle: 'bg-amber-600 text-white',
      icon: <Trophy className="w-5 h-5 text-amber-600 fill-amber-600" />,
      features: [
        'Everything in Premium Farmer Plan',
        'KhetNet Vernacular Voice AI assistant',
        'AI automated crop bookkeeping audits',
        'Advanced agricultural profit tracking',
        'Comprehensive regional expense audits',
        'Exportable ledger reports (Ready for Bank/FPO)',
      ],
      cta: 'Upgrade to Pro Farmer',
      descriptionAlt: 'Professional level',
      isFarmerPlan: true,
    },
    {
      id: 'trader_wholesaler' as const,
      name: 'Trader / Wholesaler',
      priceMonthly: 299,
      priceAnnual: 239, // equivalent to ~₹2868 yearly
      period: 'month',
      accent: 'border-blue-900/20 bg-blue-50/10 shadow-lg relative',
      tagline: 'Optimized procurement tools for wholesale mandates, commission agents, and bulk traders.',
      badge: 'Business Partner',
      badgeStyle: 'bg-blue-850 text-white',
      icon: <Users2 className="w-5 h-5 text-blue-600" />,
      features: [
        'Place unlimited bulk mandi crop buy offers',
        'Unlocked farmer profiles & direct calling',
        'Priority freight matchmaking & cargo logistics',
        'Wholesaler verified green checkmark badge',
        'Enterprise crop quality procurement analytics',
        'Premium AI trade matching assistant service',
      ],
      cta: 'Upgrade to Trader Plan',
      descriptionAlt: 'Mandi Traders choice',
      isFarmerPlan: false,
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise Plan',
      priceMonthly: -1, // custom
      priceAnnual: -1,
      period: 'Custom Quotation',
      accent: 'border-neutral-900/10 bg-neutral-900/[0.02] shadow-sm',
      tagline: 'Bespoke integration modules for FPOs, cooperative unions, and export buyers.',
      badge: 'Institutional',
      badgeStyle: 'bg-neutral-900 text-white',
      icon: <Building2 className="w-5 h-5 text-neutral-800" />,
      features: [
        'Custom white-labeled regional mandi dashboard',
        'API keys configuration for crop ERP services',
        'Multi-grower group billing (up to 500 members)',
        'Custom local regional alerts broadcasting channel',
        'Dedicated agronomy accounts advisory manager',
        'FPO trading assistance panel setup',
      ],
      cta: 'Request Custom Quote',
      descriptionAlt: 'Customized solutions',
      isFarmerPlan: false,
    }
  ];

  // Helper check for active status label
  const isCurrentPlan = (planId: string) => {
    if (!currentUser) return planId === 'free_farmer';
    if (!currentUser.subscriptionTier) {
      return planId === 'free_farmer';
    }
    return currentUser.subscriptionTier === planId;
  };

  // Helper to check if a plan is an upgrade or downgrade compared to current users active plan
  const getActionType = (planId: string) => {
    if (isCurrentPlan(planId)) return 'active';
    
    // Convert plans to index array to determine order
    const priorityOrder = ['free_farmer', 'premium_farmer', 'pro_farmer', 'trader_wholesaler', 'enterprise'];
    const currentIdx = priorityOrder.indexOf(currentUser?.subscriptionTier || 'free_farmer');
    const targetIdx = priorityOrder.indexOf(planId);
    
    if (targetIdx > currentIdx) return 'upgrade';
    return 'downgrade';
  };

  // Trigger decision
  const handleSelectPlanAction = (p: typeof plans[number]) => {
    if (isCurrentPlan(p.id)) return;

    const action = getActionType(p.id);

    if (action === 'downgrade') {
      // Prompt confirmation model before degrading
      setDowngradeTarget(p);
      return;
    }

    if (p.id === 'enterprise') {
      setShowEnterpriseModal(true);
      return;
    }

    // Determine current pricing raw based on cycle
    const price = isAnnual ? p.priceAnnual : p.priceMonthly;

    // Check if activating premium trial
    const isTrial = p.id === 'premium_farmer' && (!currentUser?.subscriptionTier || currentUser?.subscriptionTier === 'free_farmer');
    
    // Call props trigger
    onSelectPlan(p.id, price, isTrial);
  };

  // Execute downgraded confirmation
  const confirmDowngrade = () => {
    if (!downgradeTarget) return;
    const price = isAnnual ? downgradeTarget.priceAnnual : downgradeTarget.priceMonthly;
    onSelectPlan(downgradeTarget.id, price, false);
    setDowngradeTarget(null);
  };

  // Submit Lead Generation for Enterprise Custom Pricing
  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !contactName || !contactPhone) {
      alert("Please fill out all contact fields.");
      return;
    }

    setIsSubmittingEnterprise(true);
    try {
      await addDoc(collection(db, 'leads'), {
        organization: orgName,
        contactName,
        phone: contactPhone,
        type: interestType,
        userEmail: currentUser?.email || 'unauthenticated',
        userId: currentUser?.id || 'none',
        createdAt: serverTimestamp(),
      });
      setEnterpriseFeedback("🎉 Quotation request logged successfully! An FPO systems manager will call your cell at " + contactPhone + " within 4 business hours.");
      setOrgName('');
      setContactName('');
      setContactPhone('');
    } catch (err: any) {
      console.error(err);
      setEnterpriseFeedback("System was unable to submit lead: " + err.message);
    } finally {
      setIsSubmittingEnterprise(false);
    }
  };

  // Features list for standard comparison table
  const comparisonRows = [
    { feature: "National APMC Mandi Prices Tracker", free: "✓ Standard", premium: "✓ Standard", pro: "✓ Realtime Spot alerts", trader: "✓ Advanced Analytics", enterprise: "✓ Full Custom API" },
    { feature: "Regional weather & agronomic risks warnings", free: "✓ Standard", premium: "✓ Precision GPS", pro: "✓ Custom micro-local SMS", trader: "✓ Logistics hazard", enterprise: "✓ Custom micro-local SMS" },
    { feature: "Growers Social Agrichat forums", free: "✓ View & Post", premium: "✓ View & Post + Verified", pro: "✓ Priority Posting", trader: "✓ Unlimited trading profile", enterprise: "✓ Admin controls" },
    { feature: "Smart multilingual AI Chat Advisor", free: "✓ Limit 5 queries/day", premium: "✓ Unlimited queries", pro: "✓ Priority voice model", trader: "✓ Trade matching advisor", enterprise: "✓ Custom Fine-tuned assistant" },
    { feature: "AI disease & crop health camera scan", free: "– Unavailable", premium: "✓ Unlimited Scan", pro: "✓ Disease & Nutrient log", trader: "– Not Applicable", enterprise: "✓ Custom team portal" },
    { feature: "Yield prediction & sowing recommendation matrix", free: "– Unavailable", premium: "✓ Included", pro: "✓ AI Model Multi-variant", trader: "– Not Applicable", enterprise: "✓ Aggregated Crop Forecasts" },
    { feature: "Advanced Khet-Khata farm bookkeeping audits", free: "– Basic ledger", premium: "– Basic ledger", pro: "✓ Automated Ledger audit", trader: "✓ Wholesale Ledger audit", enterprise: "✓ Custom Ledger integration" },
    { feature: "Bulk trading listing & active mandi orders panel", free: "– Limit: 3 listings", freeTrader: "– Limit: 3 listings", freeFarmer: "Limit: 3 listings", premium: "✓ Priority matching", pro: "✓ Fast track matching", trader: "✓ Limitless buyers access", enterprise: "✓ Unlimited matching + Escrow priority" },
    { feature: "Customer agronomy support ticketing", free: "Standard ticket", premium: "24-hr ticket priority", pro: "Instant Chat + Voice Call", trader: "Instant Chat + Logistics manager", enterprise: "Dedicated 24/7 specialist desk" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 min-h-screen pb-32 font-sans selection:bg-[#E2F0D9]"
    >
      
      {/* 1. Trial Prominent Top Banner */}
      <div className="bg-gradient-to-r from-[#4C6B36] to-[#3B542B] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Abstract design elements */}
        <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute -left-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-xl"></div>
        
        <div className="space-y-2.5 text-center md:text-left relative z-10 max-w-2xl">
          <span className="bg-white/15 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#E2F0D9] border border-white/10 flex items-center gap-1.5 w-fit mx-auto md:mx-0">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> Limited Period Growth Launch Offer
          </span>
          <h3 className="text-xl md:text-3xl font-black tracking-tight leading-tight">
            Start Your Free 30-Day Premium Trial Today!
          </h3>
          <p className="text-xs md:text-sm text-green-100 font-medium">
            No credit cards or upfront commitments needed. Discover how smart crop yield prediction, unlimited multilingual AI diagnostic queries, and professional weather reports can increase your family's mandi profit margin.
          </p>
        </div>
        
        <button
          onClick={() => {
            const premPlan = plans.find(p => p.id === 'premium_farmer');
            if (premPlan) handleSelectPlanAction(premPlan);
          }}
          className="px-6 py-4 bg-white text-[#4C6B36] hover:bg-[#FAFDF6] rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95 shrink-0 whitespace-nowrap animate-bounce"
        >
          Activate Trial Free ⚡
        </button>
      </div>

      {/* 2. Interactive Title Deck */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 bg-[#F0F7EB] text-[#4C6B36] border border-[#E2F0D9] px-4.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm">
          <Percent className="w-4 h-4 text-[#4C6B36]" /> Transparent Investor-Approved Pricing Metrics
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight font-heading">
          Indian Agri Growth Pricing
        </h2>
        <p className="text-sm text-gray-500 max-w-xl mx-auto font-medium">
          Dramatically reduced pricing engineered specifically for rural smallholder family crop farms and local regional wholesale traders.
        </p>

        {/* 3. Monthly / Annual Billing Toggle Switch */}
        <div className="pt-2 flex flex-col items-center justify-center gap-2">
          <div className="bg-white p-1.5 rounded-2xl border border-[#E2F0D9] shadow-sm inline-flex items-center gap-1.5">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all ${!isAnnual ? 'bg-[#4C6B36] text-white shadow' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all flex items-center gap-1 ${isAnnual ? 'bg-[#4C6B36] text-white shadow' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Annual Saver <span className="bg-amber-100 text-[#4C6B36] px-1.5 py-0.2 rounded text-[9px] font-black pointer-events-none lowercase tracking-wide font-mono">-20%</span>
            </button>
          </div>
          {isAnnual && (
            <span className="text-[10px] text-[#4C6B36] font-black uppercase tracking-wider block mt-1">
              ✨ Best Deal: Monthly savings applied, billed yearly.
            </span>
          )}
        </div>
      </div>

      {/* 4. Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {plans.map((p, idx) => {
          const isActive = isCurrentPlan(p.id);
          const rawPrice = isAnnual ? p.priceAnnual : p.priceMonthly;
          const actionStr = getActionType(p.id);
          
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition-all hover:shadow-lg ${p.accent}`}
            >
              {/* Most Popular/Custom Badge */}
              {p.badge && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md ${p.badgeStyle}`}>
                  {p.badge}
                </span>
              )}

              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-heading font-black text-md md:text-lg text-gray-950 leading-tight">
                      {p.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">
                      {p.isFarmerPlan ? '🌾 Farmer Perk' : '🚜 Trade Perk'}
                    </p>
                  </div>
                  <div className="p-2.5 bg-white border border-[#E2F0D9]/50 shadow-inner rounded-xl shrink-0">
                    {p.icon}
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 font-semibold leading-relaxed min-h-[44px]">
                  {p.tagline}
                </p>

                {/* Pricing section */}
                <div className="pt-2 border-t border-dashed border-[#F3F8F2]">
                  {rawPrice === -1 ? (
                    <div className="space-y-1">
                      <span className="text-2xl font-black text-[#2D2D2D] tracking-tight">Custom Plan</span>
                      <p className="text-[9px] text-gray-400 font-semibold leading-none uppercase">Based on FPO size</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl md:text-4xl font-extrabold text-[#1D1D1D] tracking-tighter">
                          ₹{rawPrice}
                        </span>
                        <span className="text-xs text-gray-400 font-black">/ {p.period}</span>
                      </div>
                      
                      {/* Show Monthly Savings calculation */}
                      {isAnnual && rawPrice > 0 && (
                        <div className="text-[9px] text-[#4C6B36] font-extrabold uppercase leading-none mt-1">
                          Save ₹{(p.priceMonthly - p.priceAnnual) * 12} per year
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Features detailed checklist */}
                <ul className="space-y-2.5 pt-4 border-t border-gray-100">
                  {p.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-[11px] font-semibold text-gray-600 leading-snug">
                      <Check className="w-3.5 h-3.5 text-[#4C6B36] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons with state variables */}
              <div className="pt-6 mt-4">
                {isActive ? (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-xl bg-emerald-100 text-[#4C6B36] font-black text-[10px] uppercase tracking-wider cursor-default border border-[#C6E2BA] flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlanAction(p)}
                    className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1 ${
                      actionStr === 'downgrade' 
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                        : p.id === 'enterprise'
                          ? 'bg-[#1D1D1D] text-white hover:bg-black shadow-lg text-white'
                          : p.hasTrial
                            ? 'bg-[#4C6B36] text-white hover:bg-[#3D562B] ring-2 ring-[#4C6B36]/15 hover:shadow-md animate-pulse'
                            : 'bg-[#4C6B36] text-white hover:bg-[#3D562B]'
                    }`}
                  >
                    {actionStr === 'downgrade' ? 'Downgrade to ' + p.name.split(' ')[0] : p.cta}
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 5. Feature Comparison Table Drawer */}
      <div className="bg-white border border-[#E2F0D9] rounded-3xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="w-full p-6 flex justify-between items-center bg-[#FAFDF6] hover:bg-[#F2F8EE] transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2.5 text-left">
            <Sparkles className="w-5 h-5 text-[#4C6B36]" />
            <div>
              <h4 className="font-heading font-black text-gray-900 text-sm md:text-base uppercase tracking-wider leading-none">View Complete Feature Metrics Grid</h4>
              <p className="text-[11px] text-gray-400 font-semibold mt-1">Analyze side-by-side capabilities before committing</p>
            </div>
          </div>
          {showComparison ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-[#E2F0D9]"
            >
              <div className="p-4 md:p-6 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px] font-black">
                      <th className="py-3 px-3">Aggregated Utility Option</th>
                      <th className="py-3 px-3">Free Farmer</th>
                      <th className="py-3 px-3 text-[#4C6B36]">Premium Farmer</th>
                      <th className="py-3 px-3">Pro Farmer</th>
                      <th className="py-3 px-3">Trader Plan</th>
                      <th className="py-3 px-3">Enterprise Base</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors font-medium text-gray-700 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                      >
                        <td className="py-3 px-3 text-gray-900 font-extrabold max-w-[200px]">{row.feature}</td>
                        <td className="py-3 px-3 text-gray-500 font-semibold">{row.free || row.freeFarmer || row.freeTrader}</td>
                        <td className="py-3 px-3 text-[#4C6B36] font-black">{row.premium}</td>
                        <td className="py-3 px-3 text-gray-700 font-bold">{row.pro}</td>
                        <td className="py-3 px-3 text-blue-800 font-bold">{row.trader}</td>
                        <td className="py-3 px-3 text-gray-900 font-black">{row.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6. Lead Generation Form for Enterprise/Custom Buying */}
      <AnimatePresence>
        {showEnterpriseModal && (
          <div className="fixed inset-0 bg-black/60 z-[140] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-gray-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#4C6B36]/20 relative"
            >
              <div className="bg-[#4C6B36] p-6 text-white flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-black tracking-wider bg-white/10 px-2 py-0.5 rounded">FPO / Corporate Procurement</span>
                  <h3 className="text-xl font-black font-heading leading-none">Enterprise Collaboration Setup</h3>
                </div>
                <button 
                  onClick={() => { setShowEnterpriseModal(false); setEnterpriseFeedback(null); }} 
                  className="text-white hover:text-green-200 transition-colors p-2 text-md font-bold rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                {enterpriseFeedback ? (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-150 space-y-3">
                    <p className="text-xs font-bold leading-relaxed">{enterpriseFeedback}</p>
                    <button
                      onClick={() => { setShowEnterpriseModal(false); setEnterpriseFeedback(null); }}
                      className="w-full py-2.5 bg-[#4C6B36] hover:bg-[#3D562B] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Close Request Drawer
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEnterpriseSubmit} className="space-y-4">
                    <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                      Please enter your organization info. A dedicated regional cooperative manager will establish a bulk corporate trading contract with your branch immediately.
                    </p>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">FPO / Cooperative / Agro Business Name</label>
                      <input
                        required
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g., Amritsar Potato Growers Cooperative Association"
                        className="w-full bg-gray-55 border border-gray-250 rounded-xl py-3 px-4 outline-none text-xs font-semibold placeholder:text-gray-400 focus:border-[#4C6B36]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Contact Executive Name</label>
                        <input
                          required
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g., Hartej Singh Gill"
                          className="w-full bg-gray-55 border border-gray-250 rounded-xl py-3 px-4 outline-none text-xs font-semibold placeholder:text-gray-400 focus:border-[#4C6B36]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Direct Phone Contact</label>
                        <input
                          required
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="e.g. +91 94420 16188"
                          className="w-full bg-gray-55 border border-gray-250 rounded-xl py-3 px-4 outline-none text-xs font-semibold placeholder:text-gray-400 focus:border-[#4C6B36]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Primary Business Need</label>
                      <select
                        value={interestType}
                        onChange={(e) => setInterestType(e.target.value)}
                        className="w-full bg-gray-55 border border-gray-250 rounded-xl py-3 px-4 outline-none text-xs font-bold text-gray-700 focus:border-[#4C6B36]"
                      >
                        <option value="FPO group enrollment model">FPO member group enrollment (Up to 500 family growers)</option>
                        <option value="National buyers directory matching">National buyers bulk mandi matchmaking</option>
                        <option value="Export quality compliance vetting">Export quality cargo certification</option>
                        <option value="Custom API database pipeline">Agricultural spot API pipeline integrations</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingEnterprise}
                      className="w-full mt-2 py-3.5 rounded-xl bg-[#4C6B36] hover:bg-[#3D562B] text-white font-black uppercase text-xs tracking-widest shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingEnterprise ? "Submitting Request Code..." : "Submit Quote Request"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Downgrade confirmation dialog */}
      <AnimatePresence>
        {downgradeTarget && (
          <div className="fixed inset-0 bg-black/60 z-[140] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-gray-950 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-red-200"
            >
              <div className="bg-amber-50 p-6 text-amber-900 border-b border-amber-100 flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-heading font-black text-md md:text-lg leading-tight uppercase tracking-wider">Confirm Plan Change</h3>
                  <p className="text-[10px] text-amber-700 uppercase font-black tracking-widest mt-0.5">Downgrading subscription tier</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                  You requested to change your subscription tier from <b className="text-gray-900 uppercase">KhetNet {(currentUser?.subscriptionTier || 'Free').replace('_', ' ')}</b> to <b className="text-[#4C6B36] uppercase">KhetNet {downgradeTarget.name}</b>.
                </p>
                <p className="text-[11px] text-gray-400 font-bold italic">
                  Note: Any active features unique to your higher plan will be deactivated. This change is fully simulated.
                </p>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setDowngradeTarget(null)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel Action
                  </button>
                  <button
                    onClick={confirmDowngrade}
                    className="flex-1 py-3 bg-red-650 hover:bg-red-750 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all"
                  >
                    Confirm Downgrade
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Return to Dashboard Controls */}
      {onBackToHome && (
        <div className="text-center pt-4">
          <button
            onClick={onBackToHome}
            className="text-xs text-[#4C6B36] font-extrabold border-2 border-[#E2F0D9] hover:bg-[#F0F7EB] bg-white px-6 py-3 rounded-full transition-colors active:scale-95 uppercase tracking-widest"
          >
            ← Return to Mandi Dashboard
          </button>
        </div>
      )}
    </motion.div>
  );
}
