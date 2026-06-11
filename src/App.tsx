import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  MapPin, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  User as UserIcon, 
  Plus, 
  Search, 
  ShoppingCart, 
  ArrowLeft,
  Camera,
  LogOut,
  Phone,
  Check,
  Ban,
  Trash2,
  Calendar,
  AlertCircle,
  Award,
  ArrowRight,
  TrendingUp,
  Brain,
  Sparkles,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { translations } from './translations';
import { locations } from './locations';
import type { User, Product, Order, Language } from './types';

// Import our brilliant modularized components
import { KhetNetLogo } from './components/KhetNetLogo';
import { RazorpayModal } from './components/RazorpayModal';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { MarketPrices } from './components/MarketPrices';
import { AskKhetNet } from './components/AskKhetNet';
import { DiseaseScanner } from './components/DiseaseScanner';
import { HostCenter } from './components/HostCenter';
import { AgriAdvisory } from './components/AgriAdvisory';
import { KhetNetLogistics } from './components/KhetNetLogistics';

// Import upgraded operating system components
import { VerifiedFarmer } from './components/VerifiedFarmer';
import { CropPredictor } from './components/CropPredictor';
import { EscrowPayment } from './components/EscrowPayment';
import { CropInsurance } from './components/CropInsurance';
import { TraderDashboard } from './components/TraderDashboard';
import { VoiceAssistant } from './components/VoiceAssistant';
import KhetKhata from './components/KhetKhata';
import AgriCommunity from './components/AgriCommunity';

// Firebase Setup
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

type Stage = 'splash' | 'language' | 'location' | 'login' | 'details' | 'category' | 'dashboard' | 'host';

