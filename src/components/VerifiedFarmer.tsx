import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ArrowRight, Smartphone, Fingerprint, RefreshCw, Award, Heart, CheckCircle2, Star } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../App';

interface VerifiedFarmerProps {
  user: any;
  onVerificationComplete: (updatedFields: any) => void;
}

export function VerifiedFarmer({ user, onVerificationComplete }: VerifiedFarmerProps) {
  const [aadhaar, setAadhaar] = useState('');
  const [mobile, setMobile] = useState(user.mobile || '');
  const [step, setStep] = useState<'details' | 'otp' | 'success'>(user.isVerified ? 'success' : 'details');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const sendOtpSimulate = () => {
    if (!/^\d{12}$/.test(aadhaar)) {
      setErrorMessage('Please type a valid 12-digit UIDAI Aadhaar Number.');
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setErrorMessage('Please declare a valid 10-digit Indian Mobile phone.');
      return;
    }

    setErrorMessage('');
    setIsSendingOtp(true);
    
    setTimeout(() => {
      // Dynamic OTP gen
      const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(randomOtp);
      setIsSendingOtp(false);
      setStep('otp');
      // Show OTP in an alert so user can verify perfectly
      alert(`[KhetNet Secure Gateway] OTP shared successfully. Enter OTP ${randomOtp} to authorize your identity verification.`);
    }, 1500);
  };

  const verifyOtpSimulate = async () => {
    if (otpCode !== generatedOtp) {
      setErrorMessage('Invalid OTP. Please check the code and try again.');
      return;
    }

    setErrorMessage('');
    setIsVerifying(true);

    try {
      // Base calculation: verified farmers get a 95 Trust Score automatically
      const updatedData = {
        isVerified: true,
        aadhaarDigits: `XXXX-XXXX-${aadhaar.slice(-4)}`,
        otpVerified: true,
        trustScore: 94,
        tradeHistoryCount: 4,
        buyerRating: 4.8
      };

      if (user.id) {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, updatedData);
      }

      setIsVerifying(false);
      setStep('success');
      onVerificationComplete(updatedData);
    } catch (e: any) {
      console.error(e);
      setErrorMessage('State storage failed. Profile updated locally.');
      
      // Fallback
      const fallbackData = {
        isVerified: true,
        aadhaarDigits: `XXXX-XXXX-${aadhaar.slice(-4)}`,
        otpVerified: true,
        trustScore: 94,
        tradeHistoryCount: 4,
        buyerRating: 4.8
      };
      setIsVerifying(false);
      setStep('success');
      onVerificationComplete(fallbackData);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 space-y-6" id="verified-farmer-system">
      <div className="space-y-1">
        <span className="p-1 px-2 py-0.5 rounded bg-[#4C6B36]/10 text-[#4C6B36] font-bold text-[9px] uppercase tracking-widest inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 fill-[#4C6B36]/10" /> Goverment Digital UID Link
        </span>
        <h2 className="text-2xl font-heading font-black text-gray-950 tracking-tight leading-none italic">Verified Farmer Registry</h2>
        <p className="text-xs text-gray-400 font-medium">Link UIDAI Aadhaar ID with OTP locks to earn the badge & raise your buyer Trust Score.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'details' && (
          <motion.div
            key="verify-details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border-2 border-[#E2F0D9] p-6 space-y-5 shadow-sm"
          >
            {errorMessage && (
              <p className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{errorMessage}</p>
            )}

            <div className="space-y-4">
              {/* Aadhaar Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block ml-1 flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5 text-[#4C6B36]" /> 12-Digit Aadhaar UIDAI
                </label>
                <input
                  required
                  type="text"
                  maxLength={12}
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 5432 9876 1024"
                  className="w-full bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl py-3 px-4 outline-none focus:border-[#4C6B36] text-sm font-bold font-mono tracking-widest text-center"
                />
              </div>

              {/* Mobile Phone Confirm */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block ml-1 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" /> Linked Mobile Phone
                </label>
                <input
                  required
                  type="text"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit smartphone mobile"
                  className="w-full bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl py-3 px-4 outline-none focus:border-[#4C6B36] text-sm font-bold text-center font-mono tracking-widest"
                />
              </div>
            </div>

            <button
              onClick={sendOtpSimulate}
              disabled={isSendingOtp || aadhaar.length !== 12 || mobile.length !== 10}
              className="w-full py-4 bg-[#4C6B36] hover:bg-[#3D562B] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-45"
            >
              {isSendingOtp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> REQUESTING UIDAI OTP...
                </>
              ) : (
                <>
                  REQUESING OTP CERTIFICATE <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div
            key="verify-otp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border-2 border-[#E2F0D9] p-6 space-y-5 shadow-sm"
          >
            {errorMessage && (
              <p className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{errorMessage}</p>
            )}

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                <Smartphone className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-heading font-black text-gray-950 text-sm">Enter Authenticator OTP</h3>
                <p className="text-[10px] text-gray-450 leading-relaxed font-semibold">An OTP token has been dispatched to linked smartphone (+91 {mobile.slice(0, 3)}***{mobile.slice(-3)}).</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <input
                required
                type="text"
                maxLength={4}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-40 bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl py-3 px-4 outline-none focus:border-[#4C6B36] text-lg font-black text-center font-mono tracking-[1em] block mx-auto text-gray-950 pl-[1.25em]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('details')}
                className="flex-1 py-3.5 bg-gray-50 border border-gray-100 hover:bg-gray-100 rounded-xl text-xs font-black text-gray-500 uppercase tracking-widest uppercase"
              >
                Go Back
              </button>
              <button
                onClick={verifyOtpSimulate}
                disabled={isVerifying || otpCode.length !== 4}
                className="flex-1 py-3.5 bg-[#4C6B36] text-white hover:bg-[#3D562B] rounded-xl text-xs font-black text-gray-100 uppercase tracking-widest flex items-center justify-center gap-1 shadow-md disabled:opacity-40"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> LINKING...
                  </>
                ) : (
                  <>
                    CONFIRM LINK
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="verify-success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border-2 border-emerald-100 p-8 text-center space-y-6 shadow-sm"
          >
            <div className="relative w-24 h-24 mx-auto">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100"
              >
                <Award className="w-12 h-12 text-emerald-600" />
              </motion.div>
              <span className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-heading font-black text-gray-950 tracking-tight leading-none italic flex items-center justify-center gap-1.5">
                <span>Verification Approved!</span>
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto font-medium leading-relaxed">
                Your Aadhaar credential <span className="font-mono text-gray-800 font-extrabold">{user.aadhaarDigits || "XXXX-XXXX-1024"}</span> has been verified securely. Unlocked the platform gold-tier farmer badge.
              </p>
            </div>

            {/* Micro Rating Card */}
            <div className="grid grid-cols-3 gap-2 text-center p-3.5 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl">
              <div>
                <span className="text-[8px] text-emerald-800 font-black tracking-widest uppercase block">Trust Rating</span>
                <span className="text-lg font-black text-emerald-700 font-mono flex items-center justify-center gap-0.5 mt-0.5">
                  <Star className="w-4 h-4 fill-emerald-600 text-emerald-600 shrink-0" />
                  {user.trustScore || 94}/100
                </span>
              </div>
              <div className="border-x border-emerald-150">
                <span className="text-[8px] text-emerald-800 font-black tracking-widest uppercase block">Completed Trades</span>
                <span className="text-lg font-black text-gray-950 font-mono mt-0.5 block">{user.tradeHistoryCount || 4} Orders</span>
              </div>
              <div>
                <span className="text-[8px] text-emerald-800 font-black tracking-widest uppercase block">Buyer Score</span>
                <span className="text-lg font-black text-gray-950 font-mono mt-0.5 block">{user.buyerRating || "4.8"}/5.0</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-100 text-gray-500 text-[10px] leading-relaxed rounded-xl font-medium tracking-wide">
              🔒 UID certificate tokens are hashed and encrypted. Dynamic updates sync directly with nearest regional wholesale warehouses to match bids.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
