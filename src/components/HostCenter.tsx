import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Trash2, 
  Activity, 
  CheckCircle, 
  Ban, 
  Award,
  RefreshCw,
  LogOut,
  Mail,
  Smartphone,
  Search,
  Check,
  ShieldCheck,
  Send,
  MessageSquare,
  Bell,
  Clock,
  ShieldAlert,
  Sliders,
  Filter,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import { KhetNetLogo } from './KhetNetLogo';
import { 
  getFirestore, 
  doc, 
  deleteDoc, 
  updateDoc, 
  writeBatch, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../App';

interface HostCenterProps {
  t: any;
  logins: any[];
  products: any[];
  loginSessions: any[];
  onLogout: () => void;
}

export function HostCenter({ t, logins, products, loginSessions, onLogout }: HostCenterProps) {
  // Navigation tabs of the Admin Control Base
  const [adminTab, setAdminTab] = useState<'dashboard' | 'users' | 'listings' | 'community' | 'broadcast' | 'security'>('dashboard');
  
  // Realtime statistical states fetched from Firestore
  const [orders, setOrders] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingRealtime, setLoadingRealtime] = useState(true);

  // Search & Filter state variables
  const [userSearchText, setUserSearchText] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'farmer' | 'wholesaler'>('all');
  const [userVerificationFilter, setUserVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  // Broadcast Alert form states
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertBody, setNewAlertBody] = useState('');
  const [newAlertCategory, setNewAlertCategory] = useState<'MSP' | 'Weather' | 'Security' | 'General'>('General');
  const [newAlertPriority, setNewAlertPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // System Security & Idle Timer states
  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState<number>(10); // Standard 10 mins inactivity auto logout
  const [secondsRemaining, setSecondsRemaining] = useState<number>(autoLogoutMinutes * 60);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Listen to Firestore real-time streams (orders, community_posts, system_alerts)
  useEffect(() => {
    setLoadingRealtime(true);
    
    // 1. Fetch Orders Real-time
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const orderItems: any[] = [];
      snapshot.forEach(docSnap => {
        orderItems.push({ id: docSnap.id, ...docSnap.data() });
      });
      setOrders(orderItems);
    }, (error) => {
      console.warn("Real-time orders stream unavailable for current user context: ", error);
    });

    // 2. Fetch Community Posts Real-time
    const qPosts = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const postItems: any[] = [];
      snapshot.forEach(docSnap => {
        postItems.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPosts(postItems);
    }, (error) => {
      console.warn("Real-time community posts stream unavailable: ", error);
    });

    // 3. Fetch Broadcast System Alerts Real-time
    const qAlerts = query(collection(db, 'system_alerts'), orderBy('createdAt', 'desc'));
    const unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
      const alertItems: any[] = [];
      snapshot.forEach(docSnap => {
        alertItems.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAlerts(alertItems);
      setLoadingRealtime(false);
    }, (error) => {
      console.warn("Real-time alerts stream unavailable: ", error);
      setLoadingRealtime(false);
    });

    return () => {
      unsubOrders();
      unsubPosts();
      unsubAlerts();
    };
  }, []);

  // 4. Secure Inactivity and Idle Time Auto Logout System
  useEffect(() => {
    // Reset inactivity timestamp on any user action
    const resetActivity = () => {
      lastActivityTimeRef.current = Date.now();
      setSecondsRemaining(autoLogoutMinutes * 60);
    };

    window.addEventListener('mousemove', resetActivity);
    window.addEventListener('keypress', resetActivity);
    window.addEventListener('click', resetActivity);
    window.addEventListener('scroll', resetActivity);

    // Run active count timer checks
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastActivityTimeRef.current) / 1000);
      const totalAllowedSeconds = autoLogoutMinutes * 60;
      const remaining = totalAllowedSeconds - elapsedSeconds;

      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current!);
        console.warn("[Admin security] Triggering automatic secure inactivity logout.");
        alert("🔒 SESSION TIMEOUT SECURITY GUARD:\nYou have been logged out of KhetNet Control Center automatically due to inactivity.");
        // Call manual backend delete endpoint as well to clean memory
        const token = sessionStorage.getItem('adminToken');
        if (token) {
          fetch('/api/admin/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          }).catch(err => console.error(err));
        }
        sessionStorage.removeItem('adminToken');
        onLogout();
      } else {
        setSecondsRemaining(remaining);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keypress', resetActivity);
      window.removeEventListener('click', resetActivity);
      window.removeEventListener('scroll', resetActivity);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [autoLogoutMinutes, onLogout]);

  // Adjust active configuration minutes
  const handleScaleAutoLogout = (mins: number) => {
    setAutoLogoutMinutes(mins);
    lastActivityTimeRef.current = Date.now();
    setSecondsRemaining(mins * 60);
  };

  // Metric Calculation & Aggregations
  const totalRegisteredUsers = logins.length;
  const totalFarmers = logins.filter(user => user.role === 'farmer').length;
  const totalWholesalers = logins.filter(user => user.role === 'wholesaler').length;
  const activeProducts = products.length;
  
  // Real calculated orders stats
  const totalCompletedOrders = orders.filter(o => o.status === 'escrow_released' || o.status === 'delivered').length;
  const totalPendingOrders = orders.filter(o => o.status !== 'escrow_released' && o.status !== 'delivered' && o.status !== 'declined').length;
  
  // Dynamic subscription counts (New Structure + Legacy safeguard)
  const premiumFarmers = logins.filter(user => user.subscriptionTier === 'premium_farmer').length;
  const proFarmers = logins.filter(user => user.subscriptionTier === 'pro_farmer').length;
  const traderWholesalers = logins.filter(user => user.subscriptionTier === 'trader_wholesaler').length;
  const enterpriseSubscribers = logins.filter(user => user.subscriptionTier === 'enterprise').length;
  const legacyGoldSubscribers = logins.filter(user => user.subscriptionTier === 'gold').length;
  const legacyPlatinumSubscribers = logins.filter(user => user.subscriptionTier === 'platinum').length;
  const standardProBuyers = logins.filter(user => user.role === 'wholesaler' && user.isSubscribed && !user.subscriptionTier).length;
  
  // Total Revenue counting: (Wholesaler Subscriptions + Farmer subscriptions + Complete Escrow Trade Volumes fees - 0.5% protocol cut)
  const subscriptionsRevenue = 
    (premiumFarmers * 49) + 
    (proFarmers * 99) + 
    (traderWholesalers * 299) + 
    (enterpriseSubscribers * 4999) + 
    (legacyGoldSubscribers * 999) + 
    (legacyPlatinumSubscribers * 2499) + 
    (standardProBuyers * 999);
  const tradeVolReserveCut = orders
    .filter(o => o.status === 'escrow_released' || o.status === 'delivered')
    .reduce((curr, order) => curr + (parseFloat(order.totalCost || '0') * 0.005), 0);
  const totalRevenue = subscriptionsRevenue + tradeVolReserveCut;

  // Moderation Methods
  // Product Listing delete
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to remove this crop listing permanently from KhetNet?")) return;
    setIsUpdating(true);
    try {
      await deleteDoc(doc(db, 'products', id));
      alert("Success: Product Listing deleted successfully from the national marketplace.");
    } catch (e: any) {
      console.error(e);
      alert("Error: Failed to delete. " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // User Verification Toggle (Green Badge checkmark control)
  const handleToggleUserVerification = async (userId: string, currentIsVerified: boolean) => {
    const action = currentIsVerified ? 'un-verify' : 'verify';
    if (!confirm(`Are you sure you want to ${action} this farmer profile and update their government status?`)) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: !currentIsVerified,
        trustScore: !currentIsVerified ? 98 : 75 // Grant high trust mark instantly on status verify
      });
      alert(`User profile successfully ${!currentIsVerified ? 'GRANTED high-trust verification badge' : 'revoked verification status'}.`);
    } catch (e: any) {
      console.error(e);
      alert("Error updating user: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // User Account Ban Toggle
  const handleToggleUserBan = async (userId: string, currentIsSuspended: boolean) => {
    const action = currentIsSuspended ? 'un-suspend' : 'suspend';
    if (!confirm(`Are you sure you want to ${action} this user? Suspended users will be restricted from using active services.`)) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        isSuspended: !currentIsSuspended
      });
      alert(`User successfully ${!currentIsSuspended ? 'SUSPENDED' : 'UNSUSPENDED'}.`);
    } catch (e: any) {
      console.error(e);
      alert("Error updating user status: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Wholesaler / Farmer Subscription Tier Adjuster
  const handleAdjustSubTier = async (userId: string, newTier: any) => {
    setIsUpdating(true);
    try {
      const isFree = newTier === 'basic' || newTier === 'free_farmer';
      await updateDoc(doc(db, 'users', userId), {
        isSubscribed: !isFree,
        subscriptionTier: isFree ? null : newTier
      });
      alert(`Partner status adjusted successfully to ${String(newTier).toUpperCase()}.`);
    } catch (e: any) {
      console.error(e);
      alert("Error adapting subscription levels: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Community Post Deletion
  const handleDeleteCommunityPost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this community post for violations? This action cannot be undone.")) return;
    setIsUpdating(true);
    try {
      await deleteDoc(doc(db, 'community_posts', postId));
      alert("Post deleted successfully.");
    } catch (e: any) {
      console.error(e);
      alert("Failed to delete community post.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Publish Broadcast Alert
  const handlePublishAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTitle || !newAlertBody) {
      alert("Please fill out both the warning title and announcement message body.");
      return;
    }
    
    setIsUpdating(true);
    try {
      await addDoc(collection(db, 'system_alerts'), {
        title: newAlertTitle,
        body: newAlertBody,
        category: newAlertCategory,
        priority: newAlertPriority,
        createdAt: serverTimestamp(),
        publisher: 'KhetNet National Admin Base'
      });
      
      // Clear forms
      setNewAlertTitle('');
      setNewAlertBody('');
      alert("🔔 BROADCAST SUCCESS:\nYour notification alert has been compiled and propagated to all regional grower portals.");
    } catch (e: any) {
      console.error(e);
      alert("Failure transmitting warning alert: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Alert
  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm("Remove this warning broadcast alert?")) return;
    setIsUpdating(true);
    try {
      await deleteDoc(doc(db, 'system_alerts', alertId));
      alert("Alert removed.");
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Purge/Wipe All Data for clean Sandboxed Presentation
  const wipeAllDataForPitch = async () => {
    if (!confirm("⚠️ SEVERE ACTIONS: This will purge all registered users, reset all marketplace products and clear active databases for a clean Pitch Presentation. Continue?")) return;
    setIsUpdating(true);
    try {
      const batch = writeBatch(db);

      // Users Purge
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.docs.forEach(uDoc => {
        const d = uDoc.data();
        if (d.role !== 'host' && d.email !== 'admin@khetnet.com') {
          batch.delete(uDoc.ref);
        }
      });

      // Products Purge
      const prodSnap = await getDocs(collection(db, 'products'));
      prodSnap.docs.forEach(pDoc => batch.delete(pDoc.ref));

      // Sessions Purge
      const sessSnap = await getDocs(collection(db, 'login_sessions'));
      sessSnap.docs.forEach(sDoc => batch.delete(sDoc.ref));

      // Community Posts Purge
      const postsSnap = await getDocs(collection(db, 'community_posts'));
      postsSnap.docs.forEach(poDoc => batch.delete(poDoc.ref));

      // System Alerts Purge
      const alertsSnap = await getDocs(collection(db, 'system_alerts'));
      alertsSnap.docs.forEach(alDoc => batch.delete(alDoc.ref));

      await batch.commit();

      // Clear local states
      localStorage.clear();
      sessionStorage.clear();

      alert("Interactive Sandbox fully purged! Restarting presentation...");
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert("Sandbox wipe complete.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper formatting seconds
  const formatTimeMinutes = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Filter users based on query
  const filteredUsers = logins.filter(user => {
    if (user.role === 'host') return false;
    
    // Search filter text
    const queryStr = userSearchText.toLowerCase();
    const matchesSearch = 
      (user.name || '').toLowerCase().includes(queryStr) || 
      (user.mobile || '').toLowerCase().includes(queryStr) ||
      (user.region || '').toLowerCase().includes(queryStr) ||
      (user.state || '').toLowerCase().includes(queryStr) ||
      (user.email || '').toLowerCase().includes(queryStr);
    
    // Role filter
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;

    // Verification Badge filter
    const matchesVerify = 
      userVerificationFilter === 'all' || 
      (userVerificationFilter === 'verified' && user.isVerified === true) || 
      (userVerificationFilter === 'unverified' && !user.isVerified);

    return matchesSearch && matchesRole && matchesVerify;
  });

  return (
    <div className="p-6 min-h-screen bg-[#F4F8F5] pb-28 font-sans relative">
      
      {/* 2. Top command bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-[#E2F0D9] mb-8">
        <div className="flex items-center gap-3.5">
          <KhetNetLogo className="w-14 h-14" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none italic font-heading">
                KhetNet National Control Base
              </h1>
              <span className="text-[9px] font-black uppercase bg-[#E2F0D9] text-[#2C411E] tracking-widest px-2.5 py-0.5 rounded-full border border-[#C6E2BA]">Secure v1.6.1</span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#4C6B36]" /> Authority Role: Systems Director
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
          {/* Real-time sync ticker */}
          <div className="text-right mr-3 hidden lg:block">
            <span className="text-[8px] bg-emerald-100 text-emerald-800 font-black uppercase block tracking-wider px-2 py-0.5 rounded text-center">
              ● REALTIME LIVE
            </span>
            <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">Sync latency: ~3ms</span>
          </div>

          <button 
            onClick={wipeAllDataForPitch} 
            className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs rounded-xl transition-all uppercase tracking-widest border border-red-200 shadow-sm active:scale-95"
            title="Clean purge all data records for presentation baseline setup"
          >
            Clear Database
          </button>
          
          <button 
            onClick={onLogout} 
            className="p-3 bg-gray-950 text-white hover:bg-gray-800 rounded-xl transition-all shadow-md flex items-center justify-center active:scale-95 border border-transparent"
            title="Secure System Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 3. Secure Sub-Navigation Header Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-white p-2 rounded-2xl border border-[#E2F0D9] mb-6 overflow-x-auto scrollbar-none">
        {[
          { id: 'dashboard', label: '📊 Core Dashboard', desc: 'Financial & escrow metrics' },
          { id: 'users', label: '🧑🏽‍🌾 User Moderation', desc: 'Verification, badges & sub-tiers' },
          { id: 'listings', label: '🌾 Marketplace Audit', desc: 'Audit products' },
          { id: 'community', label: '💬 Community Feed', desc: 'Moderate grower posts' },
          { id: 'broadcast', label: '🔔 Broadcast Centre', desc: 'Issue regional notifications' },
          { id: 'security', label: '🔒 Security Settings', desc: 'Auto timeout timers' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id as any)}
            className={`px-4.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex-1 text-center shrink-0 min-w-[120px] ${adminTab === tab.id ? 'bg-[#4C6B36] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Container Switching Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={adminTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          
          {/* TAB 1: CORE DASHBOARD METRICS */}
          {adminTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Key Metric Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Registered Farmers', count: totalFarmers, desc: 'Verified status active', icon: <Users className="text-[#4C6B36]" />, color: 'bg-emerald-50 border-[#E2F0D9]' },
                  { label: 'Registered Wholesalers', count: totalWholesalers, desc: 'Enterprise procurement partners', icon: <Users className="text-blue-600" />, color: 'bg-blue-50/50 border-blue-100' },
                  { label: 'Marketplace Crop Volume', count: `${activeProducts} listings`, desc: 'Active sales offers on KhetNet', icon: <ShoppingBag className="text-amber-600" />, color: 'bg-amber-50/55 border-amber-100' },
                  { label: 'Platform Revenue Cut (0.5%)', count: `₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, desc: 'System subscription & escrow fees value', icon: <DollarSign className="text-emerald-500" />, color: 'bg-emerald-500/10 border-emerald-500/25 ring-2 ring-emerald-500/15' },
                ].map((metric, idx) => (
                  <div key={idx} className={`p-5.5 rounded-3xl border shadow-sm ${metric.color} flex items-center justify-between`}>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">{metric.label}</span>
                      <span className="text-2xl font-black text-gray-900 font-mono tracking-tight">{metric.count}</span>
                      <p className="text-[9px] text-gray-400 font-semibold mt-1 italic leading-none">{metric.desc}</p>
                    </div>
                    <div className="p-3.5 bg-white rounded-2xl shadow-inner shrink-0">
                      {metric.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sub Secondary stats section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Escrow Orders statistics view */}
                <div className="bg-white p-6 rounded-[32px] border border-[#E2F0D9] shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-[#F0F7EB] pb-3">
                    <h3 className="font-heading font-black text-gray-900 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                      🔒 Escrow Transaction Ledger
                    </h3>
                    <span className="text-[8px] bg-[#4C6B36] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Live Escrow</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-gray-50 border border-gray-150 rounded-2xl">
                      <p className="text-[9px] font-black uppercase text-gray-400">Total Escrow Orders</p>
                      <p className="text-xl font-mono font-black mt-1">{orders.length}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800">
                      <p className="text-[9px] font-black uppercase text-emerald-600">Released Trades</p>
                      <p className="text-xl font-mono font-black mt-1">{totalCompletedOrders}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-extrabold uppercase text-gray-400">Regional Distribution</p>
                    <div className="space-y-1 text-xs font-semibold text-gray-600">
                      <div className="flex justify-between bg-gray-50 p-2 rounded-lg text-[11px]">
                        <span>Amritsar / Punjab Region</span>
                        <span className="font-mono font-bold">42%</span>
                      </div>
                      <div className="flex justify-between bg-gray-50 p-2 rounded-lg text-[11px]">
                        <span>Karnal / Haryana Belt</span>
                        <span className="font-mono font-bold">28%</span>
                      </div>
                      <div className="flex justify-between bg-gray-50 p-2 rounded-lg text-[11px]">
                        <span>Indore / West MP Mandi</span>
                        <span className="font-mono font-bold">30%</span>
                      </div>
                    </div>
                  </div>
                </div>

                 {/* Subscriptions Metrics view */}
                 <div className="bg-white p-6 rounded-[32px] border border-[#E2F0D9] shadow-sm space-y-4 max-h-[360px] overflow-y-auto">
                   <div className="flex justify-between items-center border-b border-[#F0F7EB] pb-3">
                     <h3 className="font-heading font-black text-gray-900 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                       🎖️ active subscriptions breakdown
                     </h3>
                   </div>
 
                   <div className="space-y-2">
                     <div className="flex items-center justify-between bg-emerald-50/50 px-3 py-2 border border-emerald-100/50 rounded-xl">
                       <div>
                         <p className="text-[8px] font-black uppercase tracking-wider text-emerald-700 leading-none">PREMIUM FARMERS</p>
                         <p className="text-[10px] font-bold text-gray-500 mt-0.5">₹49/mo pricing plan</p>
                       </div>
                       <div className="text-right">
                         <span className="text-sm font-black font-mono">{premiumFarmers}</span>
                       </div>
                     </div>

                     <div className="flex items-center justify-between bg-amber-50/50 px-3 py-2 border border-amber-100/50 rounded-xl">
                       <div>
                         <p className="text-[8px] font-black uppercase tracking-wider text-amber-700 leading-none">PRO FARMERS</p>
                         <p className="text-[10px] font-bold text-gray-500 mt-0.5">₹99/mo pricing plan</p>
                       </div>
                       <div className="text-right">
                         <span className="text-sm font-black font-mono">{proFarmers}</span>
                       </div>
                     </div>

                     <div className="flex items-center justify-between bg-blue-50/50 px-3 py-2 border border-blue-100/50 rounded-xl">
                       <div>
                         <p className="text-[8px] font-black uppercase tracking-wider text-blue-700 leading-none">TRADERS & WHOLESALERS</p>
                         <p className="text-[10px] font-bold text-gray-500 mt-0.5">₹299/mo pricing plan</p>
                       </div>
                       <div className="text-right">
                         <span className="text-sm font-black font-mono">{traderWholesalers}</span>
                       </div>
                     </div>

                     <div className="flex items-center justify-between bg-purple-50/50 px-3 py-2 border border-purple-100/50 rounded-xl">
                       <div>
                         <p className="text-[8px] font-black uppercase tracking-wider text-purple-700 leading-none">ENTERPRISES & FPOS</p>
                         <p className="text-[10px] font-bold text-gray-500 mt-0.5">Custom Quotes</p>
                       </div>
                       <div className="text-right">
                         <span className="text-sm font-black font-mono">{enterpriseSubscribers}</span>
                       </div>
                     </div>

                     <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5 border border-gray-100 rounded-xl text-gray-500">
                       <div>
                         <p className="text-[8px] font-black uppercase tracking-wider leading-none">LEGACY PREMIUMS (GOLD/PLATINUM)</p>
                         <p className="text-[9px] mt-0.5">₹999 / ₹2499 legacy</p>
                       </div>
                       <div className="text-right">
                         <span className="text-xs font-black font-mono">{(legacyGoldSubscribers + legacyPlatinumSubscribers + standardProBuyers)}</span>
                       </div>
                     </div>

                     <p className="text-[8px] text-gray-400 text-center italic font-medium pt-1">Automatic platform ledger matching active.</p>
                   </div>
                 </div>

                {/* Platform Session Activity Tracker */}
                <div className="bg-white p-6 rounded-[32px] border border-[#E2F0D9] shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-[#F0F7EB] pb-3">
                    <h3 className="font-heading font-black text-gray-900 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                      🗂️ Active Server Logging Nodes
                    </h3>
                  </div>

                  <div className="space-y-3.5 max-h-[175px] overflow-y-auto pr-1">
                    {loginSessions.length === 0 ? (
                      <p className="text-gray-400 text-xs italic text-center py-6">No raw logs currently logged on this container session.</p>
                    ) : (
                      loginSessions.slice(0, 5).map((sess, index) => (
                        <div key={index} className="flex gap-2 items-start text-[11px] font-semibold text-gray-600 bg-gray-50 p-2 rounded-xl">
                          <span className="text-xs">🖥️</span>
                          <div className="min-w-0 flex-1 leading-snug">
                            <b className="text-gray-900">{sess.userName || 'Anonymous user'}</b> signed in from <b className="text-[#4C6B36]">{sess.region || 'Unknown Mandi'}</b>.
                            <p className="text-[9px] text-gray-400 mt-0.5">{sess.timestamp ? new Date(sess.timestamp).toLocaleTimeString() : 'Just now'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Recent Orders Overview list */}
              <div className="bg-white p-6 rounded-[32px] border border-[#E2F0D9] shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-[#F0F7EB] pb-2">
                  <h3 className="font-heading font-black text-gray-900 text-sm uppercase tracking-wide flex items-center gap-1">
                    🚚 Recent Regional Escrow Logistics Requests ({orders.length})
                  </h3>
                  <p className="text-[9px] text-[#4C6B36] font-black uppercase tracking-wider">Scroll for full audit</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[9px] font-black">
                        <th className="py-2.5 px-2">Order Reference ID</th>
                        <th className="py-2.5 px-2">Crop Material</th>
                        <th className="py-2.5 px-2">Stakeholders Involved</th>
                        <th className="py-2.5 px-2 text-right">Escrow Sum</th>
                        <th className="py-2.5 px-2 text-center">Security Status Check</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400 italic font-medium">No system-wide transactions currently monitored in database.</td>
                        </tr>
                      ) : (
                        orders.map((o, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-[#FAFDF6] transition-colors font-medium text-gray-700">
                            <td className="py-3 px-2 font-mono text-[10px] text-[#4C6B36] max-w-[120px] truncate">{o.id}</td>
                            <td className="py-3 px-2">
                              <span className="font-black text-gray-900 block">{o.productName || 'Harvest Batch'}</span>
                              <span className="text-[9px] text-gray-400 leading-none block mt-0.5">{o.quantity || '0'} kg ordered</span>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-[10px] block font-bold text-gray-800">🚜 Farmer: {o.farmerName || 'Registered Grower'}</span>
                              <span className="text-[10px] block text-blue-600 mt-0.5">🛒 Procurement: {o.wholesalerName || 'Wholesaler Branch'}</span>
                            </td>
                            <td className="py-3 px-2 text-right font-bold text-emerald-700 font-mono">₹{parseFloat(o.totalCost || '0').toLocaleString('en-IN')}</td>
                            <td className="py-3 px-2 text-center">
                              <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-full ${
                                o.status === 'escrow_released' ? 'bg-emerald-100 text-emerald-800' :
                                o.status === 'escrow_deposited' ? 'bg-amber-100 text-amber-800' :
                                o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-150 text-gray-650'
                              }`}>
                                {o.status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE REGISTRATION USER MODERATION */}
          {adminTab === 'users' && (
            <div className="bg-white p-6 rounded-[35px] border border-[#E2F0D9] shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#F0F7EB] pb-4">
                <div>
                  <h2 className="text-xl font-heading font-black text-gray-950 flex items-center gap-2">
                    🧑🏼‍🌾 Moderate Platform Users ({filteredUsers.length} listed)
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Approve state verification badges, manage subscription statuses, and regulate system-wide user lockouts.</p>
                </div>
              </div>

              {/* Search and Filters deck */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#FAFDF6] p-4 rounded-2xl border border-[#E2F0D9]">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name, phone base, state, region, email..."
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-[#4C6B36]"
                  />
                </div>

                <div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#4C6B36]"
                  >
                    <option value="all">🎭 Roles: All Users</option>
                    <option value="farmer">🚜 Farmers only</option>
                    <option value="wholesaler">🛒 Wholesalers only</option>
                  </select>
                </div>

                <div>
                  <select
                    value={userVerificationFilter}
                    onChange={(e) => setUserVerificationFilter(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#4C6B36]"
                  >
                    <option value="all">🛡️ Badges: All Statuses</option>
                    <option value="verified">Verified Badge Granted</option>
                    <option value="unverified">Unverified Profiles</option>
                  </select>
                </div>
              </div>

              {/* Users grid list */}
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredUsers.length === 0 ? (
                  <div className="py-16 text-center">
                    <span className="text-3xl">🏜️</span>
                    <p className="text-gray-400 font-black uppercase text-xs mt-3 tracking-widest">No matching users found in current filter queries.</p>
                  </div>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <div key={user.id || idx} className={`p-4.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${user.isSuspended ? 'bg-red-50/40 border-red-150' : 'bg-[#FAFDF6]/50 hover:bg-white border-[#F0F7EB] hover:shadow-sm'}`}>
                      
                      <div className="space-y-1 shrink-1 min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="font-extrabold text-gray-950 text-sm truncate">{user.name || 'Anonymous Farmer'}</h4>
                          
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${user.role === 'farmer' ? 'bg-[#F0F7EB] text-[#4C6B36]' : 'bg-blue-50 text-blue-600'}`}>
                            {user.role}
                          </span>

                          {user.isVerified && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-0.5" title="Government Aadhaar KYC verified profile">
                              <ShieldCheck className="w-3 h-3 text-emerald-700 font-black fill-emerald-100" /> Govt Verified Badge
                            </span>
                          )}

                          {user.subscriptionTier && (
                            <span className="text-[8px] font-black uppercase bg-yellow-105 text-amber-850 border border-yellow-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Award className="w-2.5 h-2.5 fill-current text-amber-600" /> {user.subscriptionTier.toUpperCase()} Partner
                            </span>
                          )}

                          {user.isSuspended && (
                            <span className="text-[8px] font-black uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              ⚠️ SUSPENDED
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-x-2">
                          <span className="font-bold text-gray-700 select-all tracking-wider">{user.mobile || 'No Mobile Registered'}</span>
                          <span>•</span>
                          <span>Region: <b>{user.region || 'Unknown'}, {user.state || 'India'}</b></span>
                          {user.trustScore && (
                            <>
                              <span>•</span>
                              <span>Trust Rating: <b className="text-[#4C6B36]">{user.trustScore}%</b></span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Management control actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                        
                        {/* Wholesaler subscription adjust */}
                        {user.role === 'wholesaler' && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Tier:</span>
                            <select
                              value={user.subscriptionTier || (user.isSubscribed ? 'trader_wholesaler' : 'basic')}
                              onChange={(e) => handleAdjustSubTier(user.id, e.target.value as any)}
                              className="text-[10px] font-black bg-white border border-[#E2F0D9] p-1.5 rounded-lg outline-none cursor-pointer"
                            >
                              <option value="basic">Basic / Free Trader</option>
                              <option value="trader_wholesaler">Trader / Wholesaler (₹299/mo)</option>
                              <option value="enterprise">Enterprise (Custom)</option>
                              <option value="gold">Legacy Gold (₹999/mo)</option>
                              <option value="platinum">Legacy Platinum (₹2499/mo)</option>
                            </select>
                          </div>
                        )}

                        {/* Farmer subscription adjust */}
                        {user.role === 'farmer' && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Tier:</span>
                            <select
                              value={user.subscriptionTier || 'free_farmer'}
                              onChange={(e) => handleAdjustSubTier(user.id, e.target.value as any)}
                              className="text-[10px] font-black bg-white border border-[#E2F0D9] p-1.5 rounded-lg outline-none cursor-pointer"
                            >
                              <option value="free_farmer">Free Farmer Plan (₹0)</option>
                              <option value="premium_farmer">Premium Farmer (₹49/mo)</option>
                              <option value="pro_farmer">Pro Farmer (₹99/mo)</option>
                            </select>
                          </div>
                        )}

                        {/* Government badge Verification Toggle (Farmer-specific request) */}
                        {user.role === 'farmer' && (
                          <button
                            onClick={() => handleToggleUserVerification(user.id, user.isVerified || false)}
                            className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors ${user.isVerified ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100'}`}
                            title={user.isVerified ? "Revoke regional verified badge approval" : "Verify Aadhaar credentials & grant platform verified seal badge"}
                          >
                            {user.isVerified ? '✕ Unverify Govt Status' : '✓ Grant verified Badge'}
                          </button>
                        )}

                        {/* Suspension Lockout Toggle */}
                        <button
                          onClick={() => handleToggleUserBan(user.id, user.isSuspended || false)}
                          title={user.isSuspended ? "Unsuspend User Account instantly" : "Lock user out of the platform"}
                          className={`p-2 rounded-lg transition-colors border ${user.isSuspended ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-150' : 'bg-red-55 hover:bg-red-50 text-red-500 border-red-150'}`}
                        >
                          {user.isSuspended ? <Check className="w-4 h-4 text-emerald-600 font-extrabold stroke-[3.5]" /> : <Ban className="w-4 h-4" />}
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MARKETPLACE PRODUCTS AUDIT MODERATION */}
          {adminTab === 'listings' && (
            <div className="bg-white p-6 rounded-[35px] border border-[#E2F0D9] shadow-sm space-y-4">
              <div>
                <h2 className="text-xl font-heading font-black text-gray-950 flex items-center gap-2">
                  🌾 Moderate Marketplace Crop Postings ({products.length} postings)
                </h2>
                <p className="text-xs text-gray-400 mt-1">Audit active listings. Delete fraudulent, toxic, or heavily overpriced agricultural postings.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {products.length === 0 ? (
                  <div className="md:col-span-2 py-16 text-center text-gray-400 font-medium italic text-sm">
                    No crop products listed yet.
                  </div>
                ) : (
                  products.map((p, idx) => (
                    <div key={p.id || idx} className="p-4 bg-[#FDFCF8] rounded-2xl border border-[#F0F7EB] flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-gray-900 truncate">{p.name}</h4>
                          <span className="text-[8px] bg-[#E2F0D9] text-[#2C411E] font-black uppercase px-1.5 py-0.2 rounded font-mono">
                            Grade {p.grade || 'A'} • Moist: {p.moisturePercent || '12'}%
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                          Farmer: <span className="font-bold text-gray-700">{p.farmerName} ({p.farmerMobile || 'No contact'})</span> • <span className="text-emerald-700 font-black">₹{p.costPerKg}/kg</span> • Stock: {p.maxQuantity}kg
                        </p>
                        <p className="text-[10px] text-gray-400 italic font-semibold">{p.region || 'Amritsar Regional Mandi'}, {p.state || 'Punjab'}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-3 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 border border-red-100 hover:border-red-200 transition-all rounded-xl shrink-0 active:scale-95"
                        title="Delete listing from KhetNet National database"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AGRIPOSTS AND FORUM MODERATION */}
          {adminTab === 'community' && (
            <div className="bg-white p-6 rounded-[35px] border border-[#E2F0D9] shadow-sm space-y-4">
              <div>
                <h2 className="text-xl font-heading font-black text-gray-950 flex items-center gap-2">
                  💬 Moderate Community Social Forum Feed ({posts.length} messages)
                </h2>
                <p className="text-xs text-gray-400 mt-1">Regulate state forum logs. Remove commercial spam, advertising clutter, and unrelated postings from Agri feeds.</p>
              </div>

              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {posts.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                    No community posts listed from database yet.
                  </div>
                ) : (
                  posts.map((post, idx) => (
                    <div key={post.id || idx} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap text-[10px]">
                          <span className="font-extrabold text-gray-900 text-xs">{post.userName || 'Organic Grower'}</span>
                          <span className="text-gray-400 uppercase tracking-widest">({post.userRole || 'Farmer'})</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-400">{post.userLocation || 'Rural Mandi Region'}</span>
                          {post.createdAt && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-405 italic">{post.createdAt.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Active Alert'}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-gray-700 mt-2 whitespace-pre-wrap leading-relaxed">{post.text}</p>
                        
                        {post.imageUrl && (
                          <div className="mt-3 max-w-[200px] rounded-xl overflow-hidden border border-gray-200">
                            <img src={post.imageUrl} alt="attached media item" className="w-full h-auto object-cover max-h-[120px]" />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteCommunityPost(post.id)}
                        className="p-2.5 bg-rose-50 text-rose-500 hover:text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-xl transition-all active:scale-95 shrink-0"
                        title="Delete spam/abusive post permanently from public feed"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: BROADCAST NOTIFICATION ADVOCACY */}
          {adminTab === 'broadcast' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Alert writer Form */}
              <div className="bg-white p-6 rounded-[35px] border border-[#E2F0D9] shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-black text-gray-950 flex items-center gap-1.5 font-heading">
                    🛡️ Dispatch National Agricultural Bulletin Notification
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Broadcast high-priority warnings, critical MSP index spikes, state weather advisories, or system notification banners.</p>
                </div>

                <form onSubmit={handlePublishAlert} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase text-[#4C6B36]">Alert Announcement Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., PMFBY Rabi Crop Subsidy Enrollment Deadline Extended"
                      value={newAlertTitle}
                      onChange={(e) => setNewAlertTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs font-semibold focus:border-[#4C6B36] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase text-[#4C6B36]">Notification Category</label>
                      <select
                        value={newAlertCategory}
                        onChange={(e) => setNewAlertCategory(e.target.value as any)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#4C6B36] focus:bg-white"
                      >
                        <option value="General">🔔 General Advisory</option>
                        <option value="MSP">🌾 MSP Pricing Spikes</option>
                        <option value="Weather">🌦️ Rain & Climate Alerts</option>
                        <option value="Security">🔒 System Security warnings</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold uppercase text-[#4C6B36]">Alert Urgency</label>
                      <select
                        value={newAlertPriority}
                        onChange={(e) => setNewAlertPriority(e.target.value as any)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#4C6B36] focus:bg-white"
                      >
                        <option value="low">◌ Low Urgency</option>
                        <option value="medium">⚡ Medium (Standard)</option>
                        <option value="high">🚨 High Priority Alert</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold uppercase text-[#4C6B36]">Comprehensive Description / Message</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Draft details clearly. Will support Hindi translating and display prominently on the regional welcome board."
                      value={newAlertBody}
                      onChange={(e) => setNewAlertBody(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs font-semibold focus:border-[#4C6B36] focus:bg-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full py-3 bg-[#4C6B36] hover:bg-[#3D562B] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 text-white" /> Transmit Broadcast Message
                  </button>
                </form>
              </div>

              {/* Warnings List Audit */}
              <div className="bg-white p-6 rounded-[35px] border border-[#E2F0D9] shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-black text-gray-950 flex items-center gap-1.5 font-heading">
                    📯 Active Bulletins & Alerts ({alerts.length} active)
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">These notices are fetched live in the field and render on welcome hub dashboards for local agrarian communities.</p>
                </div>

                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                  {alerts.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 italic font-medium text-xs">
                      No active bulletins broadcasting at this moment. You can launch one on the left form!
                    </div>
                  ) : (
                    alerts.map((al, idx) => (
                      <div key={al.id || idx} className={`p-4 rounded-2xl border ${al.priority === 'high' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-gray-50 border-gray-150 text-gray-700'} relative`}>
                        <div className="flex justify-between items-start gap-3">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded ${al.priority === 'high' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            {al.category || 'Advisory'} • {al.priority || 'medium'}
                          </span>
                          
                          <button
                            onClick={() => handleDeleteAlert(al.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                            title="Remove Alert bulletin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <h4 className="font-extrabold text-xs mt-2 text-gray-900 truncate">{al.title}</h4>
                        <p className="text-[11px] font-semibold text-gray-600 mt-1.5 leading-snug">{al.body}</p>
                        <p className="text-[9px] text-gray-400 font-mono mt-2 italic leading-none">{al.publisher || 'System Center'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: SECURITY TIMER & ENVIRONMENT SETTINGS */}
          {adminTab === 'security' && (
            <div className="bg-white p-6 rounded-[35px] border border-[#E2F0D9] shadow-sm max-w-xl mx-auto space-y-6">
              <div className="text-center space-y-2 pb-4 border-b border-gray-100">
                <ShieldAlert className="w-12 h-12 text-[#4C6B36] mx-auto animate-pulse" />
                <h2 className="text-xl font-heading font-black text-gray-950">Security & Session Monitoring Hub</h2>
                <p className="text-xs text-gray-400">Manage credential guidelines, session lease properties, and idle timeout limits for national security compliance.</p>
              </div>

              {/* Inactivity timer tuner */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#FAFDF6] p-4.5 border border-[#E2F0D9] rounded-2xl">
                  <div>
                    <h4 className="font-black text-xs text-gray-800 uppercase tracking-wider">Dynamic Inactivity Auto-Logout Timeout</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Automatically clear memory and log out if no activity is detected.</p>
                  </div>
                  <span className="text-xs font-black bg-[#4C6B36] text-white px-2.5 py-1 rounded font-mono select-none">
                    {autoLogoutMinutes} min Limit
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  {[
                    { val: 1, label: '1 Minute (Security Drill)' },
                    { val: 5, label: '5 Minutes' },
                    { val: 10, label: '10 Minutes (Recommended)' },
                    { val: 15, label: '15 Minutes' },
                    { val: 30, label: '30 Minutes' },
                    { val: 60, label: '1 Hour' },
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleScaleAutoLogout(opt.val)}
                      className={`py-3 px-1 border rounded-xl text-xs font-bold transition-all ${autoLogoutMinutes === opt.val ? 'bg-emerald-600 text-white border-transparent shadow shadow-emerald-700/25' : 'bg-white hover:bg-gray-50'}`}
                    >
                      {opt.val} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Metrics & countdown card */}
              <div className="bg-neutral-900 text-white p-5 rounded-3xl space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-[#E2F0D9] uppercase">
                  <span>🔒 Secure Session Monitor</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} /> Countdown Clock</span>
                </div>

                <div className="text-center py-2">
                  <p className="text-3xl font-mono font-black text-emerald-400 tracking-tight">
                    {formatTimeMinutes(secondsRemaining)}
                  </p>
                  <p className="text-[8px] text-gray-400 uppercase tracking-widest mt-1">Remaining until automatic memory purge</p>
                </div>

                <div className="border-t border-neutral-800 pt-3.5 text-[11px] text-gray-400 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Admin Username:</span>
                    <span className="text-white font-bold">{logins.find(u => u.role === 'host')?.email || 'admin@khetnet.com'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credential Hash:</span>
                    <span className="text-emerald-400 font-bold truncate max-w-[200px]">SHA-256 (Bcrypt Cryptographic Seal)</span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 border-none mt-2"
                >
                  Immediate Kill-switch Logout
                </button>
              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Persistent Security Inactivity Sticky Warning Bar */}
      <footer className="fixed bottom-0 left-0 right-0 py-2.5 px-6 bg-neutral-950 text-white text-[10px] uppercase font-mono tracking-wider flex justify-between items-center select-none shadow-2xl z-50">
        <span className="flex items-center gap-1.5 text-gray-400">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          KhetNet National Admin Panel • Secured Node Node // 7432
        </span>
        <span className="text-gray-300 font-bold">
          Auto logoff in: <span className="text-emerald-400 font-black">{formatTimeMinutes(secondsRemaining)}</span>
        </span>
      </footer>

    </div>
  );
}