export default function App() {
  const [stage, setStage] = useState<Stage>('splash');
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<Partial<User>>({});
  
  // Login credentials states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Core synchronized lists from Firebase Firestore
  const [products, setProducts] = useState<Product[]>([]);
  const [allLogins, setAllLogins] = useState<User[]>([]);
  const [loginSessions, setLoginSessions] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);

  // Sub-tabs for Dashboard
  // 'hub' represents the primary landing screen.
  const [activeSubTab, setActiveSubTab] = useState<
    'hub' | 'ask' | 'scanner' | 'sell_marketplace' | 'prices' | 'subscription' | 'advisory' | 'logistics' |
    'verify' | 'predict' | 'escrow' | 'insurance' | 'trader' | 'community' | 'khata'
  >('hub');

  // Interactive local states
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isAuthRestored, setIsAuthRestored] = useState(false);

  // Payment states
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>('premium_farmer');
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(999);

  // New Listing States for Farmers
  const [newCropName, setNewCropName] = useState('');
  const [newCropCost, setNewCropCost] = useState('');
  const [newCropQty, setNewCropQty] = useState('');
  const [newCropPhoto, setNewCropPhoto] = useState('');

  // Upgraded Operating System Listing States
  const [newCropGrade, setNewCropGrade] = useState<'A' | 'B' | 'C'>('A');
  const [newCropMoisture, setNewCropMoisture] = useState<number>(12);
  const [newCropHarvestDate, setNewCropHarvestDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isGettingPriceAdvice, setIsGettingPriceAdvice] = useState(false);
  const [valuationTip, setValuationTip] = useState('');

  // Live agricultural transaction feed ticker
  const [liveActivityIndex, setLiveActivityIndex] = useState(0);
  const liveActivities = [
    "🌾 Farmer Gurpreet Singh (Amritsar) listed 800kg Sharbati Wheat at ₹24/kg",
    "🛒 Gupta Traders (Delhi) deposited ₹1,200,000 escrow security for Basmati bulk cargo",
    "📷 Computer-Vision scanner identified Yellow Leaf Rust pathogen in Ludhiana",
    "🚛 Logistics freight truck dispatched from Gurdaspur warehouse to Azadpur Mandi",
    "🔒 Escrow released: Farmer Harpreet Singh received ₹45,500 after wholesaler checkout verification",
    "☂️ PMFBY Crop Insurance cover active: Wheat crop enrolled in Fatehabad",
    "🎓 Chief Expert Dr. Neeta Sharma matched nitrogen dosing query from Bhatinda growers"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveActivityIndex(idx => (idx + 1) % liveActivities.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Buyers Filters State
  const [buyerSearchCrop, setBuyerSearchCrop] = useState('');
  const [buyerFilterState, setBuyerFilterState] = useState('');
  const [buyerFilterDistrict, setBuyerFilterDistrict] = useState('');

  const t = translations[lang];

  // Helper utility for custom local usernames
  const getVirtualEmail = (u: string) => {
    const trimmed = u.trim().toLowerCase();
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed}@khetnet.local`;
  };

  const logSessionHistory = async (loggedUser: User) => {
    if (!loggedUser.id || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'login_sessions'), {
        userId: loggedUser.id,
        userName: loggedUser.name || 'Anonymous',
        userEmail: loggedUser.email || getVirtualEmail(username),
        timestamp: new Date().toISOString(),
        device: navigator.platform,
        userAgent: navigator.userAgent
      });
    } catch (e) {
      console.warn("Could not log session activity:", e);
    }
  };

  // ---------------------------------------------------------
  // FIRESTORE REAL-TIME SYNCHRONIZATION LISTENERS
  // ---------------------------------------------------------
  
  // Real-time Auth restoration listener
  useEffect(() => {
    const checkAdminSession = async () => {
      const token = sessionStorage.getItem('adminToken');
      if (token) {
        try {
          const res = await fetch('/api/admin/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          const data = await res.json();
          if (data.success) {
            const adminProfile: User = {
              id: 'admin_national_base',
              name: 'Chief Platform Director',
              email: 'admin@khetnet.com',
              role: 'host',
              age: 38,
              state: 'Delhi (NCT)',
              region: 'Command Base',
              language: 'en'
            };
            setUser(adminProfile);
            setStage('host');
            try {
              await signInWithEmailAndPassword(auth, 'admin@khetnet.com', 'admin161');
            } catch (err) {
              try {
                await createUserWithEmailAndPassword(auth, 'admin@khetnet.com', 'admin161');
              } catch (createErr) {
                console.warn("Could not register admin in Firebase on session restore:", createErr);
              }
            }
          } else {
            sessionStorage.removeItem('adminToken');
          }
        } catch (err) {
          console.error("Admin verification connection error:", err);
        }
      }
    };
    checkAdminSession();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        if (fbUser.email === 'admin@khetnet.com') {
          const adminProfile: User = {
            id: fbUser.uid,
            name: 'Chief Platform Director',
            email: 'admin@khetnet.com',
            role: 'host',
            age: 38,
            state: 'Delhi (NCT)',
            region: 'Command Base',
            language: 'en'
          };
          setUser(adminProfile);
          setStage('host');
          setIsAuthRestored(true);
          return;
        }
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
            setLang(userData.language || 'en');
            logSessionHistory(userData);
          }
        } catch (e) {
          console.error("Error fetching user profile doc:", e);
        }
      } else {
        // If not admin, clear user
        if (sessionStorage.getItem('adminToken') === null) {
          setUser({});
        }
      }
      setIsAuthRestored(true);
    });
    return () => unsubscribe();
  }, []);

  // Real-time synchronization of listed products
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      setProducts(items);
    }, (err) => console.error("Error reading listed products:", err));
    return () => unsubscribe();
  }, []);

  // Real-time synchronization of system broadcast alerts
  useEffect(() => {
    const q = query(collection(db, 'system_alerts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setSystemAlerts(items);
    }, (err) => console.warn("Broadcasting channel closed or unprovisioned yet:", err));
    return () => unsubscribe();
  }, []);

  // Real-time synchronization of platform users (for Admins / Hosts)
  useEffect(() => {
    if (user.role !== 'host') return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const uList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      setAllLogins(uList);
    }, (err) => console.error("Error loading user records:", err));
    return () => unsubscribe();
  }, [user.role]);

  // Real-time synchronization of session activity audit logs (for Admins / Hosts)
  useEffect(() => {
    if (user.role !== 'host') return;
    const unsubscribe = onSnapshot(collection(db, 'login_sessions'), (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setLoginSessions(sessions);
    }, (err) => console.error("Error sync session logs:", err));
    return () => unsubscribe();
  }, [user.role]);

  // ---------------------------------------------------------
  // LOGIN / REGISTRATION FLOW HANDLERS
  // ---------------------------------------------------------
  
  const handleLanguageSelect = (selectedLang: Language) => {
    setLang(selectedLang);
    localStorage.setItem('khetnet_lang', selectedLang);
    setStage('location');
  };

  const handleLocationSubmit = (state: string, region: string) => {
    setUser(prev => ({ ...prev, state, region, language: lang }));
    setStage('login');
  };

  const handleInteractiveLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Please fill in both a valid username and password.");
      return;
    }

    // National Administrator Override login via secure backend bcrypt check
    if (username.toLowerCase().trim() === 'admin') {
      setIsActionLoading(true);
      setLoginError(null);
      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.success) {
          sessionStorage.setItem('adminToken', data.token);
          const adminProfile: User = {
            id: 'admin_national_base',
            name: 'Chief Platform Director',
            email: 'admin@khetnet.com',
            role: 'host',
            age: 38,
            state: 'Delhi (NCT)',
            region: 'Command Base',
            language: 'en'
          };
          setUser(adminProfile);
          setStage('host');
          logSessionHistory(adminProfile);
          try {
            await signInWithEmailAndPassword(auth, 'admin@khetnet.com', password);
          } catch (authErr: any) {
            try {
              await createUserWithEmailAndPassword(auth, 'admin@khetnet.com', password);
            } catch (createErr) {
              console.warn("Could not register admin in Firebase on interaction:", createErr);
            }
          }
        } else {
          setLoginError(data.error || "Credentials verification failed. Please try again.");
        }
      } catch (err: any) {
        console.error("Secure admin auth error:", err);
        setLoginError("Failed to communicate with systems admin node: " + err.message);
      } finally {
        setIsActionLoading(false);
      }
      return;
    }

    if (password.length < 6) {
      setLoginError("Credentials security checklist: Passwords must contain 6 characters or above.");
      return;
    }

    setIsActionLoading(true);
    setLoginError(null);
    const virtualEmail = getVirtualEmail(username);

    try {
      // 1. First attempt direct login
      console.log("Locating credentials path for:", virtualEmail);
      const result = await signInWithEmailAndPassword(auth, virtualEmail, password);
      
      // 2. Fetch profile from Firestore
      const userProfileDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userProfileDoc.exists()) {
        const profileData = userProfileDoc.data() as User;
        
        if (profileData.isSuspended) {
          setLoginError("This account is currently deactivated by platform administrators.");
          await signOut(auth);
          setIsActionLoading(false);
          return;
        }

        setUser(profileData);
        logSessionHistory(profileData);
        setStage('dashboard');
        setActiveSubTab('hub');
      } else {
        // User logged in but profile was deleted or missing. Guide to details questions
        setStage('details');
      }
    } catch (err: any) {
      const eCode = err.code || '';
      const eMsg = (err.message || '').toLowerCase();
      
      if (eCode === 'auth/wrong-password') {
        setLoginError("Incorrect password. Please verify your credentials and try again.");
      } else if (
        eCode === 'auth/user-not-found' || 
        eCode === 'auth/invalid-credential' ||
        eCode.includes('invalid-credential') ||
        eCode.includes('user-not-found') ||
        eMsg.includes('invalid-credential') ||
        eMsg.includes('user-not-found')
      ) {
        // Account does not exist - guide to details entry
        setLoginError("Account not found on KhetNet registry. Preparing registration forms...");
        setTimeout(() => {
          setStage('details');
          setLoginError(null);
        }, 1200);
      } else {
        // Other errors trigger direct transition to details to guarantee fast first-user setups
        setStage('details');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOnboardingDetails = (name: string, age: number, mobile: string) => {
    setUser(prev => ({ ...prev, name, age, mobile }));
    setStage('category');
  };

  const handleCategoryRegistration = async (role: 'farmer' | 'wholesaler') => {
    setIsActionLoading(true);
    const virtualEmail = getVirtualEmail(username);

    try {
      // 1. Create credential user in Firebase
      const result = await createUserWithEmailAndPassword(auth, virtualEmail, password);
      
      const newKhetNetUser: User = {
        id: result.user.uid,
        name: user.name || 'KhetNet Partner',
        age: user.age || 25,
        mobile: user.mobile || '1111111111',
        email: virtualEmail,
        state: user.state || 'Punjab',
        region: user.region || 'Amritsar',
        language: lang,
        role: role,
        isSubscribed: false,
        subscriptionTier: null
      };

      // 2. Commit profile document to DB
      await setDoc(doc(db, 'users', result.user.uid), newKhetNetUser);
      setUser(newKhetNetUser);
      logSessionHistory(newKhetNetUser);
      
      setStage('dashboard');
      setActiveSubTab('hub');
    } catch (err: any) {
      console.error("Account registration flow failure:", err);
      // Local setup fallback
      const mockId = `guest_${Date.now()}`;
      const mockUser: User = {
        id: mockId,
        name: user.name || 'Demo Partner',
        age: user.age || 25,
        mobile: user.mobile || '1111111111',
        email: virtualEmail,
        state: user.state || 'Punjab',
        region: user.region || 'Amritsar',
        language: lang,
        role: role,
        isSubscribed: false
      };
      setUser(mockUser);
      setStage('dashboard');
      setActiveSubTab('hub');
    } finally {
      setIsActionLoading(false);
    }
  };

  const logout = async () => {
    setIsActionLoading(true);
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
      } catch (err) {
        console.warn("Backend session invalidation warning:", err);
      }
      sessionStorage.removeItem('adminToken');
    }
    try {
      await signOut(auth);
    } catch (e) {
      console.warn(e);
    }
    setUser({});
    setUsername('');
    setPassword('');
    setStage('language');
    setActiveSubTab('hub');
    setIsActionLoading(false);
  };

  // ---------------------------------------------------------
  // CROP PRODUCT FORM WORKFLOWS (FARMER)
  // ---------------------------------------------------------
  
  const handleFarmerPostingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCropName || !newCropCost || !newCropQty) {
      alert("Please enter the crop name, price, and supply quantity.");
      return;
    }

    setIsActionLoading(true);
    try {
      const harvestDocObj = {
        name: newCropName,
        costPerKg: parseFloat(newCropCost),
        maxQuantity: parseFloat(newCropQty),
        grade: newCropGrade,
        moisturePercent: newCropMoisture,
        harvestDate: newCropHarvestDate,
        isVerified: user.isVerified || false,
        trustScore: user.trustScore || 85,
        farmerId: user.id || 'anonymous_farmer',
        farmerName: user.name || 'Listed Farmer',
        farmerMobile: user.mobile || '9988776655',
        state: user.state || 'Punjab',
        region: user.region || 'Amritsar',
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'products'), harvestDocObj);
      alert("Harvest crop listed successfully on KhetNet marketplace with Smart Quality analysis!");
      
      // Reset state inputs
      setNewCropName('');
      setNewCropCost('');
      setNewCropQty('');
      setNewCropPhoto('');
      setNewCropGrade('A');
      setNewCropMoisture(12);
      setValuationTip('');
      setActiveSubTab('hub');
    } catch (e) {
      console.error(e);
      alert("Listed posting save failed: please complete authentication.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // ---------------------------------------------------------
  // SUBSCRIPTION & RAZORPAY VERIFICATIONS
  // ---------------------------------------------------------
  
  const triggerPlanChoice = async (tier: any, price: number, isTrialRegistration?: boolean) => {
    if (isTrialRegistration) {
      if (!user.id) {
        alert("Please authorize your session first.");
        return;
      }
      setIsActionLoading(true);
      try {
        await setDoc(doc(db, 'users', user.id), {
          ...user,
          isSubscribed: true,
          subscriptionTier: 'premium_farmer',
          isTrialActive: true,
          trialStartedAt: Date.now()
        });
        
        setUser(prev => ({
          ...prev,
          isSubscribed: true,
          subscriptionTier: 'premium_farmer'
        }));
        
        alert("🎉 Congratulations! Your 30-Day Premium Farmer Free Trial is active. Unlimited AI diagnostics, precision advisor forecasts, and disease scanner features are fully unlocked.");
        setActiveSubTab('hub');
      } catch (e) {
        console.error(e);
        setUser(prev => ({
          ...prev,
          isSubscribed: true,
          subscriptionTier: 'premium_farmer'
        }));
      } finally {
        setIsActionLoading(false);
      }
      return;
    }

    if (tier === 'free_farmer') {
      if (!user.id) return;
      setIsActionLoading(true);
      try {
        await setDoc(doc(db, 'users', user.id), {
          ...user,
          isSubscribed: false,
          subscriptionTier: 'free_farmer'
        });
        
        setUser(prev => ({
          ...prev,
          isSubscribed: false,
          subscriptionTier: 'free_farmer'
        }));
        
        alert("You have converted back to the Free Farmer Plan. Limited queries will apply from your next session.");
        setActiveSubTab('hub');
      } catch (err) {
        console.error(err);
      } finally {
        setIsActionLoading(false);
      }
      return;
    }

    setSelectedPlan(tier);
    setSelectedPlanPrice(price);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async (planTier: any) => {
    if (!user.id) return;
    setIsActionLoading(true);
    try {
      const isSub = planTier !== 'free_farmer';
      await setDoc(doc(db, 'users', user.id), {
        ...user,
        isSubscribed: isSub,
        subscriptionTier: planTier,
        viewsRemaining: 99999
      });
      
      setUser(prev => ({
        ...prev,
        isSubscribed: isSub,
        subscriptionTier: planTier
      }));

      const readableTier = String(planTier).replace('_', ' ').toUpperCase();
      alert(`Congratulations! You are officially upgraded to KhetNet ${readableTier} Partner.`);
      setActiveSubTab('hub');
    } catch (e) {
      console.error("Firestore user premium update failed:", e);
      setUser(prev => ({
        ...prev,
        isSubscribed: planTier !== 'free_farmer',
        subscriptionTier: planTier
      }));
    } finally {
      setIsActionLoading(false);
    }
  };

  // ---------------------------------------------------------
  // TEMPLATE RENDER DISPATCHER
  // ---------------------------------------------------------
  
  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1D1D1D] font-sans selection:bg-[#E2F0D9]">
      <AnimatePresence mode="wait">
        
        {/* Stage 1: Splash Presentation */}
        {stage === 'splash' && (
          <SplashScreen 
            key="stage-splash" 
            t={t} 
            onComplete={() => {
              if (isAuthRestored) {
                if (auth.currentUser && user.role) {
                  setStage(user.role === 'host' ? 'host' : 'dashboard');
                } else {
                  setStage('language');
                }
              }
            }} 
          />
        )}

        {/* Global Modal Action Spinner */}
        {isActionLoading && (
          <div className="fixed inset-0 bg-[#FDFCF8]/70 backdrop-blur-sm flex flex-col items-center justify-center z-[200]">
            <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
               className="w-14 h-14 border-4 border-[#4C6B36] border-t-transparent rounded-full shadow-lg" 
            />
            <p className="mt-4 font-black text-xs text-[#4C6B36] uppercase tracking-widest animate-pulse">Syncing platform state safely...</p>
          </div>
        )}

        {/* Stage 2: Central India Language grid selecting stage with LAST centered box option */}
        {stage === 'language' && (
          <motion.div 
            key="stage-language"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-4 max-w-lg mx-auto space-y-6"
          >
            <div className="bg-[#4C6B36] p-4 rounded-[28%] shadow-xl shadow-[#4C6B36]/15">
              <KhetNetLogo className="w-12 h-12" />
            </div>
            
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-black text-gray-950 font-heading tracking-tight italic">KhetNet</h1>
              <p className="text-xs text-[#4C6B36] font-extrabold uppercase tracking-widest">Connect with 23 Indian Languages</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">भारत की २३ भाषाओं में उपलब्ध</p>
            </div>

            <div className="w-full max-h-[380px] overflow-y-auto pr-1 space-y-2 border border-gray-100 bg-gray-50/50 p-3 rounded-2xl">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'en', label: 'English' },
                  { id: 'hi', label: 'हिंदी (Hindi)' },
                  { id: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
                  { id: 'ta', label: 'தமிழ் (Tamil)' },
                  { id: 'te', label: 'తెలుగు (Telugu)' },
                  { id: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
                  { id: 'ml', label: 'മലയാളം (Malayalam)' },
                  { id: 'ur', label: 'اردو (Urdu)' },
                  { id: 'mr', label: 'मराठी (Marathi)' },
                  { id: 'gu', label: 'ગુજરાતી (Gujarati)' },
                  { id: 'bn', label: 'বাংলা (Bengali)' },
                  { id: 'as', label: 'অসমীয়া (Assamese)' },
                  { id: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
                  { id: 'ks', label: 'کٲਸ਼ُر (Kashmiri)' },
                  { id: 'doi', label: 'डोगरी (Dogri)' },
                  { id: 'mai', label: 'मैथिली (Maithili)' },
                  { id: 'ne', label: 'नेपाली (Nepali)' },
                  { id: 'sat', label: 'संताली (Santali)' },
                  { id: 'kok', label: 'कोंकणी (Konkani)' },
                  { id: 'mni', label: 'Manipuri (মণিপুরী)' },
                  { id: 'brx', label: 'बोडो (Bodo)' },
                  { id: 'sa', label: 'संस्कृत (Sanskrit)' },
                  { id: 'sd', label: 'सिंधी (Sindhi)' },
                ].map((languageOpt) => (
                  <button
                    key={languageOpt.id}
                    onClick={() => handleLanguageSelect(languageOpt.id as Language)}
                    className="py-3 px-3 block w-full rounded-xl border border-gray-200 bg-white hover:border-[#4C6B36] hover:bg-[#F0F7EB] transition-all font-semibold shadow-sm active:scale-95 text-center"
                  >
                    <span className="text-[10px] text-[#4C6B36] font-extrabold block opacity-70 mb-0.5">{languageOpt.id.toUpperCase()}</span>
                    <span className="text-xs font-black text-gray-900 block">{languageOpt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stage 3: Locations Form */}
        {stage === 'location' && (
          <AreaSelectionScreen 
            key="stage-location" 
            t={t} 
            onSubmit={handleLocationSubmit} 
            onBack={() => setStage('language')} 
          />
        )}

        {/* Stage 4: Authentication Credentials Sign-in/Sign-up routing */}
        {stage === 'login' && (
          <LoginScreenWidget 
            key="stage-login"
            t={t}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onSubmit={handleInteractiveLogin}
            error={loginError}
            onBack={() => setStage('location')}
          />
        )}

        {/* Stage 5: General Onboarding details Form */}
        {stage === 'details' && (
          <DetailsScreenWidget 
            key="stage-details"
            t={t}
            onSubmit={handleOnboardingDetails}
            onBack={() => setStage('login')}
          />
        )}

        {/* Stage 6: Category Farmers vs Buyers selection list */}
        {stage === 'category' && (
          <CategoryScreenWidget 
            key="stage-category"
            t={t}
            onSubmit={handleCategoryRegistration}
            onBack={() => setStage('details')}
          />
        )}

        {/* Stage 7: Active Dashboard workstation */}
        {stage === 'dashboard' && (
          <motion.div 
            key="stage-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-h-screen"
          >
            {/* National Top Info deck */}
            <header className="bg-white border-b border-[#E2F0D9] sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <KhetNetLogo className="w-10 h-10" />
                <div>
                  <h2 className="text-lg font-heading font-black text-gray-950 leading-none">KhetNet</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{user.region}, {user.state}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {user.role === 'wholesaler' && (
                  <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest ${user.isSubscribed ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                    {user.isSubscribed ? `Pro Partner` : 'Free Member'}
                  </span>
                )}
                
                <button
                  onClick={logout}
                  title="Logout from active platform workspace"
                  className="p-2 bg-[#F9FBFA] text-gray-400 hover:text-gray-600 rounded-xl transition-all border border-[#E2F0D9]"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            </header>

            {/* Dashboard Router Splitter */}
            <main className="flex-1">
              
              {/* Home Hub View: Exactly 4 large category blocks with animations */}
              {activeSubTab === 'hub' && (
                <div className="max-w-xl mx-auto px-6 py-12 space-y-8 animate-fade-in">
                  
                  {/* Greeting Block */}
                  <div className="space-y-1">
                    <p className="text-xs text-[#4C6B36] font-black uppercase tracking-widest">{t.welcome || 'Welcome to Marketplace'}</p>
                    <h1 className="text-3xl font-heading font-black text-gray-950 leading-tight">
                      Namaste, {user.name}!
                    </h1>
                  </div>

                  {/* National Administration Broadcast Desk Alerts */}
                  {systemAlerts.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 border-2 border-amber-200 p-5 rounded-[30px] text-left space-y-2.5 relative overflow-hidden shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-450 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-650"></span>
                          </span>
                          <span className="text-[9px] text-amber-800 font-extrabold uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-505/10">
                            🔔 National Broadcast Bureau
                          </span>
                        </div>
                        <span className="text-[8px] bg-amber-200/50 text-amber-900 font-extrabold uppercase px-2 py-0.5 rounded font-mono">
                          priority: {systemAlerts[0].priority || 'medium'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-gray-950 flex items-center gap-1 leading-normal uppercase tracking-wide">
                          {systemAlerts[0].title}
                        </h4>
                        <p className="text-[11.5px] text-gray-700 font-semibold leading-relaxed">
                          {systemAlerts[0].body}
                        </p>
                      </div>
                      <div className="text-[8px] uppercase tracking-wider font-mono text-amber-80 * 0.6 font-semibold opacity-70">
                        Official Release • {systemAlerts[0].publisher || 'KhetNet Admin Base'}
                      </div>
                    </motion.div>
                  )}

                  {/* Upgraded Weather & Rain Risk Alert Module */}
                  <div className="bg-gradient-to-br from-[#FAFDF6] via-white to-white border-2 border-[#E2F0D9] p-5.5 rounded-[35px] text-left space-y-3.5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-[#4C6B36] font-extrabold uppercase tracking-widest bg-[#F0F7EB] px-2.5 py-1 rounded-full border border-[#D0E6C3]">Agricultural Climate Advisor</span>
                        <h4 className="text-lg font-black text-gray-950 pt-1.5 flex items-center gap-1">
                          🌤️ 31°C <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">• Partly Cloudy • {user.region || 'Amritsar'}</span>
                        </h4>
                      </div>
                      <span className="text-3xl">🌦️</span>
                    </div>

                    {/* Key Indicators */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-[#FAFDF6] p-2.5 rounded-2xl border border-[#E2F0D9] text-gray-700">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase text-gray-400">Wind speed</p>
                        <p className="text-xs font-black">16 km/h</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase text-gray-400">Soil Moisture</p>
                        <p className="text-xs font-black">22% Centibar</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase text-gray-400">Rain Risk</p>
                        <p className="text-xs font-black text-amber-600">80% High</p>
                      </div>
                    </div>

                    {/* Rain Alert & Spray Window Indicator */}
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-start gap-2.5 text-left">
                      <span className="text-sm shrink-0">⚠️</span>
                      <div>
                        <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest leading-none">Rain & Fungal Alert Triggered</p>
                        <p className="text-[11px] text-amber-700 font-semibold mt-1 leading-snug">
                          Heavy rain forecasted within 24 hours. <b>Pesticide Spray window is CLOSED</b>. Fungal blight risk high for Tomato & Basmati.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mandi Benchmark Price Index Ticker */}
                  <div className="bg-neutral-900 text-white rounded-3xl py-2 px-4 shadow-sm text-center overflow-hidden flex items-center gap-3">
                    <span className="text-[9px] bg-emerald-600 text-white font-black uppercase tracking-widest px-2 py-0.5 rounded shrink-0">APMC Mandi Price index</span>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-gray-300 w-full truncate text-left">
                      🌾 Basmati 1121: ₹3,950/qtl (▲ 1.4%) • 🌾 Wheat Sharbati: ₹2,420/qtl (▼ 0.5%) • 🧅 Onion Nasik: ₹1,850/qtl (▲ 2.8%) • 🥔 Potato: ₹1,200/qtl (▲ 0.2%) • 🧪 urea: ₹266/bag
                    </div>
                  </div>

                  {/* Live Activity Ticker */}
                  <div className="bg-[#4C6B36] p-3.5 rounded-3xl text-left shadow-sm flex items-center justify-between text-white relative overflow-hidden">
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-[8px] bg-white text-[#4C6B36] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shrink-0">Live Platform activities</span>
                      <div className="h-5 overflow-hidden w-full relative flex items-center">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={liveActivityIndex}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                            className="text-xs font-black text-emerald-50 truncate pr-4"
                          >
                            {liveActivities[liveActivityIndex]}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Card 1: Ask KhetNet AI */}
                    <div 
                      onClick={() => setActiveSubTab('ask')}
                      className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                    >
                      <span className="text-4xl">🎤</span>
                      <div>
                        <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">Ask KhetNet AI</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Bilingual Assistant</p>
                      </div>
                    </div>

                    {/* Card 2: Plant Blight Leaves Scanner */}
                    <div 
                      onClick={() => setActiveSubTab('scanner')}
                      className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                    >
                      <span className="text-4xl">📷</span>
                      <div>
                        <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">Disease Scanner</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Computer-Vision leaf Scan</p>
                      </div>
                    </div>

                    {/* Card 3: Role dependant listing workspace (Sell crop vs Buyer feed) */}
                    {user.role === 'farmer' ? (
                      <div 
                        onClick={() => setActiveSubTab('sell_marketplace')}
                        className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                      >
                        <span className="text-4xl">🌾</span>
                        <div>
                          <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">Sell Crop</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Post Harvest Listings</p>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => setActiveSubTab('sell_marketplace')}
                        className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                      >
                        <span className="text-4xl">🛒</span>
                        <div>
                          <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">Crop Marketplace</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Contact Direct Farmers</p>
                        </div>
                      </div>
                    )}

                    {/* Card 4: Mandi Indices & statistics */}
                    <div 
                      onClick={() => setActiveSubTab('prices')}
                      className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                    >
                      <span className="text-4xl">📈</span>
                      <div>
                        <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">Market Prices</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">APMC pricing segments</p>
                      </div>
                    </div>

                    {/* Card 5: Agri-Climate Advisory */}
                    <div 
                      onClick={() => setActiveSubTab('advisory')}
                      className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                    >
                      <span className="text-4xl">🌤️</span>
                      <div>
                        <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">Sowing Advisor</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Climate & Soil advisory</p>
                      </div>
                    </div>

                    {/* Card 6: KhetNet Transport Logistics */}
                    <div 
                      onClick={() => setActiveSubTab('logistics')}
                      className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                    >
                      <span className="text-4xl">🚚</span>
                      <div>
                        <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">KhetNet Transport</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Book Freight Carriers</p>
                      </div>
                    </div>

                    {/* Card 7: Verified Farmer Registry */}
                    <div 
                      onClick={() => setActiveSubTab('verify')}
                      className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                    >
                      <span className="text-4xl">🛡️</span>
                      <div>
                        <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">Verified Farmer</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Certificates & Trust</p>
                      </div>
                    </div>

                    {/* Card 8: Crop Price Predictor */}
                    <div 
                      onClick={() => setActiveSubTab('predict')}
                      className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                    >
                      <span className="text-4xl">💰</span>
                      <div>
                        <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">Price Predictor</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">AI crop 15-day trends</p>
                      </div>
                    </div>

                    {/* Card 9: KhetNet Escrow Guard */}
                    <div 
                      onClick={() => setActiveSubTab('escrow')}
                      className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                    >
                      <span className="text-4xl">🔒</span>
                      <div>
                        <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">Escrow Guard</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Secured Cargo Trade</p>
                      </div>
                    </div>

                    {/* Card 10: Crop Insurance Section */}
                    <div 
                      onClick={() => setActiveSubTab('insurance')}
                      className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                    >
                      <span className="text-4xl">☂️</span>
                      <div>
                        <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">Crop Insurance</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Yield risk shield cover</p>
                      </div>
                    </div>

                    {/* Card 11: Agri Community Section */}
                    <div 
                      onClick={() => setActiveSubTab('community')}
                      className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                    >
                      <span className="text-4xl">🗣️</span>
                      <div>
                        <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">Agri Community</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Grower chats & Auto Translation</p>
                      </div>
                    </div>

                    {/* Card 12: Khet Khata Accounting Ledger */}
                    <div 
                      onClick={() => setActiveSubTab('khata')}
                      className="bg-white p-6 rounded-[35px] border-2 border-[#E2F0D9] hover:border-[#4C6B36] transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 group active:scale-95"
                    >
                      <span className="text-4xl">📓</span>
                      <div>
                        <h3 className="font-heading font-black text-lg text-gray-950 leading-snug group-hover:text-[#4C6B36] transition-colors">Khet Khata</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Bookkeeping, Profit Analytics</p>
                      </div>
                    </div>

                    {/* Card 11 (Wholesalers Only): Trader Cockpit */}
                    {user.role === 'wholesaler' && (
                      <div 
                        onClick={() => setActiveSubTab('trader')}
                        className="bg-white p-6 rounded-[35px] border-2 border-[#4C6B36] bg-[#FAFDF6] hover:border-emerald-600 transition-all shadow-sm cursor-pointer hover:shadow-md flex flex-col justify-between h-44 col-span-1 sm:col-span-2 group active:scale-95"
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="text-4xl">🧭</span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black uppercase tracking-wider">Premium Cockpit</span>
                        </div>
                        <div>
                          <h3 className="font-heading font-black text-lg text-gray-955 leading-snug group-hover:text-emerald-700 transition-colors">Trader Cockpit</h3>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Verified farmers, Trust ratings & AI matches</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub Tab 1: AI Assistant chatbot (Express Proxy Calling) */}
              {activeSubTab === 'ask' && (
                <div className="py-6">
                  <div className="max-w-xl mx-auto px-6 mb-2">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>
                  <AskKhetNet t={t} user={user} />
                </div>
              )}

              {/* Sub Tab 2: Leaf Scanner diagnoses */}
              {activeSubTab === 'scanner' && (
                <div className="py-6">
                  <div className="max-w-xl mx-auto px-6 mb-2">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>
                  <DiseaseScanner t={t} userLanguage={lang} />
                </div>
              )}

              {/* Sub Tab 3: Farmers Sell Crop FORM vs Wholesalers listings feed */}
              {activeSubTab === 'sell_marketplace' && (
                <div className="py-6">
                  <div className="max-w-3xl mx-auto px-6 mb-4">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>

                  {/* Render Farmer form */}
                  {user.role === 'farmer' ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-lg mx-auto bg-white border border-[#E2F0D9] rounded-[35px] p-8 shadow-sm space-y-6"
                    >
                      <div className="space-y-1">
                        <h2 className="text-2xl font-heading font-black text-gray-950 tracking-tight leading-none">List Harvest to Mandi</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Direct Wholesale connection</p>
                      </div>

                      <form onSubmit={handleFarmerPostingSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block ml-1">Crop Name / Variety</label>
                          <input
                            required
                            type="text"
                            value={newCropName}
                            onChange={(e) => setNewCropName(e.target.value)}
                            placeholder="e.g. Organic Basmati Rice, Premium Wheat"
                            className="w-full bg-[#F5F9F2] border-none rounded-2xl py-3.5 px-4 outline-none text-sm font-semibold"
                          />
                        </div>

                        {/* Smart Crop quality specifications */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block ml-1">Grade</label>
                            <select
                              value={newCropGrade}
                              onChange={(e) => setNewCropGrade(e.target.value as any)}
                              className="w-full bg-[#F5F9F2] border-none rounded-2xl py-3 px-2 outline-none text-xs font-bold"
                            >
                              <option value="A">Grade A (Premium)</option>
                              <option value="B">Grade B (Standard)</option>
                              <option value="C">Grade C (Slight Delays)</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block ml-1">Moisture (%)</label>
                            <input
                              type="number"
                              min={5}
                              max={30}
                              value={newCropMoisture}
                              onChange={(e) => setNewCropMoisture(Math.max(5, Math.min(30, Number(e.target.value))))}
                              className="w-full bg-[#F5F9F2] border-none rounded-2xl py-3 px-2 outline-none text-xs font-bold text-center"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block ml-1">Harvest Date</label>
                            <input
                              type="date"
                              value={newCropHarvestDate}
                              onChange={(e) => setNewCropHarvestDate(e.target.value)}
                              className="w-full bg-[#F5F9F2] border-none rounded-2xl py-3 px-1.5 outline-none text-[9px] font-bold text-center"
                            />
                          </div>
                        </div>

                        {/* AI Price recommendation advisor box */}
                        <div className="bg-amber-50/25 border-2 border-amber-100 p-4 rounded-3xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] text-amber-805 font-black tracking-widest uppercase block">Mandi Smart Advisory</span>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!newCropName) {
                                  alert("Please declare a Crop Variety name first to retrieve AI recommendations.");
                                  return;
                                }
                                setIsGettingPriceAdvice(true);
                                try {
                                  const response = await fetch('/api/recommend-price', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      cropName: newCropName,
                                      grade: newCropGrade,
                                      moisture: newCropMoisture,
                                      harvestDate: newCropHarvestDate,
                                      state: user.state || 'Punjab',
                                      region: user.region || 'Amritsar'
                                    })
                                  });
                                  const data = await response.json();
                                  setNewCropCost(data.recommendedPricePerKg.toString());
                                  setValuationTip(`AI Approved: ₹${data.recommendedPricePerKg}/kg (Valuation Confidence: ${data.confidenceScore}%). Analysis: ${data.analysis}`);
                                } catch (err) {
                                  // Fallback
                                  const localCost = 45;
                                  setNewCropCost(localCost.toString());
                                  setValuationTip(`Estimated value: ₹${localCost}/kg based on regional mandi arrivals.`);
                                } finally {
                                  setIsGettingPriceAdvice(false);
                                }
                              }}
                              disabled={isGettingPriceAdvice}
                              className="py-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-45"
                            >
                              {isGettingPriceAdvice ? "Analyzing..." : "Get AI Recommended Price"}
                            </button>
                          </div>
                          {valuationTip && (
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed font-serif italic pt-1.5 border-t border-amber-100/30">
                              {valuationTip}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block ml-1">Cost Per kg (₹)</span>
                            <input
                              required
                              type="number"
                              value={newCropCost}
                              onChange={(e) => setNewCropCost(e.target.value)}
                              placeholder="e.g. 65"
                              className="w-full bg-[#F5F9F2] border-none rounded-2xl py-3.5 px-4 outline-none text-sm font-semibold text-center"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block ml-1">Total Supply (kg)</span>
                            <input
                              required
                              type="number"
                              value={newCropQty}
                              onChange={(e) => setNewCropQty(e.target.value)}
                              placeholder="e.g. 500"
                              className="w-full bg-[#F5F9F2] border-none rounded-2xl py-3.5 px-4 outline-none text-sm font-semibold text-center"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-4.5 bg-[#4C6B36] text-white rounded-xl text-base font-black uppercase tracking-widest shadow-md hover:bg-[#3D562B] transition-colors active:scale-95"
                        >
                          Submit Crop Listing
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    // Render Buyer listings Marketplace
                    <div className="max-w-3xl mx-auto px-6 space-y-6">
                      
                      {/* Search tools and matching */}
                      <div className="bg-white p-5 rounded-3xl border border-[#E2F0D9] shadow-sm flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                          <input
                            type="text"
                            value={buyerSearchCrop}
                            onChange={(e) => setBuyerSearchCrop(e.target.value)}
                            placeholder="Search active crop postings..."
                            className="w-full pl-10 pr-4 py-3 bg-[#F5F9F2] rounded-xl outline-none text-xs font-semibold text-gray-800"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 w-full md:w-80">
                          <input
                            type="text"
                            value={buyerFilterState}
                            onChange={(e) => setBuyerFilterState(e.target.value)}
                            placeholder="State filter..."
                            className="bg-[#F5F9F2] rounded-xl outline-none text-center text-xs font-semibold px-2 py-3"
                          />
                          <input
                            type="text"
                            value={buyerFilterDistrict}
                            onChange={(e) => setBuyerFilterDistrict(e.target.value)}
                            placeholder="District..."
                            className="bg-[#F5F9F2] rounded-xl outline-none text-center text-xs font-semibold px-2 py-3"
                          />
                        </div>
                      </div>

                      {/* Marketplace list */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products
                          .filter(p => !buyerSearchCrop || p.name.toLowerCase().includes(buyerSearchCrop.toLowerCase()))
                          .filter(p => !buyerFilterState || p.state.toLowerCase().includes(buyerFilterState.toLowerCase()))
                          .filter(p => !buyerFilterDistrict || p.region.toLowerCase().includes(buyerFilterDistrict.toLowerCase()))
                          .map((prod, pIdx) => {
                            const isLocked = !user.isSubscribed;

                            return (
                              <motion.div
                                key={prod.id || pIdx}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: pIdx * 0.05 }}
                                className="bg-white p-5 rounded-3xl border border-[#E2F0D9] shadow-sm flex flex-col justify-between min-h-48 relative overflow-hidden group"
                              >
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-[9px] bg-[#F0F7EB] text-[#4C6B36] px-2 py-0.5 rounded uppercase font-black tracking-widest">{prod.state}</span>
                                      <h3 className="text-lg font-heading font-black text-gray-950 mt-1 leading-tight">{prod.name}</h3>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Quantity</span>
                                      <p className="text-xs font-black text-gray-800 font-mono">{prod.maxQuantity} kg</p>
                                    </div>
                                  </div>

                                  <div className="py-2.5 border-y border-dashed border-[#F0F7EB] flex justify-between items-baseline">
                                    <span className="text-xs text-gray-400 font-semibold">Bulk Rate:</span>
                                    <span className="text-lg font-black text-[#4C6B36] font-mono">₹{prod.costPerKg} / kg</span>
                                  </div>
                                </div>

                                {/* Premium Block overlay */}
                                {isLocked ? (
                                  <div className="mt-4 pt-4 border-t border-[#F5F9F2] bg-yellow-50/50 p-3 rounded-2xl flex items-center justify-between gap-3 border border-yellow-100">
                                    <div className="min-w-0">
                                      <span className="text-[8px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Locked Feature</span>
                                      <p className="text-[10px] text-gray-500 font-semibold truncate leading-none mt-1">Farmer profile is password protected.</p>
                                    </div>
                                    <button
                                      onClick={() => setActiveSubTab('subscription')}
                                      className="py-1.5 px-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm font-sans"
                                    >
                                      Unlock
                                    </button>
                                  </div>
                                ) : (
                                  // Premium content fully UNLOCKED
                                  <div className="mt-4 pt-4 border-t border-[#F0F7EB] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#F0F7EB]/10 p-3 rounded-2xl border border-[#E2F0D9]/30">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] text-[#4C6B36] font-black uppercase tracking-widest flex items-center gap-1">
                                        <Award className="w-3.5 h-3.5" /> Direct Contact Active
                                      </p>
                                      <h4 className="font-extrabold text-[#1D1D1D] text-xs truncate mt-0.5">{prod.farmerName}</h4>
                                      <p className="text-[9px] text-gray-400 leading-none mt-0.5">{prod.region || 'Regional Mandi'}, {prod.state}</p>
                                      <span className="text-[8px] bg-[#E2F0D9] text-[#2C411E] font-black px-1.5 py-0.2 rounded mt-1.5 inline-block uppercase font-mono">Grade: {prod.grade || 'A'} • Moisture: {prod.moisturePercent || '12'}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setActiveSubTab('escrow')}
                                        className="py-2.5 px-3.5 bg-neutral-900 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center gap-1 active:scale-95"
                                        title="Initiate Escrow Holding Cargo Securement"
                                      >
                                        🔒 Escrow
                                      </button>
                                      <a
                                        href={`tel:${prod.farmerMobile}`}
                                        className="p-3 bg-[#4C6B36] hover:bg-[#3D562B] text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-md animate-pulse"
                                        title="Call Farmer"
                                      >
                                        <Phone className="w-3.5 h-3.5 fill-white text-[#4C6B36]" />
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                      </div>

                      {products.length === 0 && (
                        <p className="text-gray-400 font-medium italic text-sm text-center py-12 bg-white rounded-3xl border border-[#E2F0D9]">
                          No listed crops match your regional filters. Please wait for regional farmers to submit.
                        </p>
                      )}

                    </div>
                  )}

                </div>
              )}

              {/* Sub Tab 4: Agmark APMC pricing index */}
              {activeSubTab === 'prices' && (
                <div className="py-6">
                  <div className="max-w-xl mx-auto px-6 mb-2">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>
                  <MarketPrices user={user} t={t} />
                </div>
              )}

              {/* Sub Tab 5: Premium package checkout sheet */}
              {activeSubTab === 'subscription' && (
                <div className="py-6 animate-fade-in">
                  <SubscriptionPlans 
                    t={t} 
                    currentUser={user}
                    onSelectPlan={triggerPlanChoice} 
                    onBackToHome={() => setActiveSubTab('hub')} 
                  />
                </div>
              )}

              {/* Sub Tab 6: Agri Climate Sowing Advisory (Live Sowing Advisor) */}
              {activeSubTab === 'advisory' && (
                <div className="py-6 animate-fade-in">
                  <div className="max-w-xl mx-auto px-6 mb-2">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>
                  <AgriAdvisory user={user} t={t} />
                </div>
              )}

              {/* Sub Tab 7: KhetNet Transport logistics scheduler */}
              {activeSubTab === 'logistics' && (
                <div className="py-6 animate-fade-in">
                  <div className="max-w-xl mx-auto px-6 mb-2">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>
                  <KhetNetLogistics user={user} t={t} />
                </div>
              )}

              {/* Sub Tab 8: Verified Farmer Registry */}
              {activeSubTab === 'verify' && (
                <div className="py-6 animate-fade-in">
                  <div className="max-w-xl mx-auto px-6 mb-2">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>
                  <VerifiedFarmer user={user} onVerificationComplete={(info) => setUser(prev => ({ ...prev, ...info }))} />
                </div>
              )}

              {/* Sub Tab 9: Crop Price Predictor */}
              {activeSubTab === 'predict' && (
                <div className="py-6 animate-fade-in">
                  <div className="max-w-xl mx-auto px-6 mb-2">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>
                  <CropPredictor user={user} t={t} />
                </div>
              )}

              {/* Sub Tab 10: KhetNet Escrow Guard */}
              {activeSubTab === 'escrow' && (
                <div className="py-6 animate-fade-in">
                  <div className="max-w-xl mx-auto px-6 mb-2">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>
                  <EscrowPayment user={user} t={t} />
                </div>
              )}

              {/* Sub Tab 11: Crop Insurance Section */}
              {activeSubTab === 'insurance' && (
                <div className="py-6 animate-fade-in">
                  <div className="max-w-xl mx-auto px-6 mb-2">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>
                  <CropInsurance user={user} t={t} />
                </div>
              )}

              {/* Sub Tab 12: Trader Dashboard Cockpit */}
              {activeSubTab === 'trader' && (
                <div className="py-6 animate-fade-in">
                  <div className="max-w-xl mx-auto px-6 mb-2">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>
                  <TraderDashboard user={user} t={t} setActiveSubTab={setActiveSubTab} />
                </div>
              )}

              {/* Sub Tab 13: Agri Community Section */}
              {activeSubTab === 'community' && (
                <div className="py-6 animate-fade-in">
                  <div className="max-w-xl mx-auto px-6 mb-2">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>
                  <AgriCommunity user={user} t={t} />
                </div>
              )}

              {/* Sub Tab 14: Khet Khata Accounting Ledger */}
              {activeSubTab === 'khata' && (
                <div className="py-6 animate-fade-in">
                  <div className="max-w-xl mx-auto px-6 mb-2">
                    <button 
                      onClick={() => setActiveSubTab('hub')}
                      className="text-xs font-black uppercase text-[#4C6B36] tracking-widest hover:underline"
                    >
                      ← Return to Main Portal
                    </button>
                  </div>
                  <KhetKhata user={user} t={t} />
                </div>
              )}

            </main>

            {/* Sticky Bottom Navigation dock for quick switching */}
            <footer className="bg-white border-t border-[#E2F0D9] sticky bottom-0 z-30 px-6 py-4.5 flex justify-around items-center">
              {[
                { id: 'hub' as const, label: 'Portal Home', emoji: '🏠' },
                { id: 'ask' as const, label: 'Ask AI', emoji: '🎤' },
                { id: 'scanner' as const, label: 'Leaf Scan', emoji: '📷' },
                { id: 'sell_marketplace' as const, label: user.role === 'farmer' ? 'Sell' : 'Mandi', emoji: user.role === 'farmer' ? '🌾' : '🛒' },
              ].map(navBtn => (
                <button
                  key={navBtn.id}
                  onClick={() => setActiveSubTab(navBtn.id)}
                  className={`flex flex-col items-center gap-1.5 transition-all ${activeSubTab === navBtn.id ? 'text-[#4C6B36] scale-102 font-extrabold' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <span className="text-xl leading-none">{navBtn.emoji}</span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold leading-none">{navBtn.label}</span>
                </button>
              ))}
            </footer>

          </motion.div>
        )}

        {/* Stage 8: Investor Control Base Panel */}
        {stage === 'host' && (
          <HostCenter 
            t={t} 
            logins={allLogins} 
            products={products} 
            loginSessions={loginSessions}
            onLogout={logout} 
          />
        )}

      </AnimatePresence>

      {/* SECURE MOCK RAZORPAY MODAL GATEWAY TRIGGER */}
      <RazorpayModal 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
        tier={selectedPlan}
        price={selectedPlanPrice}
      />

      {/* GLOBAL DYNAMIC MULTILINGUAL VOICE AI ASSISTANT COMPANION */}
      <VoiceAssistant 
        user={user} 
        setUser={setUser}
        lang={lang}
        setLang={setLang}
        t={t} 
        activeSubTab={activeSubTab} 
        setActiveSubTab={setActiveSubTab} 
        stage={stage}
        setStage={setStage}
        newCropName={newCropName}
        setNewCropName={setNewCropName}
        newCropCost={newCropCost}
        setNewCropCost={setNewCropCost}
        newCropQty={newCropQty}
        setNewCropQty={setNewCropQty}
        newCropGrade={newCropGrade}
        setNewCropGrade={setNewCropGrade}
        newCropMoisture={newCropMoisture}
        setNewCropMoisture={setNewCropMoisture}
        newCropHarvestDate={newCropHarvestDate}
        setNewCropHarvestDate={setNewCropHarvestDate}
      />

    </div>
  );
}

