import React from 'react';
import { motion } from 'motion/react';
import { Check, ShieldAlert, Star, Trophy, ArrowRight, Zap } from 'lucide-react';

interface SubscriptionPlansProps {
  t: any;
  onSelectPlan: (tier: 'gold' | 'platinum', price: number) => void;
  onBackToHome?: () => void;
}

export function SubscriptionPlans({ t, onSelectPlan, onBackToHome }: SubscriptionPlansProps) {
  const plans = [
    {
      id: 'basic' as const,
      name: 'Basic Mandi Member',
      price: '₹0',
      period: 'Forever Free',
      accent: 'border-[#E2F0D9] bg-white',
      badge: null,
      icon: <Zap className="w-6 h-6 text-gray-400" />,
      features: [
        'Browse local regional crops',
        'Limit: View up to 3 listings per day',
        'Standard freight support details',
        'Basic multilingual Chatbot access',
      ],
      cta: 'Current Active Tier',
      priceRaw: 0,
    },
    {
      id: 'gold' as const,
      name: 'Gold Mandi Partner',
      price: '₹999',
      period: 'month',
      accent: 'border-[#4C6B36]/30 bg-emerald-50/10 relative ring-2 ring-emerald-500/20 shadow-lg',
      badge: 'Highly Popular',
      icon: <Star className="w-6 h-6 text-amber-500 fill-amber-500" />,
      features: [
        'Unlock up to 50 active listings per day',
        'Direct Farmer click-to-call matching',
        'Priority truck logistics matching options',
        'Enhanced 1-on-1 translation capabilities',
        'Official Gold Trader verification badge',
      ],
      cta: 'Upgrade to Gold',
      priceRaw: 999,
    },
    {
      id: 'platinum' as const,
      name: 'Platinum Trader Elite',
      price: '₹2,499',
      period: 'month',
      accent: 'border-yellow-500/30 bg-yellow-500/5 relative ring-2 ring-yellow-500/40 shadow-xl',
      badge: 'Ultimate Power',
      icon: <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />,
      features: [
        'Unlimited crop listings access with zero limits',
        'Instant SMS alerts on local harvest alerts',
        'Direct connection to 100% verified organic farmers',
        'National trading compliance assistance',
        '24/7 dedicated freight/truck transport priorities',
        'Official Platinum Trade validation badge',
      ],
      cta: 'Upgrade to Platinum',
      priceRaw: 2499,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto p-6 space-y-8 min-h-screen pb-24"
    >
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-[#F0F7EB] text-[#4C6B36] border border-[#E2F0D9] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
          <Star className="w-4 h-4 fill-[#4C6B36] text-[#4C6B36]" /> Trade Premium with KhetNet Pro
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-[#2D2D2D] tracking-tight">
          Agri-Trading Subscriptions
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base italic">
          Bypass limits, unlock verified farmers directly, and accelerate bulk transport logistics to scale your trading business natively.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p, idx) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`rounded-3xl border p-6 flex flex-col justify-between ${p.accent} transition-transform hover:scale-[1.02]`}
          >
            {p.badge && (
              <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-md ${p.id === 'platinum' ? 'bg-gradient-to-r from-amber-500 to-yellow-600' : 'bg-[#4C6B36]'}`}>
                {p.badge}
              </span>
            )}

            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-heading font-extrabold text-lg md:text-xl text-gray-900 leading-tight">
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Plan Perks</p>
                </div>
                <div className="p-3 bg-[#F0F7EB] rounded-2xl">
                  {p.icon}
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[#1D1D1D] tracking-tighter">{p.price}</span>
                {p.period && <span className="text-xs text-gray-400 font-bold">/ {p.period}</span>}
              </div>

              <ul className="space-y-3.5 pt-4 border-t border-dashed border-[#F0F7EB]">
                {p.features.map((f, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2.5 text-xs font-semibold text-gray-600">
                    <Check className="w-4 h-4 text-[#4C6B36] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              {p.id === 'basic' ? (
                <button
                  disabled
                  className="w-full py-4 rounded-xl bg-gray-50 text-gray-400 font-bold text-xs uppercase cursor-default border border-gray-100"
                >
                  {p.cta}
                </button>
              ) : (
                <button
                  onClick={() => onSelectPlan(p.id, p.priceRaw)}
                  className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 ${p.id === 'platinum' ? 'bg-[#1D1D1D] text-white hover:bg-black shadow-lg' : 'bg-[#4C6B36] text-white hover:bg-[#3D562B]'}`}
                >
                  {p.cta} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {onBackToHome && (
        <div className="text-center pt-4">
          <button
            onClick={onBackToHome}
            className="text-xs text-[#4C6B36] font-extrabold border-2 border-[#E2F0D9] hover:bg-[#F0F7EB] bg-white px-6 py-2.5 rounded-full transition-colors active:scale-95 uppercase tracking-widest"
          >
            ← Return to Dashboard
          </button>
        </div>
      )}
    </motion.div>
  );
}
