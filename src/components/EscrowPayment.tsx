import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../App';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ShieldCheck, CheckCircle2, RefreshCw, Landmark, HelpCircle, Truck, Info, Award, User, Phone, CheckCircle } from 'lucide-react';

interface EscrowProps {
  user: any;
  t: any;
}

export function EscrowPayment({ user, t }: EscrowProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!user.id) return;
    
    // Wholesalers query on wholesalerId, farmers on farmerId
    const fieldToFilter = user.role === 'farmer' ? 'farmerId' : 'wholesalerId';
    const q = query(
      collection(db, 'orders'),
      where(fieldToFilter, '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordList);
      setLoading(false);
    }, (error) => {
      console.warn("Escrow order snapshot blocked: falling back.", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.id, user.role]);

  const transitionStatus = async (orderId: string, currentStatus: string, nextStatus: string) => {
    setIsProcessing(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData: any = { status: nextStatus };
      
      if (nextStatus === 'escrow_deposited') {
        updateData.escrowHeldAt = Date.now();
      } else if (nextStatus === 'escrow_released') {
        updateData.escrowReleasedAt = Date.now();
      }

      await updateDoc(orderRef, updateData);
      alert(`Order updated successfully to ${nextStatus.toUpperCase().replace('_', ' ')}.`);
    } catch (err: any) {
      console.error(err);
      alert(`Transaction failed: ${err.message}. Ensure permissions or rules align.`);
    } finally {
      setIsProcessing(null);
    }
  };

  const getStepValue = (status: string) => {
    switch(status) {
      case 'pending': return 1;
      case 'approved': return 2;
      case 'escrow_deposited': return 3;
      case 'delivered': return 4;
      case 'escrow_released': return 5;
      case 'declined': return -1;
      default: return 1;
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 space-y-6" id="escrow-payment-desk">
      <div className="space-y-1">
        <span className="p-1 px-2.5 rounded bg-amber-50 text-amber-700 font-bold text-[9px] uppercase tracking-widest inline-flex items-center gap-1">
          <Landmark className="w-3.5 h-3.5" /> SECURED ESCROW ARCHITECTURE
        </span>
        <h2 className="text-2xl font-heading font-black text-gray-950 tracking-tight leading-none italic">KhetNet Escrow Guard</h2>
        <p className="text-xs text-gray-400 font-medium">Funds are securely deposited and held by KhetNet Trust Accounts, only releasing directly to the farmer after successful bulk crop delivery confirmations.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E2F0D9] flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#4C6B36] animate-spin" />
          <p className="text-xs font-black text-[#4C6B36] uppercase tracking-wider animate-pulse">Syncing secured financial escrow ledger...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-8 bg-white rounded-3xl border border-dashed border-[#E2F0D9] text-center space-y-3">
          <Landmark className="w-10 h-10 text-gray-200 mx-auto" />
          <p className="text-xs font-bold text-gray-400">No active cargo trade contracts are registered for your account yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, oIdx) => {
            const stepNum = getStepValue(order.status);
            const canFarmerApprove = user.role === 'farmer' && order.status === 'pending';
            const canBuyerDeposit = user.role === 'wholesaler' && order.status === 'approved';
            const canFarmerShip = user.role === 'farmer' && order.status === 'escrow_deposited';
            const canBuyerRelease = user.role === 'wholesaler' && order.status === 'delivered';

            return (
              <motion.div
                key={order.id || oIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: oIdx * 0.05 }}
                className="bg-white rounded-3xl border border-[#E2F0D9] p-5.5 space-y-4 shadow-sm"
              >
                {/* Header of order */}
                <div className="flex justify-between items-start pb-3 border-b border-gray-50">
                  <div>
                    <h3 className="text-sm font-black text-gray-950 leading-tight block">{order.productName}</h3>
                    <p className="text-[10px] text-gray-400 tracking-wider font-semibold uppercase mt-0.5">Contract ID: {order.id?.slice(0, 8).toUpperCase() || 'KNET-TX'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest block">Cargo amount</span>
                    <span className="text-sm font-black text-[#4C6B36] font-mono">₹{order.totalCost}</span>
                  </div>
                </div>

                {/* Participants details */}
                <div className="grid grid-cols-2 gap-4 text-xs font-medium bg-[#FAFDF6] border border-gray-100 p-3.5 rounded-2xl">
                  <div>
                    <span className="text-[8px] text-gray-400 font-extrabold uppercase">Farmer (Seller)</span>
                    <h4 className="font-extrabold text-[#111111] mt-0.5">{order.farmerName}</h4>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-400 font-extrabold uppercase">Trader/Buyer (Escrow)</span>
                    <h4 className="font-extrabold text-[#111111] mt-0.5">{order.wholesalerName}</h4>
                  </div>
                </div>

                {/* Status Indicator Meter */}
                {stepNum !== -1 ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-gray-400">
                      <span>Mandi Check</span>
                      <span>KhetNet Escrow Pending</span>
                      <span>Farmer Cargo Sent</span>
                      <span>Completed</span>
                    </div>
                    {/* Visual Meter bar */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className={`h-full transition-all duration-500 rounded-full ${order.status === 'escrow_released' ? 'w-full bg-emerald-500' : (stepNum === 4 ? 'w-[80%] bg-amber-500 animate-pulse' : (stepNum === 3 ? 'w-[60%] bg-blue-500 animate-pulse' : (stepNum === 2 ? 'w-[40%] bg-yellow-400' : 'w-[15%] bg-yellow-300')))}`}></div>
                    </div>
                    <div className="flex justify-between text-[10px] items-center">
                      <div className="font-bold uppercase tracking-wider text-gray-400">Status Score:</div>
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider ${order.status === 'escrow_released' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : (order.status === 'delivered' ? 'bg-amber-50 text-amber-700 animate-pulse' : (order.status === 'escrow_deposited' ? 'bg-blue-50 text-blue-700 border border-blue-100 animate-pulse' : 'bg-gray-150 text-gray-500'))}`}>
                        {order.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 font-black tracking-wide text-center uppercase p-3 bg-red-50 rounded-2xl">This Contract Trade was Declined.</p>
                )}

                {/* Action buttons based on active roles & matching statuses */}
                <div className="pt-2 border-t border-dashed border-[#FAFDF6] flex justify-end gap-3.5">
                  {isProcessing === order.id ? (
                    <button disabled className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-xl text-xs uppercase font-black flex items-center justify-center gap-1.5 border border-gray-100">
                      <RefreshCw className="w-4 h-4 animate-spin" /> AUTHORIZING LEDGER CLEARANCE...
                    </button>
                  ) : (
                    <>
                      {/* Farmer Actions */}
                      {canFarmerApprove && (
                        <div className="w-full grid grid-cols-2 gap-2">
                          <button
                            onClick={() => transitionStatus(order.id, 'pending', 'declined')}
                            className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 rounded-xl text-xs font-black uppercase tracking-wider"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => transitionStatus(order.id, 'pending', 'approved')}
                            className="py-2.5 bg-[#4C6B36] hover:bg-[#3D562B] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm"
                          >
                            Approve Trade
                          </button>
                        </div>
                      )}

                      {canFarmerShip && (
                        <button
                          onClick={() => transitionStatus(order.id, 'escrow_deposited', 'delivered')}
                          className="w-full py-3 bg-[#4C6B36] hover:bg-[#3D562B] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Truck className="w-4.5 h-4.5 shrink-0" /> CONFIRM BULK CARGO DISPATCHED
                        </button>
                      )}

                      {/* Wholesaler Actions */}
                      {canBuyerDeposit && (
                        <button
                          onClick={() => transitionStatus(order.id, 'approved', 'escrow_deposited')}
                          className="w-full py-3.5 bg-[#4C6B36] hover:bg-[#3D562B] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Landmark className="w-4.5 h-4.5 shrink-0" /> DEPOSIT & LOCK IN ESCROW HOLD
                        </button>
                      )}

                      {canBuyerRelease && (
                        <button
                          onClick={() => transitionStatus(order.id, 'delivered', 'escrow_released')}
                          className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 animate-bounce-short"
                        >
                          <CheckCircle className="w-4.5 h-4.5 shrink-0" /> VERIFY DELIVERY & RELEASE ESCROW FUNDS
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Help Info block */}
                {order.status === 'escrow_deposited' && (
                  <div className="text-[9px] bg-blue-50/50 border border-blue-100 p-3 rounded-2xl leading-relaxed text-blue-800 grid grid-cols-1 gap-1">
                    <p className="font-extrabold flex items-center gap-1">🔒 ESCROW SECURITY SHIELD ACTIVE</p>
                    <p>Wholesale amount are guarded safely in escrow vaults. Farmer can load cargo truck with total secure financial trade guarantees.</p>
                  </div>
                )}
                {order.status === 'escrow_released' && (
                  <div className="text-[9px] bg-emerald-50/40 border border-emerald-100/50 p-3 rounded-2xl leading-relaxed text-emerald-800">
                    <p className="font-extrabold flex items-center gap-1">✓ FUNDS RELEASED TO FARMER</p>
                    <p className="mt-0.5">Cargo transaction complete. Handled and audited cleanly under APMC Mandi settlement frameworks.</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