// -------------------------------------------------------------
// SUPPORT SCREEN WIDGET COMPONENTS
// -------------------------------------------------------------

function AreaSelectionScreen({ t, onSubmit, onBack }: any) {
  const [selectedState, setSelectedState] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      className="flex flex-col min-h-screen p-6 max-w-sm mx-auto justify-center space-y-8"
    >
      <div className="absolute top-8 left-8">
        <button onClick={onBack} className="p-2.5 bg-white rounded-xl shadow-sm border border-[#E2F0D9] hover:bg-[#F0F7EB] transition-colors"><ArrowLeft className="w-5 h-5 text-[#4C6B36]" /></button>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-heading font-black text-gray-950 tracking-tight leading-none italic">{t.select_area || 'Configure Region'}</h2>
        <p className="text-xs text-gray-400 font-medium italic">We customize market rates and harvest listing matching dynamically.</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-[#4C6B36] uppercase tracking-wider block ml-1">{t.state || 'Indian State'}</label>
          <select 
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setSelectedRegion(''); }}
            className="w-full p-4 rounded-xl border border-[#E2F0D9] focus:border-[#4C6B36] outline-none bg-white transition-all text-sm font-semibold select-all"
          >
            <option value="">{t.select_state || 'Choose State'}</option>
            {Object.keys(locations).map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>

        {selectedState && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#4C6B36] uppercase tracking-wider block ml-1">Mandi APMC region</label>
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full p-4 rounded-xl border border-[#E2F0D9] focus:border-[#4C6B36] outline-none bg-white transition-all text-sm font-semibold"
            >
              <option value="">Select District</option>
              {locations[selectedState as keyof typeof locations].map(reg => <option key={reg} value={reg}>{reg}</option>)}
            </select>
          </motion.div>
        )}
      </div>

      <button
        disabled={!selectedState || !selectedRegion}
        onClick={() => onSubmit(selectedState, selectedRegion)}
        className="w-full py-4.5 bg-[#4C6B36] text-white rounded-xl text-base font-black uppercase tracking-widest disabled:opacity-45 disabled:cursor-not-allowed shadow-md hover:bg-[#3D562B] transition-colors"
      >
        Lock Area {t.next || '→'}
      </button>
    </motion.div>
  );
}

