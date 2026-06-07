import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CreditCard, Smartphone, Landmark, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tier: 'gold' | 'platinum') => void;
  tier: 'gold' | 'platinum';
  price: number;
}

export function RazorpayModal({ isOpen, onClose, onSuccess, tier, price }: RazorpayModalProps) {
  const [activeMethod, setActiveMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'details' | 'success'>('details');

  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  if (!isOpen) return null;

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate standard Razorpay gateway authorization
    setTimeout(() => {
      setIsProcessing(false);
      setStep('success');
      
      // Auto success callback
      setTimeout(() => {
        onSuccess(tier);
        onClose();
        setStep('details');
      }, 2500);
    }, 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#0c1328] text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-blue-900/40 relative font-sans"
        >
          {/* Header */}
          <div className="bg-[#121f45] p-6 border-b border-blue-900/30 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] uppercase font-black tracking-widest bg-blue-600 px-2 py-0.5 rounded text-white">Razorpay Secure</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Sandbox</span>
              </div>
              <h3 className="text-xl font-black text-white">KhetNet Agritech Ltd.</h3>
              <p className="text-xs text-gray-400">Upgrade to KhetNet {tier === 'gold' ? 'Gold Partner' : 'Platinum Partner'}</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors p-2 text-xl font-bold rounded-lg hover:bg-white/5"
            >
              ✕
            </button>
          </div>

          {step === 'details' ? (
            <div className="p-6 space-y-6">
              {/* Order total */}
              <div className="bg-[#121f45]/50 p-4 rounded-2xl flex justify-between items-center border border-blue-900/10">
                <span className="text-gray-400 text-sm font-semibold">Total Amount</span>
                <span className="text-2xl font-black text-[#56dec0]">₹{price.toLocaleString('en-IN')}</span>
              </div>

              {isProcessing ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  >
                    <Loader className="w-12 h-12 text-[#56dec0]" />
                  </motion.div>
                  <div className="text-center">
                    <p className="font-bold text-white tracking-tight">Authorizing with Razorpay Server...</p>
                    <p className="text-xs text-gray-500 mt-1">Please do not refresh or click back button</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  {/* Tabs */}
                  <div className="grid grid-cols-3 gap-2 bg-[#121f45] p-1 rounded-xl border border-blue-900/20">
                    <button
                      type="button"
                      onClick={() => setActiveMethod('upi')}
                      className={`py-2.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${activeMethod === 'upi' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Smartphone className="w-4 h-4" /> UPI / QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMethod('card')}
                      className={`py-2.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${activeMethod === 'card' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                      <CreditCard className="w-4 h-4" /> Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMethod('netbanking')}
                      className={`py-2.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${activeMethod === 'netbanking' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Landmark className="w-4 h-4" /> NetBanking
                    </button>
                  </div>

                  {/* Method Content */}
                  {activeMethod === 'upi' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Enter UPI ID</label>
                        <input
                          required
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. farmer@ybl, buyer@paytm"
                          className="w-full bg-[#121f45] border border-blue-900/30 rounded-xl py-3.5 px-4 outline-none text-white placeholder:text-gray-600 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div className="p-3 bg-[#121f45]/30 rounded-xl flex items-center gap-2 border border-blue-900/15">
                        <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
                        <p className="text-[11px] text-gray-400 leading-snug">Instant mobile notification will pop up on your UPI App to complete security check.</p>
                      </div>
                    </div>
                  )}

                  {activeMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Card Number</label>
                        <input
                          required
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4111 2222 3333 4444"
                          className="w-full bg-[#121f45] border border-blue-900/30 rounded-xl py-3.5 px-4 outline-none text-white placeholder:text-gray-600 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Expiry Date</label>
                          <input
                            required
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full bg-[#121f45] border border-blue-900/30 rounded-xl py-3.5 px-4 outline-none text-white placeholder:text-gray-600 focus:border-blue-500 text-sm text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">CVV Code</label>
                          <input
                            required
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="•••"
                            maxLength={3}
                            className="w-full bg-[#121f45] border border-blue-900/30 rounded-xl py-3.5 px-4 outline-none text-white placeholder:text-gray-600 focus:border-blue-500 text-sm text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMethod === 'netbanking' && (
                    <div className="grid grid-cols-2 gap-2">
                      {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'KOTAK', 'Punjab National'].map(bank => (
                        <button
                          type="button"
                          key={bank}
                          onClick={() => alert(`Selected ${bank} simulated gateway.`)}
                          className="p-3 bg-[#121f45] hover:bg-blue-900/20 text-xs font-bold rounded-xl border border-blue-900/20 text-left truncate transition-colors"
                        >
                          🏛️ {bank}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black uppercase text-sm tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" /> Pay Securely ₹{price.toLocaleString('en-IN')}
                  </button>
                </form>
              )}

              <footer className="pt-2 border-t border-blue-900/20 flex justify-center items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                <Shield className="w-3.5 h-3.5 text-[#56dec0]" /> 256-BIT SSL ENCRYPTION GUARANTEE
              </footer>
            </div>
          ) : (
            <div className="p-8 text-center space-y-6">
              <motion.div
                initial={{ scale: 0.5, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20"
              >
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </motion.div>
              <div>
                <h4 className="text-2xl font-black text-white tracking-tight">Payment Successful</h4>
                <p className="text-sm text-emerald-400 font-bold mt-1.5 uppercase tracking-widest">₹{price.toLocaleString('en-IN')} Paid Securely</p>
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">Razorpay Reference: TXN_{Math.random().toString(36).substr(2, 9).toUpperCase()}<br/>Your KhetNet Premium Trader benefits are activated.</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
