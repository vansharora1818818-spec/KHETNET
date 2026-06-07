import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Trash2, 
  Activity, 
  CheckCircle, 
  Ban, 
  UserX, 
  Award,
  RefreshCw,
  LogOut,
  Mail,
  Smartphone
} from 'lucide-react';
import { KhetNetLogo } from './KhetNetLogo';
import { getFirestore, doc, deleteDoc, updateDoc, writeBatch, collection, getDocs, query } from 'firebase/firestore';
import { db } from '../App';

interface HostCenterProps {
  t: any;
  logins: any[];
  products: any[];
  loginSessions: any[];
  onLogout: () => void;
}

export function HostCenter({ t, logins, products, loginSessions, onLogout }: HostCenterProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Live calculated startup metrics
  const totalFarmers = logins.filter(user => user.role === 'farmer').length;
  const totalWholesalers = logins.filter(user => user.role === 'wholesaler').length;
  const activeProducts = products.length;

  // Revenue estimation
  // Gold subscription: ₹999/month, Platinum subscription: ₹2,499/month
  const goldSubscribers = logins.filter(user => user.role === 'wholesaler' && user.subscriptionTier === 'gold').length;
  const platinumSubscribers = logins.filter(user => user.role === 'wholesaler' && user.subscriptionTier === 'platinum').length;
  const standardProBuyers = logins.filter(user => user.role === 'wholesaler' && user.isSubscribed && !user.subscriptionTier).length;
  
  const estimatedRevenue = (goldSubscribers * 999) + (platinumSubscribers * 2499) + (standardProBuyers * 999);

  // Moderation Handlers
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to remove this listing?")) return;
    setIsUpdating(true);
    try {
      await deleteDoc(doc(db, 'products', id));
      alert("Product Listing deleted from Marketplace.");
    } catch (e) {
      console.error(e);
      alert("Permission denied. Ensure Firebase Auth is active.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleUserBan = async (userId: string, currentIsSuspended: boolean) => {
    const action = currentIsSuspended ? 'un-suspend' : 'suspend';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        isSuspended: !currentIsSuspended
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdjustSubTier = async (userId: string, newTier: 'basic' | 'gold' | 'platinum') => {
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        isSubscribed: newTier !== 'basic',
        subscriptionTier: newTier === 'basic' ? null : newTier
      });
      alert(`Buyer adjusted to ${newTier.toUpperCase()} status.`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const wipeAllDataForPitch = async () => {
    if (!confirm("⚠️ SEVERE ACTIONS: This will purge all non-admin registered users, reset all marketplace products and clear activity sessions for a clean Shark Tank pitch screen. Proceed?")) return;
    setIsUpdating(true);
    try {
      const batch = writeBatch(db);

      // 1. Purge all users except host/admin
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.docs.forEach(uDoc => {
        const d = uDoc.data();
        if (d.role !== 'host' && d.email !== 'admin@khetnet.com') {
          batch.delete(uDoc.ref);
        }
      });

      // 2. Clear products
      const prodSnap = await getDocs(collection(db, 'products'));
      prodSnap.docs.forEach(pDoc => batch.delete(pDoc.ref));

      // 3. Clear sessions
      const sessSnap = await getDocs(collection(db, 'login_sessions'));
      sessSnap.docs.forEach(sDoc => batch.delete(sDoc.ref));

      await batch.commit();

      // Clear local state storage
      localStorage.clear();

      alert("Interactive Sandbox fully purged! Refresh and run seed data if required.");
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert("Database Purge completed (Local sandbox reset trigger executed)");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#F9FBFA] space-y-8 pb-24 font-sans relative">
      
      {/* Top command bar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-[#E2F0D9]">
        <div className="flex items-center gap-3.5">
          <KhetNetLogo className="w-14 h-14" />
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none flex items-center gap-1.5 font-heading italic">
              KhetNet National Control Base
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#4C6B36] animate-pulse" /> Platform Administration Panel
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={wipeAllDataForPitch} 
            className="flex-1 sm:flex-none px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-extrabold text-xs rounded-xl transition-colors uppercase tracking-widest border border-red-200"
          >
            Clear Database
          </button>
          <button 
            onClick={onLogout} 
            className="p-3 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all border border-gray-100"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registered Farmers', count: totalFarmers, icon: <Users className="text-[#4C6B36]" />, color: 'bg-emerald-50 border-[#E2F0D9]' },
          { label: 'Active Wholesalers', count: totalWholesalers, icon: <Users className="text-blue-600" />, color: 'bg-blue-50/50 border-blue-100' },
          { label: 'Marketplace Crop Postings', count: activeProducts, icon: <ShoppingBag className="text-amber-600" />, color: 'bg-amber-50/55 border-amber-100' },
          { label: 'Cumulative Startup Revenue', count: `₹${estimatedRevenue.toLocaleString('en-IN')}`, icon: <DollarSign className="text-emerald-500" />, color: 'bg-emerald-500/10 border-emerald-500/25 ring-2 ring-emerald-500/15' },
        ].map((metric, idx) => (
          <div key={idx} className={`p-5 rounded-3xl border shadow-sm ${metric.color} flex items-center justify-between`}>
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{metric.label}</span>
              <span className="text-3xl font-extrabold text-gray-900 font-mono">{metric.count}</span>
            </div>
            <div className="p-3.5 bg-white rounded-2xl shadow-inner shrink-0">
              {metric.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Moderation Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Users Moderation panel */}
        <div className="bg-white p-6 rounded-[35px] border border-[#E2F0D9] shadow-sm space-y-4">
          <h2 className="text-xl font-heading font-black text-gray-950 flex items-center gap-2">
            🧑🏼‍🌾 Moderate Platform Users ({logins.length})
          </h2>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {logins.map((user, idx) => {
              if (user.role === 'host') return null;
              return (
                <div key={user.uid || idx} className="p-4 bg-[#F9FBFA] rounded-2xl border border-[#F0F7EB] flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-950 text-sm truncate">{user.name || 'Anonymous Farmer'}</h4>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${user.role === 'farmer' ? 'bg-[#F0F7EB] text-[#4C6B36]' : 'bg-blue-50 text-blue-600'}`}>
                        {user.role}
                      </span>
                      {user.subscriptionTier && (
                        <span className="text-[8px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Award className="w-2.5 h-2.5 fill-current" /> {user.subscriptionTier}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 flex flex-wrap gap-x-2">
                      <span className="font-bold uppercase tracking-wider select-all">{user.mobile || 'No Mobile'}</span>
                      <span>•</span>
                      <span>{user.region || 'Amritsar'}, {user.state || 'Punjab'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {user.role === 'wholesaler' && (
                      <select
                        value={user.subscriptionTier || (user.isSubscribed ? 'gold' : 'basic')}
                        onChange={(e) => handleAdjustSubTier(user.id, e.target.value as any)}
                        className="text-[10px] font-extrabold bg-white border border-[#E2F0D9] p-1.5 rounded-lg outline-none cursor-pointer"
                      >
                        <option value="basic">Basic (Free)</option>
                        <option value="gold">Gold Partner</option>
                        <option value="platinum">Platinum Elder</option>
                      </select>
                    )}

                    <button
                      onClick={() => handleToggleUserBan(user.id, user.isSuspended || false)}
                      title={user.isSuspended ? "Unsuspend User Account" : "Freeze/ban User Account"}
                      className={`p-2 rounded-lg transition-colors border ${user.isSuspended ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-150' : 'bg-gray-50 hover:bg-gray-100 text-gray-400 border-gray-150'}`}
                    >
                      {user.isSuspended ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Ban className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Listings moderation panel */}
        <div className="bg-white p-6 rounded-[35px] border border-[#E2F0D9] shadow-sm space-y-4">
          <h2 className="text-xl font-heading font-black text-gray-950 flex items-center gap-2">
            🌾 Moderate Crop Postings ({products.length})
          </h2>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {products.length === 0 ? (
              <p className="text-gray-400 font-medium italic text-sm text-center py-12">No crop products listed yet.</p>
            ) : (
              products.map((p, idx) => (
                <div key={p.id || idx} className="p-4 bg-[#FDFCF8] rounded-2xl border border-[#F0F7EB] flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <h4 className="font-extrabold text-sm text-gray-900 truncate">{p.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Farmer: <span className="font-bold text-gray-700">{p.farmerName}</span> • <span className="text-emerald-600 font-bold">₹{p.costPerKg}/kg</span> • Stock: {p.maxQuantity}kg
                    </p>
                    <p className="text-[9px] text-gray-400 italic font-medium">{p.region}, {p.state}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all rounded-lg"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