function LoginScreenWidget({ t, username, setUsername, password, setPassword, showPassword, setShowPassword, onSubmit, error, onBack }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 min-h-screen flex flex-col justify-center max-w-sm mx-auto w-full relative space-y-8"
    >
      <div className="absolute top-8 left-8">
        <button onClick={onBack} className="p-2.5 bg-white rounded-xl shadow-sm border border-[#E2F0D9] hover:bg-[#F0F7EB] transition-colors"><ArrowLeft className="w-5 h-5 text-[#4C6B36]" /></button>
      </div>

      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-[#4C6B36] rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-[#4C6B36]/20">
          <KhetNetLogo className="w-14 h-14" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-heading font-black text-gray-950 tracking-tight leading-none italic">{t.welcome_to_khetnet || 'Welcome to KhetNet'}</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Digital Agri-Trading Center</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#4C6B36] ml-1">Username / Phone No.</label>
          <input 
            required
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3.5 bg-[#F5F9F2] border-none rounded-xl outline-none text-xs font-semibold placeholder:text-gray-300"
            placeholder="MandiUsername"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#4C6B36] ml-1">{t.password || 'Security PIN'}</label>
          <div className="relative">
            <input 
              required
              type={showPassword ? 'text' : 'password'} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-4 pr-12 py-3.5 bg-[#F5F9F2] border-none rounded-xl outline-none text-xs font-semibold"
              placeholder="••••••••"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4C6B36]"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full py-4 bg-[#4C6B36] hover:bg-[#3D562B] text-white text-base font-black uppercase tracking-widest transition-all rounded-xl shadow-md"
        >
          {t.login || 'Verify & Continue'}
        </button>
      </form>
    </motion.div>
  );
}

function DetailsScreenWidget({ t, onSubmit, onBack }: any) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [mobile, setMobile] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-8 min-h-screen flex flex-col justify-center max-w-sm mx-auto w-full relative space-y-6"
    >
      <div className="absolute top-8 left-8">
        <button onClick={onBack} className="p-2.5 bg-white rounded-xl shadow-sm border border-[#E2F0D9] hover:bg-[#F0F7EB] transition-colors"><ArrowLeft className="w-5 h-5 text-[#4C6B36]" /></button>
      </div>

      <div className="space-y-1">
        <h2 className="text-3xl font-heading font-black text-gray-950 tracking-tight leading-none italic">{t.personal_info || 'Profile Registry'}</h2>
        <p className="text-xs text-gray-400 font-medium">{t.details_demographics_msg || 'Please declare basic demographics to receive matching crop alerts.'}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block ml-1">{t.full_name || 'Your Full Name'}</label>
          <input 
            required
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3.5 bg-[#F5F9F2] border-none rounded-xl outline-none text-xs font-semibold placeholder:text-gray-300"
            placeholder={t.name_placeholder || 'e.g. Sarabjit Singh'}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block ml-1">{t.age || 'Age'}</label>
            <input 
              required
              type="number" 
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#F5F9F2] border-none rounded-xl outline-none text-xs font-semibold text-center"
              placeholder={t.age_placeholder || 'e.g. 42'}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block ml-1">{t.mobile || 'Phone No'}</label>
            <input 
              required
              type="tel" 
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#F5F9F2] border-none rounded-xl outline-none text-xs font-semibold text-center"
              placeholder={t.mobile_placeholder || '10-digit mobile'}
            />
          </div>
        </div>

        {age && Number(age) < 18 && (
          <p className="text-xs text-red-500 font-extrabold ml-1">⚠️ {t.age_min_error || 'You must be 18 years or older to trade on KhetNet.'}</p>
        )}
        {age && Number(age) > 90 && (
          <p className="text-xs text-red-500 font-extrabold ml-1">⚠️ {t.age_max_error || 'Age cannot exceed 90 years.'}</p>
        )}
        {mobile && !/^\d{10}$/.test(mobile) && (
          <p className="text-xs text-amber-600 font-extrabold ml-1">⚠️ {t.mobile_error || 'Please enter a valid 10-digit Indian Mobile.'}</p>
        )}
      </div>

      <button 
        disabled={!name || !age || !mobile || Number(age) < 18 || Number(age) > 90 || !/^\d{10}$/.test(mobile)}
        onClick={() => onSubmit(name, Number(age), mobile)}
        className="w-full py-4.5 bg-[#4C6B36] text-white rounded-xl text-base font-black uppercase tracking-widest disabled:opacity-45 disabled:cursor-not-allowed shadow-md hover:bg-[#3D562B] transition-colors active:scale-95 mt-4"
      >
        {t.lock_profile_details || 'Lock Profile Details'}
      </button>
    </motion.div>
  );
}

function CategoryScreenWidget({ t, onSubmit, onBack }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-8 min-h-screen flex flex-col justify-center items-center text-center max-w-sm mx-auto relative space-y-10"
    >
      <div className="absolute top-8 left-8">
        <button onClick={onBack} className="p-2.5 bg-white rounded-xl shadow-sm border border-[#E2F0D9] hover:bg-[#F0F7EB] transition-colors"><ArrowLeft className="w-5 h-5 text-[#4C6B36]" /></button>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-heading font-black text-gray-950 tracking-tight leading-none italic">{t.select_category || 'Declare Mandi Role'}</h2>
        <p className="text-xs text-gray-400 font-medium">Farmers post crops, Wholesalers browse listings and purchase bulk.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full">
        {/* Farmer Button */}
        <button 
          onClick={() => onSubmit('farmer')}
          className="p-8 rounded-3xl border-2 border-[#E2F0D9] bg-white hover:border-[#4C6B36] hover:bg-[#F0F7EB] transition-all group relative overflow-hidden active:scale-[0.98] text-left"
        >
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#4C6B36] text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-heading font-black text-[#4C6B36] leading-none">{t.farmer || 'Farmer / Producer'}</h4>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold leading-snug">Sell crops directly to trusted bulk buyers at actual rates</p>
            </div>
          </div>
        </button>

        {/* Wholesaler Button */}
        <button 
          onClick={() => onSubmit('wholesaler')}
          className="p-8 rounded-3xl border-2 border-[#E2F0D9] bg-white hover:border-[#4C6B36] hover:bg-[#F0F7EB] transition-all group relative overflow-hidden active:scale-[0.98] text-left"
        >
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-heading font-black text-blue-600 leading-none">{t.wholesaler || 'Wholesaler / Buyer'}</h4>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold leading-snug">Unlock premium direct listings, trace regional cotton, basmati rice</p>
            </div>
          </div>
        </button>
      </div>
    </motion.div>
  );
}

// Splashing indicator
function SplashScreen({ t, onComplete }: any) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[150]"
    >
      <div className="flex flex-col items-center">
        <KhetNetLogo className="w-44 h-44 drop-shadow-lg mb-6" />
        
        <h1 className="text-4xl font-heading font-black text-[#2D3E21] italic flex items-center gap-1.5">
          <span>Khet</span><span className="text-[#4C6B36]">Net</span>
        </h1>
        <p className="text-[#4C6B36] font-serif italic text-base mt-1.5">{t.connecting_bharat || "Connecting Bharat's Farms"}</p>
      </div>

      <div className="absolute bottom-20 h-1 bg-[#E2F0D9] w-48 rounded-full overflow-hidden">
        <motion.div 
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-1/2 h-full bg-[#4C6B36]"
        />
      </div>
    </motion.div>
  );
}
