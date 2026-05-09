
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  MapPin, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  User as UserIcon, 
  Plus, 
  Search, 
  ShoppingCart, 
  History, 
  FileText, 
  MessageCircle, 
  X, 
  ArrowLeft,
  Camera,
  LogOut,
  Send,
  Phone,
  Check,
  Ban,
  Trash2,
  Calendar,
  Bell,
  Home,
  Package,
  PackageCheck,
  Download,
  Clock,
  AlertCircle,
  Edit3,
  TrendingUp,
  Truck,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { translations } from './translations';
import { locations } from './locations';
import type { User, Product, Order, ChatMessage, Language } from './types';
import { GoogleGenAI } from "@google/genai";

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  verifyBeforeUpdateEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc, 
  updateDoc,
  serverTimestamp,
  increment,
  writeBatch,
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// --- Firestore Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Splash Screen Component
function SplashScreen({ t, onComplete }: any) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]"
    >
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 100,
          damping: 20,
          duration: 1
        }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-12">
          <motion.div
            animate={{ 
              rotate: [0, 5, 0, -5, 0],
              scale: [1, 1.05, 1, 1.05, 1]
            }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          >
            <KhetNetLogo className="w-56 h-56" />
          </motion.div>
          <motion.div 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 12 }}
            transition={{ delay: 1, type: "spring" }}
            className="absolute -top-4 -right-4 bg-[#4C6B36] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl border-2 border-white"
          >
            Organic
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, letterSpacing: "-0.05em" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="flex items-center gap-1 mb-2"
        >
          <span className="text-7xl font-heading font-black text-[#2D4522] italic">Khet</span>
          <span className="text-7xl font-heading font-black text-[#4C6B36]">Net</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-[#4C6B36] font-serif italic text-lg opacity-80"
        >
          {t.connecting_bharat || "Connecting Bharat's Farms"}
        </motion.p>
      </motion.div>

      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "200px" }}
        transition={{ delay: 0.5, duration: 2 }}
        className="absolute bottom-20 h-1 bg-[#E2F0D9] rounded-full overflow-hidden"
      >
        <motion.div 
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-1/2 h-full bg-[#4C6B36]"
        />
      </motion.div>
    </motion.div>
  );
}

// Logo Component: Professional Modern Logo for KhetNet
function KhetNetLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`relative ${className} overflow-hidden rounded-[25%] p-1 shadow-inner bg-white border-2 border-[#E2F0D9]`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="100%" stopColor="#E0F7FA" />
          </linearGradient>
        </defs>
        <rect width="100" height="60" fill="url(#skyGrad)" />
        
        <circle cx="20" cy="20" r="8" fill="white" fillOpacity="0.6" />
        <circle cx="30" cy="25" r="10" fill="white" fillOpacity="0.4" />
        <circle cx="80" cy="15" r="7" fill="white" fillOpacity="0.5" />
        
        <path d="M0 60 Q 50 45 100 60 V100 H0 Z" fill="#4C6B36" />
        <path d="M0 75 Q 50 65 100 75 V100 H0 Z" fill="#5D8242" />
        <path d="M0 85 Q 50 80 100 85 V100 H0 Z" fill="#6E994E" />
        
        <path d="M20 100 Q 30 70 60 60" stroke="#D2B48C" strokeWidth="6" fill="none" />
        
        <g transform="translate(45, 55) scale(0.6)">
          <rect x="10" y="15" width="40" height="20" fill="#E53935" rx="2" />
          <rect x="15" y="5" width="20" height="15" fill="#E53935" rx="1" />
          <rect x="18" y="7" width="14" height="10" fill="#BBDEFB" />
          <path d="M45 15 V5" stroke="black" strokeWidth="2" />
          <circle cx="15" cy="35" r="10" fill="#212121" />
          <circle cx="15" cy="35" r="5" fill="#757575" />
          <circle cx="45" cy="38" r="7" fill="#212121" />
          <circle cx="45" cy="38" r="3" fill="#757575" />
        </g>
      </svg>
    </div>
  );
}

type Stage = 'splash' | 'landing' | 'language' | 'location' | 'login' | 'details' | 'category' | 'dashboard' | 'host' | 'chat';

function LandingPage({ t, onNext }: { t: any, onNext: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FDFCF8] flex flex-col"
    >
      <div className="relative h-[50vh] w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2000&auto=format&fit=crop" 
          alt="Agriculture"
          className="w-full h-full object-cover grayscale-[20%] sepia-[10%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCF8] via-transparent to-black/40" />
        <div className="absolute top-10 left-8">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/20 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-[#4C6B36] flex items-center justify-center border-2 border-white/30">
              <span className="text-white font-heading italic text-lg leading-none">k</span>
            </div>
            <span className="font-heading italic text-white text-xl tracking-wide">KhetNet</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 pb-12 -mt-20 relative z-10 space-y-10 max-w-lg mx-auto w-full">
        <div className="space-y-4">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-heading font-black text-[#1D1D1D] leading-[0.95] tracking-tight italic"
          >
            {t.landing_title}
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-500 font-serif leading-relaxed"
          >
            {t.landing_subtitle}
          </motion.p>
        </div>

        <div className="grid gap-4">
          {[
            { icon: <TrendingUp className="text-[#4C6B36]" />, title: t.feature_direct, desc: t.feature_direct_desc },
            { icon: <Truck className="text-[#4C6B36]" />, title: t.feature_local, desc: t.feature_local_desc },
            { icon: <ShieldCheck className="text-[#4C6B36]" />, title: t.feature_secure, desc: t.feature_secure_desc },
          ].map((feature, i) => (
            <motion.div 
              key={`feature-${i}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex gap-4 p-4 rounded-2xl bg-white border border-[#E2F0D9] shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-[#F0F7EB] flex items-center justify-center shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-bold text-[#1D1D1D]">{feature.title}</h3>
                <p className="text-sm text-gray-400 font-medium leading-tight">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={onNext}
          className="w-full py-5 rounded-2xl bg-[#4C6B36] text-white font-bold text-lg shadow-lg hover:bg-[#3D562B] transition-all active:scale-95 flex items-center justify-center gap-3 group"
        >
          {t.get_started}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

  // Initialize Gemini per skill guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  export default function App() {
    // Persistence Keys
    const SESSION_KEY = 'khetnet_session';
    const LOGINS_KEY = 'khetnet_logins';
    const PRODUCTS_KEY = 'khetnet_products';
    const ORDERS_KEY = 'khetnet_orders';
    const CHAT_KEY = 'khetnet_chat';

    const [stage, setStage] = useState<Stage>('splash');
    const [lang, setLang] = useState<Language>('en');
    const [user, setUser] = useState<Partial<User>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
    const [aiInput, setAiInput] = useState('');

    // Persistence State (now synced with Firebase)
    const [allLogins, setAllLogins] = useState<User[]>([]);
    const [loginSessions, setLoginSessions] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [cart, setCart] = useState<{ productId: string, quantity: number }[]>(() => {
      const saved = localStorage.getItem('khetnet_cart');
      return saved ? JSON.parse(saved) : [];
    });
    const [activeTab, setActiveTab] = useState<'home' | 'search' | 'cart' | 'profile' | 'new_item' | 'orders'>('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [activeChat, setActiveChat] = useState<string | null>(null); // Order ID
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isAuthRestored, setIsAuthRestored] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    // Internal mapping for custom username login
    const getVirtualEmail = (u: string) => {
      const trimmed = u.trim().toLowerCase();
      if (trimmed.includes('@')) return trimmed;
      return `${trimmed}@khetnet.local`;
    };

    const logLogin = async (loggedUser: User) => {
      if (!loggedUser.id || !auth.currentUser) return;
      try {
        await addDoc(collection(db, 'login_sessions'), {
          userId: loggedUser.id,
          userName: loggedUser.name || 'Unknown',
          userEmail: loggedUser.email || 'No email',
          timestamp: new Date().toISOString(),
          device: navigator.platform,
          userAgent: navigator.userAgent
        });
      } catch (e) {
        console.warn("Could not log session:", e);
      }
    };

    // Sync Auth State
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              setUser(userData);
              setLang(userData.language || 'en');
              logLogin(userData); // Log session on auto-restore
            }
          } catch (e) {
            console.error("Error fetching user doc", e);
          }
        } else {
          setUser({});
        }
        setIsAuthRestored(true);
        setIsLoading(false);
      });

      // Test connection
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if(error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }
      }
      testConnection();

      return () => unsubscribe();
    }, []);

    // Sync Products
    useEffect(() => {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const prodItems = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Product));
        setProducts(prodItems);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));
      return () => unsubscribe();
    }, []);

    // Sync Orders
    useEffect(() => {
      if (!user.id || !user.role || !auth.currentUser) {
        if (user.id === 'demo_host') {
          console.log("Demo Host: Skipping real-time order sync (Auth needed)");
        }
        return;
      }
      let q;
      if (user.role === 'host') {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      } else if (user.role === 'farmer') {
        q = query(collection(db, 'orders'), where('farmerId', '==', user.id), orderBy('createdAt', 'desc'));
      } else {
        q = query(collection(db, 'orders'), where('wholesalerId', '==', user.id), orderBy('createdAt', 'desc'));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orderItems = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Order));
        setOrders(orderItems);
      }, (err) => {
        if (user.id === 'demo_host') return; // Suppress for demo
        handleFirestoreError(err, OperationType.LIST, 'orders');
      });
      return () => unsubscribe();
    }, [user.role, user.id, auth.currentUser]);

    // Sync Login Sessions (Only for Host)
    useEffect(() => {
      if (user.role !== 'host' || !auth.currentUser) return;
      const q = query(collection(db, 'login_sessions'), orderBy('timestamp', 'desc'), limit(50));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const sessions = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        setLoginSessions(sessions);
      }, (err) => console.warn("Could not sync sessions:", err));
      return () => unsubscribe();
    }, [user.role, auth.currentUser]);

    // Sync All Users (Only for Host)
    useEffect(() => {
      if (user.role !== 'host') return;
      
      if (user.id === 'demo_host' || !auth.currentUser) {
        // Populate with mock data for Demo Mode
        setAllLogins([
          { id: 'mock_1', name: 'Raj Kumar', role: 'farmer', state: 'Punjab', region: 'Bathinda', mobile: '9876543210', age: 45 },
          { id: 'mock_2', name: 'Amit Singh', role: 'wholesaler', state: 'Punjab', region: 'Ludhiana', mobile: '9988776655', age: 34 },
          { id: 'mock_3', name: 'Simran Kaur', role: 'farmer', state: 'Punjab', region: 'Patiala', mobile: '9812345678', age: 29 }
        ]);
        if (loginSessions.length === 0) {
          setLoginSessions([
            { id: 's1', userName: 'Raj Kumar', userEmail: 'raj@khet.net', device: 'Android', timestamp: new Date().toISOString(), userAgent: 'Mozilla/5.0...' },
            { id: 's2', userName: 'Amit Singh', userEmail: 'amit@khet.net', device: 'iPhone', timestamp: new Date(Date.now() - 3600000).toISOString(), userAgent: 'Mozilla/5.0...' }
          ]);
        }
        return;
      }

      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as User));
        setAllLogins(users);
      }, (err) => {
        if (user.id === 'demo_host') {
          console.warn("Demo Host user list restricted by rules. Enable Auth for full access.");
          return;
        }
        handleFirestoreError(err, OperationType.LIST, 'users');
      });
      return () => unsubscribe();
    }, [user.role, user.id, auth.currentUser]);

    // Sync Chat Messages
    useEffect(() => {
      if (!activeChat || !auth.currentUser) {
        setChatMessages([]);
        return;
      }
      const q = query(collection(db, 'chats', activeChat, 'messages'), orderBy('timestamp', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ChatMessage));
        setChatMessages(msgs);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `chats/${activeChat}/messages`));
      return () => unsubscribe();
    }, [activeChat, auth.currentUser]);

    // Save Cart to LocalStorage
    useEffect(() => {
      localStorage.setItem('khetnet_cart', JSON.stringify(cart));
    }, [cart]);

  const t = translations[lang];

  const handleLanguageSelect = (l: Language) => {
    setLang(l);
    localStorage.setItem('khetnet_lang', l);
    setStage('location');
  };

  const handleAreaSelect = (state: string, region: string) => {
    setUser(prev => ({ ...prev, state, region, language: lang }));
    if (auth.currentUser) {
      setStage('details');
    } else {
      setStage('login');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      alert("Please fill in both username and password.");
      return;
    }

    // Admin Override - Moved to top to bypass 6-char check
    if ((username.trim().toLowerCase() === 'admin' || username.trim() === 'host') && password === 'admin') {
      setIsActionLoading(true);
      setLoginError(null);
      try {
        console.log("Admin override triggered. Attempting real auth...");
        const result = await signInWithEmailAndPassword(auth, 'admin@khetnet.com', 'admin123'); // Changed to common placeholder
        const userData: User = { 
          id: result.user.uid, 
          name: 'Admin', 
          email: 'admin@khetnet.com', 
          role: 'host',
          age: 0,
          state: 'N/A',
          region: 'N/A',
          language: 'en'
        };
        setUser(userData);
        setStage('host');
        logLogin(userData);
      } catch (err: any) {
        console.warn("Real Admin Auth failed (likely not configured). Using Demo Admin mode.");
        const demoUser: User = { 
          id: 'demo_host', 
          name: 'Admin (Demo)', 
          email: 'admin@khetnet.com', 
          role: 'host',
          age: 0,
          state: 'N/A',
          region: 'N/A',
          language: 'en'
        };
        setUser(demoUser);
        setStage('host');
        // We don't log login for demo host to avoid permission errors
      } finally {
        setIsActionLoading(false);
      }
      return;
    }

    if (password.length < 6) {
      setLoginError(t.weak_password);
      return;
    }

    setIsActionLoading(true);
    setLoginError(null);
    const virtualEmail = getVirtualEmail(username);

    console.log("Attempting login for:", virtualEmail);

    try {
      const result = await signInWithEmailAndPassword(auth, virtualEmail, password);
      const fbUser = result.user;
      
      console.log("Login successful, fetching document for:", fbUser.uid);
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
        logLogin(userData); // Log session on interactive login
        if (userData.role && userData.name) {
          setStage(userData.role === 'host' ? 'host' : 'dashboard');
          // Important: ensure we stay on the home tab for the role
          setActiveTab('home');
        } else {
          setStage('details');
        }
      } else {
        // Logged in but no profile - go to details
        setStage('details');
      }
    } catch (err: any) {
      const errorCode = err.code || '';
      const errorMessage = (err.message || '').toLowerCase();
      
      // Detailed error mapping
      if (errorCode.includes('operation-not-allowed') || 
          errorMessage.includes('operation-not-allowed')) {
        setLoginError("Email/Password Auth is DISABLED. Continuing in Demo Mode...");
        setTimeout(() => {
          if (stage === 'login') {
            setStage('details');
            setLoginError(null);
          }
        }, 1500);
      } else if (
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/invalid-login-credentials' ||
        errorCode.includes('invalid-credential') ||
        errorMessage.includes('invalid-credential') ||
        errorMessage.includes('invalid credential')
      ) {
        // This is the most common case for new projects (merged errors)
        // We show a message then move to registration
        setLoginError("Account not found. Preparing registration form...");
        setTimeout(() => {
          if (stage === 'login') {
            setStage('details');
            setLoginError(null);
          }
        }, 800);
      } else if (errorCode === 'auth/wrong-password') {
        setLoginError("Incorrect password. Please try again.");
      } else if (errorCode === 'auth/too-many-requests') {
        setLoginError("Too many attempts. Please try again later.");
      } else if (errorCode.includes('network-request-failed')) {
        setLoginError("Network error. Please check your connection.");
      } else {
        setLoginError("Authentication process failed. Proceeding...");
        setTimeout(() => {
          if (stage === 'login') {
            setStage('details');
            setLoginError(null);
          }
        }, 1200);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDetailsSubmit = async (name: string, age: number, mobile: string) => {
    if (age < 18) return;
    setUser(prev => ({ ...prev, name, age, mobile }));
    setStage('category');
  };

  const handleCategorySelect = async (role: 'farmer' | 'wholesaler') => {
    console.log("handleCategorySelect called with role:", role, "username:", username);
    if (!username) {
      alert("Please enter a username first.");
      setStage('login');
      return;
    }
    if (password && password.length < 6 && username.toLowerCase() !== 'admin') {
      alert(t.weak_password || "Password must be at least 6 characters.");
      setStage('login');
      setIsActionLoading(false);
      return;
    }
    setIsActionLoading(true);
    const state = user.state;
    const region = user.region;
    
    if (!state || !region) {
      alert("Missing location information. Please go back and select your area.");
      setIsActionLoading(false);
      setStage('location');
      return;
    }

    const name = user.name || '';
    const age = user.age || 0;
    const mobile = user.mobile || '';

    const virtualEmail = getVirtualEmail(username);
    
    try {
      let currentFbUser = auth.currentUser;
      let finalUserId = '';

      if (!currentFbUser) {
        try {
          const result = await createUserWithEmailAndPassword(auth, virtualEmail, password);
          currentFbUser = result.user;
          finalUserId = currentFbUser.uid;
        } catch (authErr: any) {
          console.warn("Auth failed, continuing in Guest/Demo mode:", authErr);
          // If auth is disabled or fails, generate a demo ID to allow user to see the app
          finalUserId = `demo_${Math.random().toString(36).substr(2, 9)}`;
        }
      } else {
        finalUserId = currentFbUser.uid;
      }
      
      const newUser: User = { 
        id: finalUserId,
        name, 
        age, 
        mobile,
        email: virtualEmail,
        state,
        region,
        language: lang,
        role: role as any
      };

      try {
        await setDoc(doc(db, 'users', finalUserId), newUser);
        if (currentFbUser) {
          logLogin(newUser); // Log session on new registration
        }
      } catch (dbErr) {
        console.warn("Could not save user to Firestore (likely rules or connectivity). Using local state only.", dbErr);
      }

      setUser(newUser);
      setActiveTab('home');
      setStage('dashboard');
    } catch (err: any) {
      console.error("Critical failure in handleCategorySelect:", err);
      // Last resort fallback
      const demoId = `guest_${Date.now()}`;
      setUser({ 
        id: demoId, 
        name: name || 'Demo User', 
        age: age || 25, 
        mobile: mobile || '0000000000', 
        email: virtualEmail || `${demoId}@khetnet.local`, 
        state: state || 'Punjab', 
        region: region || 'Amritsar', 
        language: lang || 'en', 
        role: role as any 
      });
      setStage('dashboard');
    }
    setIsActionLoading(false);
  };

  const logout = async () => {
    setIsActionLoading(true);
    await signOut(auth);
    setUser({});
    setUsername('');
    setPassword('');
    setStage('language');
    setIsActionLoading(false);
  };

  const updateUserInfo = async (updates: Partial<User>) => {
    if (!user.id) return;
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, updates);
      
      // If mobile updated, update all their products too
      if (updates.mobile) {
        const q = query(collection(db, 'products'), where('farmerId', '==', user.id));
        const snapshots = await getDocs(q);
        const batch = writeBatch(db);
        snapshots.forEach(pDoc => {
          batch.update(doc(db, 'products', pDoc.id), { farmerMobile: updates.mobile });
        });
        await batch.commit();
      }

      setUser(prev => ({ ...prev, ...updates }));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.id}`);
      // Fallback update local state anyway
      setUser(prev => ({ ...prev, ...updates }));
    }
  };

  // AI Chat Logic
  const sendMessageToAi = async () => {
    if (!aiInput.trim()) return;
    const newMessages = [...aiMessages, { role: 'user' as const, text: aiInput }];
    setAiMessages(newMessages);
    const textToSubmit = aiInput;
    setAiInput('');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are the KhetNet Assistant. Strictly help the user ONLY with issues related to the KhetNet agricultural marketplace app. 
          If the user asks something unrelated to farming or KhetNet app features, politely decline and steer back to the app.
          User Role: ${user.role || 'Visitor'}.
          Selected Language: ${lang}. 
          Query: ${textToSubmit}`
      });

      const botText = response.text || "I couldn't generate a response.";
      setAiMessages([...newMessages, { role: 'bot' as const, text: botText }]);
    } catch (error) {
      setAiMessages([...newMessages, { role: 'bot' as const, text: "Sorry, I am having trouble connecting. Please try again later." }]);
    }
  };

  // Render Logic
  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1D1D1D] font-sans selection:bg-[#E2F0D9]">
      <AnimatePresence mode="wait">
        {stage === 'splash' && (
          <SplashScreen key="stage-splash" t={t} onComplete={() => {
            if (isAuthRestored) {
              if (auth.currentUser && user.role && user.name) {
                setStage(user.role === 'host' ? 'host' : 'dashboard');
              } else {
                setStage('language');
              }
            }
          }} />
        )}

        {isActionLoading && (
          <div key="action-loading" className="fixed inset-0 bg-[#FDFCF8]/80 backdrop-blur-sm flex flex-col items-center justify-center z-[110]">
            <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
               className="w-12 h-12 border-4 border-[#4C6B36] border-t-transparent rounded-full" 
            />
            <p className="mt-4 font-bold text-[#4C6B36] animate-pulse">{t.saving || 'Processing...'}</p>
          </div>
        )}

        {!isLoading && stage === 'language' && (
          <motion.div 
            key="stage-language"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-screen space-y-8 p-6"
          >
            <div className="bg-[#4C6B36] p-6 rounded-3xl shadow-xl shadow-[#4C6B36]/20">
              <KhetNetLogo className="w-20 h-20" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#2D3E21]">KhetNet</h1>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {[
                { id: 'en', label: 'English' },
                { id: 'hi', label: 'हिंदी' },
                { id: 'pa', label: 'ਪੰਜਾਬੀ' },
                { id: 'ta', label: 'தமிழ்' },
                { id: 'te', label: 'తెలుగు' },
                { id: 'kn', label: 'ಕನ್ನಡ' },
                { id: 'ml', label: 'മലയാളം' },
              ].map((l, i, arr) => (
              <button
                key={`lang-opt-${l.id}-${i}`}
                onClick={() => handleLanguageSelect(l.id as Language)}
                className={`p-5 rounded-2xl border-2 border-[#E2F0D9] bg-white hover:border-[#4C6B36] hover:bg-[#F0F7EB] transition-all text-xl font-medium shadow-sm active:scale-95 ${i === arr.length - 1 && arr.length % 2 !== 0 ? 'col-span-2' : ''}`}
              >
                {l.label}
              </button>
            ))}
          </div>
          </motion.div>
        )}

        {stage === 'location' && (
          <AreaSelection 
            key="stage-location"
            t={t} 
            onSelect={handleAreaSelect} 
            onBack={() => setStage('language')} 
            initialState={user.state}
            initialRegion={user.region}
          />
        )}

        {!isLoading && stage === 'login' && (
          <LoginScreen 
            key="stage-login"
            t={t} 
            username={username} 
            setUsername={setUsername} 
            password={password} 
            setPassword={setPassword} 
            showPassword={showPassword} 
            setShowPassword={setShowPassword} 
            onSubmit={handleLogin}
            error={loginError}
            isLoading={isActionLoading}
            onBack={() => setStage('location')}
            onSkip={() => setStage('details')}
          />
        )}

        {!isLoading && stage === 'details' && (
          <DetailsScreen key="stage-details" t={t} onSubmit={handleDetailsSubmit} onBack={() => setStage('login')} />
        )}

        {!isLoading && stage === 'category' && (
          <CategoryScreen key="stage-category" t={t} onSelect={handleCategorySelect} onBack={() => setStage('details')} />
        )}

        {!isLoading && stage === 'dashboard' && (
          <Dashboard 
            key="stage-dashboard"
            t={t} 
            user={user as User} 
            updateUserInfo={updateUserInfo}
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            products={products} 
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
            allLogins={allLogins}
            cart={cart}
            setCart={setCart}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchHistory={searchHistory}
            setSearchHistory={setSearchHistory}
            logout={logout}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
          />
        )}

        {!isLoading && stage === 'host' && (
          <HostDashboard 
            key="stage-host"
            t={t} 
            logins={allLogins} 
            loginSessions={loginSessions}
            onLogout={logout} 
          />
        )}
      </AnimatePresence>

      {/* AI Bot Icon & Bubble */}
      {stage !== 'splash' && stage !== 'language' && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2">
          <AnimatePresence>
            {!isAiOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                className="bg-white px-4 py-2 rounded-2xl shadow-xl shadow-[#4C6B36]/10 border border-[#E2F0D9] text-[#2D3E21] text-xs font-bold whitespace-nowrap mb-2 relative"
              >
                {t.hi}! {t.chat_bot_help}
                <div className="absolute right-4 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-[#E2F0D9] rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsAiOpen(!isAiOpen)}
            className="bg-[#4C6B36] text-white p-4 rounded-full shadow-lg shadow-[#4C6B36]/30 hover:bg-[#3D562B] transition-all transform hover:scale-110 active:scale-95"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* AI Bot Panel */}
      <AnimatePresence>
        {isAiOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed inset-x-4 bottom-24 bg-white rounded-3xl shadow-2xl border border-[#E2F0D9] overflow-hidden flex flex-col md:w-96 md:left-auto md:right-6 md:inset-x-auto h-[500px] z-[60]"
          >
            <div className="bg-[#4C6B36] p-4 flex items-center justify-between text-white">
              <span className="font-bold">KhetNet AI</span>
              <button onClick={() => setIsAiOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F9FBFA]">
              {aiMessages.map((m, i) => (
                <div key={`msg-${i}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${m.role === 'user' ? 'bg-[#4C6B36] text-white rounded-tr-none' : 'bg-white text-[#2D3E21] border border-[#E2F0D9] rounded-tl-none shadow-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {aiMessages.length === 0 && (
                <div className="text-center text-gray-400 mt-20 italic">
                  {t.chat_bot_help}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#E2F0D9] flex gap-2 bg-white">
              <input 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessageToAi()}
                type="text" 
                placeholder={t.type_message}
                className="flex-1 bg-[#F5F9F2] border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#4C6B36] outline-none"
              />
              <button onClick={sendMessageToAi} className="bg-[#4C6B36] text-white p-2 rounded-xl active:scale-95 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Support Components
function AreaSelection({ t, onSelect, onBack, initialState, initialRegion }: any) {
  const [selectedState, setSelectedState] = useState(initialState || '');
  const [selectedRegion, setSelectedRegion] = useState(initialRegion || '');

  return (
    <motion.div 
      key="location"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-screen p-6 max-w-md mx-auto"
    >
      <button onClick={onBack} className="p-2 mb-8 self-start hover:bg-[#F0F7EB] rounded-full transition-colors">
        <ArrowLeft className="w-6 h-6 text-[#4C6B36]" />
      </button>
      <h2 className="text-3xl font-bold text-[#2D3E21] mb-2">{t.select_area}</h2>
      <p className="text-gray-500 mb-8 italic">{t.working_region_msg}</p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-[#4C6B36] mb-2 uppercase tracking-wider">{t.state}</label>
          <select 
            className="w-full p-4 rounded-2xl border-2 border-[#E2F0D9] focus:border-[#4C6B36] outline-none bg-white transition-all appearance-none"
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setSelectedRegion(''); }}
          >
            <option value="">{t.select_state}</option>
            {Object.keys(locations).map((s, i) => <option key={`state-${s}-${i}`} value={s}>{s}</option>)}
          </select>
        </div>

        {selectedState && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <label className="block text-sm font-semibold text-[#4C6B36] mb-2 uppercase tracking-wider">{t.region}</label>
            <select 
              className="w-full p-4 rounded-2xl border-2 border-[#E2F0D9] focus:border-[#4C6B36] outline-none bg-white transition-all appearance-none"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="">{t.select_region}</option>
              {locations[selectedState as keyof typeof locations].map((r, i) => <option key={`reg-${r}-${i}`} value={r}>{r}</option>)}
            </select>
          </motion.div>
        )}
      </div>

      <div className="mt-auto pb-6">
        <button
          disabled={!selectedRegion}
          onClick={() => onSelect(selectedState, selectedRegion)}
          className="w-full py-5 rounded-2xl bg-[#4C6B36] text-white text-xl font-bold shadow-lg shadow-[#4C6B36]/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
        >
          {t.next}
        </button>
      </div>
    </motion.div>
  );
}

function LoginScreen({ t, username, setUsername, password, setPassword, showPassword, setShowPassword, onSubmit, error, isLoading, onBack, onSkip }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 h-screen flex flex-col justify-center max-w-sm mx-auto w-full relative"
    >
      <div className="absolute top-8 left-8">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border border-[#E2F0D9] hover:bg-[#F0F7EB] transition-colors"><ArrowLeft className="w-5 h-5 text-[#4C6B36]" /></button>
      </div>

      <div className="mb-12 flex flex-col items-center">
        <div className="w-24 h-24 bg-[#4C6B36] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#4C6B36]/30 mb-4">
          <KhetNetLogo className="w-16 h-16" />
        </div>
        <h2 className="text-2xl font-black text-[#2D3E21] tracking-tight">{t.welcome_to_khetnet}</h2>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-6">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-[#4C6B36] ml-1">{t.email_username}</label>
          <div className="relative group">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#4C6B36] transition-colors" />
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-[#E2F0D9] focus:border-[#4C6B36] outline-none transition-all placeholder:text-gray-300 shadow-sm"
              placeholder="Username"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-[#4C6B36] ml-1">{t.password}</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#4C6B36] transition-colors" />
            <input 
              type={showPassword ? 'text' : 'password'} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-[#E2F0D9] focus:border-[#4C6B36] outline-none transition-all shadow-sm"
              placeholder="••••••••"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4C6B36]"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 ml-1 font-medium">{t.weak_password}</p>
          <div className="flex items-center gap-2 mt-2 ml-1 cursor-pointer select-none" onClick={() => setShowPassword(!showPassword)}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showPassword ? 'bg-[#4C6B36] border-[#4C6B36]' : 'border-gray-300'}`}>
              {showPassword && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-gray-500">{t.show_password}</span>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-5 rounded-2xl bg-[#4C6B36] text-white font-bold text-lg shadow-lg hover:bg-[#3D562B] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" 
              />
            ) : (
              <>
                {t.login}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </form>
    </motion.div>
  );
}

function DetailsScreen({ t, onSubmit, onBack }: any) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [mobile, setMobile] = useState('');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 min-h-screen flex flex-col justify-center max-w-sm mx-auto w-full py-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border border-[#E2F0D9]"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-3xl font-bold text-[#2D3E21]">{t.personal_info}</h2>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#4C6B36] ml-1">{t.full_name}</label>
          <div className="relative group">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#4C6B36] transition-colors" />
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-[#E2F0D9] focus:border-[#4C6B36] outline-none transition-all placeholder:text-gray-300 shadow-sm"
              placeholder={t.name_placeholder}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-[#4C6B36] ml-1">{t.age}</label>
          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#4C6B36] transition-colors" />
            <input 
              type="number" 
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-[#E2F0D9] focus:border-[#4C6B36] outline-none transition-all placeholder:text-gray-300 shadow-sm"
              placeholder="e.g. 25"
            />
          </div>
          {age && Number(age) < 18 && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-500 text-xs font-bold mt-1 ml-1"
            >
              * Must be 18 or older
            </motion.p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-[#4C6B36] ml-1">{t.mobile}</label>
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#4C6B36] transition-colors" />
            <input 
              type="tel" 
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-[#E2F0D9] focus:border-[#4C6B36] outline-none transition-all placeholder:text-gray-300 shadow-sm"
              placeholder="10-digit mobile"
            />
          </div>
          {mobile && !/^\d{10}$/.test(mobile) && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-orange-500 text-xs font-bold mt-1 ml-1"
            >
              * Enter a valid 10-digit number
            </motion.p>
          )}
        </div>

        <button 
          disabled={!name || !age || !mobile || Number(age) < 18 || !/^\d{10}$/.test(mobile)}
          onClick={() => onSubmit(name, Number(age), mobile)}
          className="w-full py-5 rounded-2xl bg-[#4C6B36] text-white font-bold text-lg disabled:opacity-50 transition-all active:scale-95 mt-6 shadow-xl"
        >
          {t.next}
        </button>
      </div>
    </motion.div>
  );
}

function CategoryScreen({ t, onSelect, onBack }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-screen flex flex-col justify-center items-center text-center">
      <div className="absolute top-8 left-8">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border border-[#E2F0D9]"><ArrowLeft className="w-5 h-5" /></button>
      </div>
      <h2 className="text-3xl font-bold text-[#2D3E21] mb-12 max-w-xs">{t.select_category}</h2>
      <div className="grid grid-cols-1 gap-6 w-full max-w-xs">
        <button 
          onClick={() => onSelect('farmer')}
          className="p-10 rounded-3xl border-4 border-[#E2F0D9] bg-white hover:border-[#4C6B36] hover:bg-[#F0F7EB] transition-all group relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="w-16 h-16 bg-[#4C6B36] rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#4C6B36] tracking-tight">{t.farmer}</span>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#4C6B36]/5 rounded-full -mr-16 -mt-16 group-hover:bg-[#4C6B36]/10 transition-colors"></div>
        </button>

        <button 
          onClick={() => onSelect('wholesaler')}
          className="p-10 rounded-3xl border-4 border-[#E2F0D9] bg-white hover:border-[#4C6B36] hover:bg-[#F0F7EB] transition-all group relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="w-16 h-16 bg-[#4C6B36] rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#4C6B36] tracking-tight">{t.wholesaler}</span>
          </div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#4C6B36]/5 rounded-full -ml-16 -mb-16 group-hover:bg-[#4C6B36]/10 transition-colors"></div>
        </button>
      </div>
    </motion.div>
  );
}

// Main Dashboard Component
function Dashboard({ 
  t, user, updateUserInfo, activeTab, setActiveTab, products, setProducts, orders, setOrders, allLogins, cart, setCart, 
  searchQuery, setSearchQuery, searchHistory, setSearchHistory, logout, 
  activeChat, setActiveChat, chatMessages, setChatMessages
}: any) {
  const [now, setNow] = useState(Date.now());
  
  const handleUpdateEmail = async (newEmail: string) => {
    if (!auth.currentUser) return;
    try {
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
      await updateUserInfo({ email: newEmail });
      alert("A verification email has been sent to your new address. Please verify it to complete the change.");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        alert("For security, please logout and login again before changing your email.");
      } else {
        alert("Failed to update email: " + err.message);
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const nowTime = Date.now();
      setNow(nowTime);
      // Optional: Auto-decline expired orders if you want to be proactive on client side
      // But rules/backend should handle this too.
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const filteredProducts = products.filter((p: Product) => 
    (user.role === 'farmer' ? p.farmerId === user.id : (
      p.maxQuantity > 0 && 
      !orders.some((o: any) => o.productId === p.id && o.status !== 'declined')
    )) && 
    (user.role === 'host' || user.role === 'farmer' || (p.region === user.region && p.state === user.state)) &&
    (searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)
  );

  const cartItemsCount = cart.length;

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setCart((prev: any) => {
      const existing = prev.find((i: any) => i.productId === productId);
      if (existing) {
        if (existing.quantity >= product.maxQuantity) {
          alert(`${t.max_quantity_reached}: ${product.maxQuantity}kg`);
          return prev;
        }
        return prev.map((i: any) => 
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev: any) => prev.filter((i: any) => i.productId !== productId));
  };

  const updateCartQty = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart((prev: any) => prev.map((i: any) => {
      if (i.productId === productId) {
        const newQty = i.quantity + delta;
        if (newQty > product.maxQuantity) {
          alert(`${t.max_quantity_reached}: ${product.maxQuantity}kg`);
          return i;
        }
        return { ...i, quantity: Math.max(1, newQty) };
      }
      return i;
    }
    ));
  };

  const placeOrder = async () => {
    if (!user.id) return;
    
    try {
      const batch = writeBatch(db);
      const newOrders: Order[] = [];

      for (const item of cart) {
        const product = products.find((p: Product) => p.id === item.productId);
        if (!product) continue;
        
        const orderId = Math.random().toString(36).substr(2, 9);
        const order: Order = {
          id: orderId,
          productId: item.productId,
          productName: product.name,
          wholesalerId: user.id,
          wholesalerName: user.name || 'Wholesaler',
          farmerId: product.farmerId,
          farmerName: product.farmerName,
          farmerMobile: product.farmerMobile || '', // Ensure this is stored in product
          status: 'pending',
          expiryTime: Date.now() + (4 * 60 * 60 * 1000),
          createdAt: Date.now(),
          totalCost: (product.costPerKg || 1) * item.quantity,
          quantity: item.quantity
        };

        const orderRef = doc(db, 'orders', orderId);
        batch.set(orderRef, order);
        
        // Deduct quantity atomically
        const productRef = doc(db, 'products', item.productId);
        batch.update(productRef, { maxQuantity: increment(-item.quantity) });
        
        newOrders.push(order);
      }

      await batch.commit();
      setCart([]);
      alert(t.request_sent);
    } catch (e) {
      console.error("Order placement failed:", e);
      setCart([]);
      alert(t.request_sent + " (Demo Mode)");
    }
  };

  // Order Actions
  const handleOrderAction = async (orderId: string, action: 'approved' | 'declined') => {
    const order = orders.find((o: Order) => o.id === orderId);
    if (!order) return;

    try {
      const orderRef = doc(db, 'orders', orderId);
      
      if (action === 'declined') {
        const batch = writeBatch(db);
        batch.update(orderRef, { status: action });
        // Restore quantity
        const productRef = doc(db, 'products', order.productId);
        batch.update(productRef, { maxQuantity: increment(order.quantity) });
        await batch.commit();
      } else {
        await updateDoc(orderRef, { status: action });
        // Create a chat document when approved
        const chatRef = doc(db, 'chats', orderId);
        await setDoc(chatRef, {
          id: orderId,
          orderId: orderId,
          participants: [order.farmerId, order.wholesalerId],
          lastMessage: '',
          lastUpdate: serverTimestamp()
        });
      }

      if (action === 'approved') {
        const msg = t.farmer_approved_msg;
        alert(msg);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("KhetNet", { body: msg });
        }
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleMarkReceived = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'received' });
      alert(t.order_received_msg);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("KhetNet", { body: t.order_received_msg });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  return (
    <div className={`pb-24 pt-4 px-4 min-h-screen ${user.role === 'farmer' ? 'bg-[#F9FBFA]' : 'bg-[#F0F4FF]'}`}>
      <header className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-5">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`w-14 h-14 rounded-[28%] flex items-center justify-center shadow-xl border-2 border-white ${user.role === 'farmer' ? 'bg-[#4C6B36]' : 'bg-[#1D4ED8]'}`}
          >
            <KhetNetLogo className="w-9 h-9" />
          </motion.div>
          <div>
            <div className="flex flex-col">
              <p className="text-gray-400 font-serif italic text-lg leading-none mb-1">{t.hi},</p>
              <h3 className="text-3xl font-heading font-black italic tracking-tight text-[#1D1D1D] leading-none mb-2">
                {user.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest border ${user.role === 'farmer' ? 'bg-[#F0F7EB] text-[#4C6B36] border-[#E2F0D9]' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                  {user.role === 'farmer' ? t.farmer : t.wholesaler}
                </span>
                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 opacity-70">
                  <MapPin className="w-2.5 h-2.5" /> {user.region}
                </span>
              </div>
            </div>
          </div>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={logout} 
          className="p-3.5 bg-white rounded-2xl shadow-sm border border-[#F0F0F0] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
        </motion.button>
      </header>

      <main className="max-w-xl mx-auto">
        {user.id && !user.mobile && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl shadow-lg flex items-center justify-between text-white ${user.role === 'farmer' ? 'bg-[#4C6B36] shadow-[#4C6B36]/20' : 'bg-[#2563EB] shadow-blue-500/20'}`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">{t.complete_profile_msg}</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 bg-white rounded-xl text-xs font-black uppercase tracking-wider ${user.role === 'farmer' ? 'text-[#4C6B36]' : 'text-blue-600'}`}
            >
              {t.add_mobile}
            </button>
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          {activeChat ? (
            <ChatInterface 
              t={t} 
              order={orders.find((o: Order) => o.id === activeChat)} 
              user={user} 
              messages={chatMessages}
              onSend={async (text: string, isLocation = false, isReceivedSignal = false) => {
                if (isReceivedSignal && activeChat) {
                  handleMarkReceived(activeChat);
                  return;
                }
                if (!activeChat || !user.id) return;
                try {
                  const chatMessagesRef = collection(db, 'chats', activeChat, 'messages');
                  const msgDoc = {
                    orderId: activeChat,
                    senderId: user.id,
                    senderName: user.name || 'User',
                    text: isLocation ? t.shared_location : text,
                    timestamp: Date.now(),
                    location: isLocation ? { lat: 0, lng: 0 } : undefined
                  };
                  try {
                    await addDoc(chatMessagesRef, msgDoc);
                    
                    // Update chat last message
                    await updateDoc(doc(db, 'chats', activeChat), {
                      lastMessage: isLocation ? t.shared_location : text,
                      lastUpdate: serverTimestamp()
                    });
                  } catch (chatError) {
                    console.warn("Chat Firestore write failed (Demo Mode):", chatError);
                    // No-op for demo
                  }
                } catch (e) {
                  console.error("Chat failure:", e);
                  handleFirestoreError(e, OperationType.CREATE, `chats/${activeChat}/messages`);
                }
              }}
              onBack={() => setActiveChat(null)} 
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {user.role === 'farmer' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                      <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-[32px] border border-[#E2F0D9] shadow-sm flex flex-col justify-between"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-[#F0F7EB] flex items-center justify-center mb-4">
                          <TrendingUp className="w-5 h-5 text-[#4C6B36]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-60 mb-1">Total Sales</p>
                          <h4 className="text-2xl font-black text-[#1D1D1D] tracking-tighter">₹{orders.filter(o => o.farmerId === user.id && o.status === 'received').reduce((acc, curr) => acc + curr.totalCost, 0).toLocaleString()}</h4>
                        </div>
                      </motion.div>
                      <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-[32px] border border-[#E2F0D9] shadow-sm flex flex-col justify-between"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-[#F0F7EB] flex items-center justify-center mb-4">
                          <PackageCheck className="w-5 h-5 text-[#4C6B36]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-60 mb-1">Items Sold</p>
                          <h4 className="text-2xl font-black text-[#1D1D1D] tracking-tighter">{orders.filter(o => o.farmerId === user.id && o.status === 'received').length}</h4>
                        </div>
                      </motion.div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">{t.new_orders}</h2>
                          <span className="text-xs font-bold text-[#4C6B36] bg-[#F0F7EB] px-2 py-1 rounded-full uppercase">{t.farmer_feed}</span>
                        </div>
                        <div className="space-y-5">
                          <AnimatePresence mode="popLayout">
                            {orders.filter((o: Order) => o.farmerId === user.id && o.status === 'pending').map((o: Order, oIdx: number) => {
                              const isExpired = Date.now() > (o.expiryTime || 0);
                              const timeLeft = (o.expiryTime || 0) - now;
                              const hours = Math.floor(Math.max(0, timeLeft) / (1000 * 60 * 60));
                              const minutes = Math.floor((Math.max(0, timeLeft) % (1000 * 60 * 60)) / (1000 * 60));
                              const seconds = Math.floor((Math.max(0, timeLeft) % (1000 * 60)) / 1000);

                              return (
                                <motion.div 
                                  key={`order-p-${o.id}-${oIdx}`}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ delay: oIdx * 0.1 }}
                                  className="bg-white p-6 rounded-[32px] shadow-sm border border-[#E2F0D9] flex flex-col gap-5 hover:shadow-xl transition-all duration-500"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-heading italic text-2xl font-bold text-[#1D1D1D] leading-none mb-1">{o.productName}</h4>
                                      <div className="flex flex-col gap-1.5 pt-1">
                                        <p className="text-sm text-gray-500 font-serif italic">{o.wholesalerName} • {o.quantity}kg</p>
                                        {!isExpired && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] w-fit bg-red-50 text-red-600 px-3 py-1 rounded-full font-black flex items-center gap-1.5 uppercase tracking-widest border border-red-100">
                                              <Clock className="w-3.5 h-3.5" /> {hours}h {minutes}m {seconds}s
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-2xl font-heading font-black text-[#4C6B36]">₹{o.totalCost}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-3 pt-2">
                                    <button onClick={() => handleOrderAction(o.id, 'approved')} className="flex-1 py-4 bg-[#4C6B36] text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#4C6B36]/20 transition-all border-b-4 border-black/10">
                                      <Check className="w-5 h-5" /> {t.approve}
                                    </button>
                                    <button onClick={() => handleOrderAction(o.id, 'declined')} className="flex-1 py-4 bg-white text-red-500 border-2 border-red-50 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                                      <Ban className="w-5 h-5" /> {t.decline}
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-bold">{t.your_items}</h2>
                        </div>
                        {products.filter((p: Product) => p.farmerId === user.id).length === 0 ? (
                          <EmptyState icon={<Package />} text={t.no_products} />
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {products.filter((p: Product) => p.farmerId === user.id).map((p: Product, idx: number) => (
                              <motion.div 
                                key={`my-prod-${p.id}-${idx}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white p-4 rounded-[32px] shadow-sm border border-[#E2F0D9] group hover:shadow-lg transition-all duration-300"
                              >
                                <div className="aspect-square bg-[#F5F9F2] rounded-[24px] mb-4 flex items-center justify-center overflow-hidden border border-[#E2F0D9]">
                                  <img 
                                    src={`https://source.unsplash.com/featured/?${p.name},crop,farm`} 
                                    alt={p.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <h4 className="font-heading italic text-lg font-bold text-[#1D1D1D] truncate leading-none mb-1">{p.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate mb-3">{p.region}</p>
                                <div className="flex justify-between items-center mt-auto border-t border-[#F5F9F2] pt-3">
                                  <div>
                                    <span className="text-[8px] text-gray-400 block uppercase font-black tracking-tighter opacity-60">Inventory</span>
                                    <span className={`font-heading italic text-xl font-black ${p.maxQuantity === 0 ? 'text-red-500' : 'text-[#4C6B36]'}`}>{p.maxQuantity}<span className="text-[10px] lowercase font-serif ml-0.5">kg</span></span>
                                  </div>
                                  <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={async () => {
                                      const newQty = prompt(`${t.max_quantity} (kg):`, p.maxQuantity.toString());
                                      if (newQty !== null && !isNaN(Number(newQty))) {
                                        try {
                                          await updateDoc(doc(db, 'products', p.id), { maxQuantity: Number(newQty) });
                                        } catch (e) {
                                          handleFirestoreError(e, OperationType.UPDATE, `products/${p.id}`);
                                        }
                                      }
                                    }}
                                    className="p-2.5 bg-[#F0F7EB] text-[#4C6B36] rounded-xl hover:bg-[#4C6B36] hover:text-white transition-all shadow-sm shadow-[#4C6B36]/5"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div 
                          whileHover={{ y: -5 }}
                          className="bg-white p-6 rounded-[32px] border border-blue-50 shadow-sm flex flex-col justify-between"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-60 mb-1">Spent</p>
                            <h4 className="text-2xl font-black text-[#1D1D1D] tracking-tighter">₹{orders.filter(o => o.wholesalerId === user.id && o.status === 'received').reduce((acc, curr) => acc + curr.totalCost, 0).toLocaleString()}</h4>
                          </div>
                        </motion.div>
                        <motion.div 
                          whileHover={{ y: -5 }}
                          className="bg-white p-6 rounded-[32px] border border-blue-50 shadow-sm flex flex-col justify-between"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                            <Truck className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-60 mb-1">Procured</p>
                            <h4 className="text-2xl font-black text-[#1D1D1D] tracking-tighter">{orders.filter(o => o.wholesalerId === user.id && o.status === 'received').length}</h4>
                          </div>
                        </motion.div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-bold">{t.available_buying}</h2>
                          <span className="text-xs font-bold text-[#4C6B36] bg-[#F0F7EB] px-2 py-1 rounded-full uppercase">{t.local_items}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <AnimatePresence mode="popLayout">
                            {filteredProducts.map((p: Product, i: number) => (
                              <motion.div 
                                key={`prod-${p.id}-${i}`}
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
                                className="bg-white p-4 rounded-[32px] shadow-sm border border-[#E2F0D9] group hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                              >
                                <div className="aspect-square bg-[#F5F9F2] rounded-[24px] mb-4 relative overflow-hidden shadow-inner border border-[#E2F0D9]">
                                  <img 
                                    src={p.photo || `https://source.unsplash.com/featured/?${p.name},crop,farm`} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                    alt={p.name} 
                                    referrerPolicy="no-referrer"
                                  />
                                  <motion.button 
                                    whileTap={{ scale: 0.8 }}
                                    onClick={() => addToCart(p.id)}
                                    className="absolute bottom-3 right-3 p-3.5 bg-[#4C6B36] text-white rounded-2xl shadow-2xl transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 shadow-#4C6B36/20 border-2 border-white/20"
                                  >
                                    <Plus className="w-6 h-6" />
                                  </motion.button>
                                  
                                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-[9px] font-black text-white uppercase tracking-widest shadow-sm">
                                     Fresh
                                  </div>
                                </div>
                                <h4 className="font-heading italic text-xl font-bold text-[#1D1D1D] truncate px-1 leading-none mb-1">{p.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate px-1 mb-1">{p.region}</p>
                                <p className="text-xs text-gray-400 font-serif italic truncate px-1 mb-4 opacity-70">by {p.farmerName}</p>
                                
                                <div className="flex items-center justify-between px-1 border-t border-[#F5F9F2] pt-3">
                                  <span className="font-heading italic text-2xl font-black text-[#4C6B36]">₹{p.costPerKg}<span className="text-xs font-serif ml-0.5 opacity-60">/kg</span></span>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'search' && (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchQuery && !searchHistory.includes(searchQuery) && setSearchHistory([searchQuery, ...searchHistory.slice(0, 4)])}
                      placeholder={t.search}
                      className="w-full pl-12 pr-4 py-4 rounded-3xl border-2 border-[#E2F0D9] bg-white focus:border-[#4C6B36] outline-none shadow-sm"
                    />
                  </div>
                  
                  {searchHistory.length > 0 && !searchQuery && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <History className="w-3 h-3" /> {t.search_history}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {searchHistory.map((s: string, i: number) => (
                          <button key={`history-${s}-${i}`} onClick={() => setSearchQuery(s)} className="px-4 py-2 bg-white border border-[#E2F0D9] rounded-2xl text-sm font-medium hover:border-[#4C6B36] transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchQuery && (
                    <div className="space-y-4">
                      {filteredProducts.map((p: Product, i: number) => (
                         <div key={`search-${p.id}-${i}`} className="bg-white p-4 rounded-3xl border border-[#E2F0D9] flex gap-4 items-center">
                            <div className="w-16 h-16 bg-[#F5F9F2] rounded-2xl flex-shrink-0 border border-[#E2F0D9]" />
                            <div className="flex-1">
                              <h4 className="font-bold">{p.name}</h4>
                              <p className="text-xs text-gray-500">₹{p.costPerKg}/kg • {p.region}</p>
                            </div>
                            <button onClick={() => addToCart(p.id)} className="p-3 bg-[#4C6B36] text-white rounded-2xl active:scale-95 transition-all">
                              <Plus className="w-5 h-5" />
                            </button>
                         </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'cart' && (
                <motion.div key="cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6">{t.cart}</h2>
                  {cart.length === 0 ? (
                    <EmptyState icon={<ShoppingCart />} text={t.cart_empty} />
                  ) : (
                    <>
                      <div className="space-y-4">
                        {cart.map((item: any, i: number) => {
                          const p = products.find(prod => prod.id === item.productId);
                          return (
                            <div key={`cart-${item.productId}-${i}`} className="bg-white p-4 rounded-3xl border border-[#E2F0D9] flex items-center gap-4">
                              <div className="w-16 h-16 bg-[#F5F9F2] rounded-2xl flex-shrink-0" />
                              <div className="flex-1">
                                <h4 className="font-bold">{p?.name || 'Item'}</h4>
                                <p className="text-sm text-[#4C6B36] font-bold">₹{p?.costPerKg || 0} /kg</p>
                              </div>
                              <div className="flex items-center gap-3 bg-[#F9FBFA] p-1 rounded-2xl">
                                <button onClick={() => updateCartQty(item.productId, -1)} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-[#4C6B36]"><Plus className="w-4 h-4 rotate-45" /></button>
                                <div className="flex flex-col items-center min-w-[32px]">
                                  <span className="font-bold text-center">{item.quantity}</span>
                                  <span className="text-[8px] text-gray-400 font-bold">max {p?.maxQuantity}</span>
                                </div>
                                <button 
                                  onClick={() => updateCartQty(item.productId, 1)} 
                                  disabled={item.quantity >= (p?.maxQuantity || 0)}
                                  className={`p-2 rounded-xl transition-all ${item.quantity >= (p?.maxQuantity || 0) ? 'bg-gray-100 text-gray-300' : 'hover:bg-white text-gray-400 hover:text-[#4C6B36]'}`}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              <button onClick={() => removeFromCart(item.productId)} className="p-2 text-red-100 hover:text-red-500 transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-[#E2F0D9] shadow-sm flex flex-col gap-4 mt-8">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">{t.total_cost}</span>
                          <span className="text-2xl font-black text-[#4C6B36]">₹{cart.reduce((acc: number, item: any) => acc + (products.find(p => p.id === item.productId)?.costPerKg || 0) * item.quantity, 0)}</span>
                        </div>
                        <button onClick={placeOrder} className="w-full py-5 bg-[#4C6B36] text-white rounded-2xl font-bold text-lg shadow-xl shadow-[#4C6B36]/20 active:scale-95 transition-all">
                          {t.place_order}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6">{t.orders}</h2>
                  <div className="space-y-4">
                    {orders.filter((o: Order) => user.role === 'farmer' ? o.farmerId === user.id : o.wholesalerId === user.id).length === 0 ? (
                      <EmptyState icon={<FileText />} text={t.no_orders_yet} />
                    ) : (
                      orders.filter((o: Order) => user.role === 'farmer' ? o.farmerId === user.id : o.wholesalerId === user.id).map((o: Order, i: number) => {
                        const isExpired = o.status === 'pending' && now > (o.expiryTime || 0);
                        const timeLeft = (o.expiryTime || 0) - now;
                        const hours = Math.floor(Math.max(0, timeLeft) / (1000 * 60 * 60));
                        const minutes = Math.floor((Math.max(0, timeLeft) % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((Math.max(0, timeLeft) % (1000 * 60)) / 1000);

                        return (
                          <div key={`order-t-${o.id}-${o.status}-${i}`} className={`bg-white p-5 rounded-3xl border border-[#E2F0D9] shadow-sm relative overflow-hidden group transition-all hover:shadow-md ${isExpired ? 'opacity-60' : ''}`}>
                             <div className="flex justify-between items-start mb-4">
                               <div className="flex-1">
                                 <h4 className="font-bold text-lg leading-tight truncate pr-2">{o.productName}</h4>
                                 <div className="flex flex-col gap-2 mt-2">
                                   <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-widest"><Calendar className="w-3 h-3" /> {new Date(o.createdAt).toLocaleDateString()}</p>
                                   
                                   {o.status === 'pending' && !isExpired && (
                                     <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                         <span className="text-[11px] bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-black animate-pulse flex items-center gap-1 border border-orange-100 shadow-sm">
                                           <Clock className="w-3.5 h-3.5" /> {hours}h {minutes}m {seconds}s
                                         </span>
                                       </div>
                                       {user.role === 'wholesaler' && (
                                         <div className="flex items-center gap-2 text-orange-600 bg-orange-50/50 p-2 rounded-xl border border-dashed border-orange-200">
                                           <AlertCircle className="w-4 h-4 shrink-0" />
                                           <p className="text-[10px] font-black uppercase tracking-tight italic">
                                             {t.order_not_approved}
                                           </p>
                                         </div>
                                       )}
                                       {user.role === 'farmer' && (
                                          <p className="text-[10px] text-[#4C6B36] font-bold italic opacity-70">
                                            {t.order_confirmation_notice}
                                          </p>
                                       )}
                                     </div>
                                   )}
                                   
                                   {(o.status === 'declined' || isExpired) && user.role === 'wholesaler' && (
                                     <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-2xl border-2 border-red-100 animate-bounce-slow">
                                       <Ban className="w-5 h-5 shrink-0" />
                                       <p className="text-xs font-black uppercase tracking-tight">
                                         {t.order_cancelled}
                                       </p>
                                     </div>
                                   )}
                                 </div>
                               </div>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                                o.status === 'approved' ? 'bg-[#E2F0D9] text-[#4C6B36]' : 
                                o.status === 'received' ? 'bg-[#4C6B36] text-white' :
                                o.status === 'declined' || isExpired ? 'bg-red-50 text-red-500' : 
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {isExpired ? t.declined : t[o.status]}
                                {o.status === 'approved' && <Check className="w-3 h-3" />}
                                {o.status === 'received' && <PackageCheck className="w-3 h-3" />}
                                {(o.status === 'declined' || isExpired) && <Ban className="w-3 h-3" />}
                              </span>
                            </div>

                            {user.role === 'farmer' && o.status === 'pending' && !isExpired && (
                              <div className="flex gap-2 mb-4">
                                <button 
                                  onClick={() => handleOrderAction(o.id, 'approved')}
                                  className="flex-1 py-3 bg-[#4C6B36] text-white rounded-2xl text-xs font-black shadow-lg shadow-[#4C6B36]/10 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                >
                                  {t.approve}
                                </button>
                                <button 
                                  onClick={() => handleOrderAction(o.id, 'declined')}
                                  className="flex-1 py-3 bg-red-50 text-red-500 rounded-2xl text-xs font-black active:scale-95 transition-all uppercase tracking-widest"
                                >
                                  {t.decline}
                                </button>
                              </div>
                            )}

                            {user.role === 'wholesaler' && o.status === 'approved' && (
                              <div className="mb-4 space-y-3">
                                <div className="p-4 bg-[#F0F7EB] rounded-2xl border-2 border-[#4C6B36]/20 flex items-center justify-between group/contact ring-2 ring-[#4C6B36]/5">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-[#E2F0D9]">
                                      <Phone className="w-5 h-5 text-[#4C6B36]" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1.5">{t.farmer_contact}</p>
                                      <p className="text-base font-black text-[#4C6B36] tracking-tight">{o.farmerMobile || 'N/A'}</p>
                                    </div>
                                  </div>
                                  <a href={`tel:${o.farmerMobile}`} className="p-3 bg-[#4C6B36] text-white rounded-xl shadow-lg hover:bg-[#3D562B] transition-all active:scale-90 flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Call</span>
                                  </a>
                                </div>

                                <button 
                                  onClick={() => handleMarkReceived(o.id)}
                                  className="w-full py-4 bg-[#4C6B36] text-white rounded-2xl text-xs font-black shadow-lg shadow-[#4C6B36]/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest border-b-4 border-[#3D562B]"
                                >
                                  {t.mark_received} <PackageCheck className="w-5 h-5" />
                                </button>
                              </div>
                            )}

                            <div className="flex justify-between items-center border-t border-[#F5F9F2] pt-4">
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-widest">{t.total_cost}</span>
                                <span className="font-black text-[#4C6B36] text-lg">₹{o.totalCost}</span>
                              </div>
                              {o.status === 'approved' && (
                                <button onClick={() => setActiveChat(o.id)} className="flex items-center gap-2 px-4 py-2 bg-[#F0F7EB] rounded-xl text-xs font-black text-[#4C6B36] hover:bg-[#E2F0D9] transition-all transform hover:scale-105 active:scale-95 uppercase tracking-widest">
                                  <MessageCircle className="w-4 h-4" /> {t.chat}
                                </button>
                              )}
                            </div>

                            {o.status === 'approved' && user.role === 'wholesaler' && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-2xl flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                                  <Bell className="w-4 h-4" />
                                </div>
                                <p className="text-[10px] text-blue-700 font-bold leading-tight">{t.contact_unlocked}</p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'new_item' && (
                <motion.div key="new_item" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <h2 className="text-2xl font-bold">{t.new_item}</h2>
                  <NewItemForm t={t} user={user} onSubmit={async (productData: any) => {
                    if (!user.id) return;
                    try {
                      const productId = Math.random().toString(36).substr(2, 9);
                      const newProduct: Product = {
                        ...productData,
                        id: productId,
                        farmerId: user.id,
                        farmerName: user.name || 'Farmer',
                        farmerMobile: user.mobile || '',
                        state: user.state!,
                        region: user.region!,
                        createdAt: Date.now()
                      };
                      await setDoc(doc(db, 'products', productId), newProduct);
                      setActiveTab('home');
                      alert(t.product_added);
                    } catch (e) {
                      console.error("Product creation failed:", e);
                      setActiveTab('home');
                      alert(t.product_added + " (Demo Mode)");
                    }
                  }} />
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-[#E2F0D9] rounded-3xl flex items-center justify-center mb-4 border-2 border-white shadow-xl">
                      <UserIcon className="w-12 h-12 text-[#4C6B36]" />
                    </div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <p className="text-sm font-bold text-[#4C6B36] uppercase tracking-widest">{user.role ? t[user.role] : ''}</p>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#E2F0D9] p-6 space-y-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.age}</label>
                      <span className="font-bold">{user.age}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.email}</label>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{user.email}</span>
                        <button 
                          onClick={() => {
                            const newEmail = prompt("Enter your new email address:", user.email);
                            if (newEmail && newEmail !== user.email) {
                              handleUpdateEmail(newEmail);
                            }
                          }}
                          className="p-1 text-[#4C6B36] hover:bg-[#F0F7EB] rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.mobile}</label>
                      <div className="flex items-center gap-2">
                        {user.mobile ? (
                          <span className="font-bold">{user.mobile}</span>
                        ) : (
                          <span className="text-gray-300 italic text-sm">{t.add_mobile}</span>
                        )}
                        <button 
                          onClick={() => {
                            const newMobile = prompt(t.mobile_placeholder, user.mobile || '');
                            if (newMobile !== null) updateUserInfo({ mobile: newMobile });
                          }}
                          className="p-1 text-[#4C6B36] hover:bg-[#F0F7EB] rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {!user.mobile && (
                    <p className="text-xs text-gray-400 text-center italic">{t.complete_profile_msg}</p>
                  )}
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      {!activeChat && (
        <nav className={`fixed bottom-0 inset-x-0 backdrop-blur-xl border-t px-6 py-4 pb-8 flex justify-between items-center rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 ${user.role === 'farmer' ? 'bg-white/90 border-[#E2F0D9]' : 'bg-blue-50/90 border-blue-100'}`}>
          {user.role === 'wholesaler' ? (
            <>
              <NavButton icon={<Home />} label={t.home} active={activeTab === 'home'} onClick={() => setActiveTab('home')} role="wholesaler" />
              <NavButton icon={<Search />} label={t.search} active={activeTab === 'search'} onClick={() => setActiveTab('search')} role="wholesaler" />
              <div className="relative">
                <NavButton icon={<ShoppingCart />} label={t.cart} active={activeTab === 'cart'} onClick={() => setActiveTab('cart')} role="wholesaler" />
                {cartItemsCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">{cartItemsCount}</span>}
              </div>
              <NavButton icon={<FileText />} label={t.orders} active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} role="wholesaler" />
              <NavButton icon={<UserIcon />} label={t.profile} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} role="wholesaler" />
            </>
          ) : (
            <>
              <NavButton icon={<Home />} label={t.home} active={activeTab === 'home'} onClick={() => setActiveTab('home')} role="farmer" />
              <NavButton icon={<Camera />} label={t.new_item} active={activeTab === 'new_item'} onClick={() => setActiveTab('new_item')} role="farmer" />
              <NavButton icon={<FileText />} label={t.orders} active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} role="farmer" />
              <NavButton icon={<UserIcon />} label={t.profile} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} role="farmer" />
            </>
          )}
        </nav>
      )}
    </div>
  );
}

function NavButton({ icon, label, active, onClick, role }: any) {
  const roleColor = role === 'farmer' ? '#4C6B36' : '#2563EB';
  const roleBg = role === 'farmer' ? 'bg-[#4C6B36]' : 'bg-[#2563EB]';

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group relative px-2">
      <div className="relative p-2.5 transition-all duration-500">
        <AnimatePresence>
          {active && (
            <motion.div 
              layoutId="nav-active-pill"
              className={`absolute inset-0 ${roleBg} rounded-2xl shadow-xl z-0`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </AnimatePresence>
        <div className={`relative z-10 transition-colors duration-300 ${active ? 'text-white' : 'text-gray-300'}`}>
          {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
        </div>
      </div>
      <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 z-10 ${active ? 'text-[#1D1D1D] opacity-100' : 'text-gray-400 opacity-60 group-hover:opacity-100'}`}>
        {label}
      </span>
    </button>
  );
}

function EmptyState({ icon, text }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-gray-300"
    >
      <div className="mb-6 p-8 bg-[#FDFCF8] rounded-full border-4 border-dashed border-[#F0F7EB] relative scale-150 transform-gpu">
        <div className="opacity-40">{React.cloneElement(icon, { size: 48, strokeWidth: 1 })}</div>
      </div>
      <p className="font-heading italic text-2xl text-[#2D3E21] opacity-40 mt-8 mb-2">Nothing here yet</p>
      <p className="font-serif italic text-sm text-gray-400 max-w-[200px] text-center">{text}</p>
    </motion.div>
  );
}

function NewItemForm({ t, onSubmit }: any) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [qty, setQty] = useState('');

  return (
    <div className="bg-white p-8 rounded-[40px] border border-[#E2F0D9] shadow-xl space-y-8 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#F0F7EB] rounded-full blur-3xl opacity-50" />
      
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="aspect-square bg-[#F9FBFA] rounded-3xl flex flex-col items-center justify-center border-dashed border-2 bi-[#E2F0D9] text-gray-400 hover:bg-[#F0F7EB] hover:border-[#4C6B36] transition-all cursor-pointer group relative overflow-hidden"
      >
        <Camera className="w-12 h-12 mb-3 group-hover:scale-110 group-hover:text-[#4C6B36] transition-all duration-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-[#4C6B36]">{t.upload_photo}</span>
        <div className="absolute inset-0 bg-[#4C6B36]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#4C6B36] uppercase tracking-[0.2em] ml-2 opacity-60">{t.item_name}</label>
          <input 
            placeholder="e.g. Basmati Rice"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full p-5 rounded-2xl bg-[#F9FBFA] border-2 border-transparent focus:border-[#4C6B36] focus:bg-white outline-none transition-all font-heading italic text-xl" 
          />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-[#4C6B36] uppercase tracking-[0.2em] ml-2 opacity-60">{t.cost_per_kg}</label>
            <div className="relative">
              <input 
                type="number" 
                value={cost} 
                onChange={(e) => setCost(e.target.value)} 
                className="w-full p-5 pr-14 rounded-2xl bg-[#F9FBFA] border-2 border-transparent focus:border-[#4C6B36] focus:bg-white outline-none transition-all font-black text-xl text-[#4C6B36]" 
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-serif italic text-gray-400">/kg</span>
            </div>
          </div>
          <div className="space-y-2 relative">
            <label className="text-[10px] font-black text-[#4C6B36] uppercase tracking-[0.2em] ml-2 opacity-60">{t.max_quantity}</label>
            <div className="relative">
              <input 
                type="number" 
                value={qty} 
                onChange={(e) => setQty(e.target.value)} 
                className="w-full p-5 pr-12 rounded-2xl bg-[#F9FBFA] border-2 border-transparent focus:border-[#4C6B36] focus:bg-white outline-none transition-all font-black text-xl text-[#4C6B36]" 
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-serif italic text-gray-400">kg</span>
            </div>
          </div>
        </div>
      </div>
      
      <motion.button 
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (!name || !cost || !qty) {
            alert("Please fill all fields");
            return;
          }
          onSubmit({ name, costPerKg: Number(cost), maxQuantity: Number(qty) });
        }} 
        className="w-full py-5 bg-[#4C6B36] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#4C6B36]/20 active:scale-95 transition-all border-b-4 border-black/20"
      >
        {t.submit}
      </motion.button>
    </div>
  );
}

function HostDashboard({ t, logins, loginSessions, onLogout }: any) {
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.error(e);
    }
  };

  const seedData = async () => {
    if (!confirm("Add sample products?")) return;
    try {
      const batch = writeBatch(db);
      const demoFarmerId = 'demo_farmer_id';
      const samples = [
        { name: 'Basmati Rice', cost: 65, qty: 500, state: 'Punjab', region: 'Amritsar' },
        { name: 'Organic Turmeric', cost: 120, qty: 100, state: 'Maharashtra', region: 'Sangli' },
        { name: 'Alfonso Mangoes', cost: 150, qty: 200, state: 'Maharashtra', region: 'Ratnagiri' }
      ];
      samples.forEach(s => {
        const id = Math.random().toString(36).substr(2, 9);
        batch.set(doc(db, 'products', id), {
          id,
          name: s.name,
          costPerKg: s.cost,
          maxQuantity: s.qty,
          farmerId: demoFarmerId,
          farmerName: 'Sample Farmer',
          farmerMobile: '9876543210',
          state: s.state,
          region: s.region,
          createdAt: Date.now()
        });
      });
      await batch.commit();
      alert("Sample data added!");
    } catch (e) {
      alert("Seeding failed (Rules restricted). Enable Firebase Auth first.");
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Delete all login activity history?")) return;
    try {
      const q = query(collection(db, 'login_sessions'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      alert("Activity history cleared!");
    } catch (e) {
      console.error(e);
      alert("Failed to clear logs (Permission denied - Check Security Rules)");
    }
  };

  const handleClearUsers = async () => {
    if (!confirm("Delete all registered users? (Excludes Admin)")) return;
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      let count = 0;
      snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.email !== 'admin@khetnet.com' && data.role !== 'host') {
          batch.delete(d.ref);
          count++;
        }
      });
      await batch.commit();
      alert(`${count} users removed!`);
    } catch (e) {
      console.error(e);
      alert("Failed to clear users.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 min-h-screen bg-[#F9FBFA]">
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-3xl shadow-sm border border-[#E2F0D9]">
        <div className="flex items-center gap-3">
          <div className="bg-[#4C6B36] p-2 rounded-xl">
            <KhetNetLogo className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold">{t.host_center}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={seedData} className="px-4 py-2 bg-[#F0F7EB] text-[#4C6B36] font-bold text-sm rounded-xl border border-[#4C6B36]/20">
            Seed Data
          </button>
          <button onClick={onLogout} className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-[#E2F0D9]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-[#4C6B36]" /> {t.activity_history || "Login History"}
            </h2>
            <button 
              onClick={handleClearLogs}
              className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear History
            </button>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {loginSessions.length === 0 ? (
              <p className="text-gray-400 italic">No login events recorded yet.</p>
            ) : (
              loginSessions.map((session, idx) => (
                <div key={session.id || idx} className="flex items-center justify-between p-4 bg-[#FDFCF8] rounded-2xl border border-[#F0F7EB]">
                  <div>
                    <p className="font-bold text-[#1D1D1D]">{session.userName}</p>
                    <p className="text-xs text-gray-500">{session.userEmail}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded uppercase font-bold text-gray-400">{session.device}</span>
                       <span className="text-[10px] text-gray-400">{new Date(session.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                     <p className="text-[9px] text-gray-300 max-w-[200px] truncate">{session.userAgent}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-[#4C6B36]" /> {t.recent_logins} ({logins.length})
          </h2>
          <button 
            onClick={handleClearUsers}
            className="text-[10px] font-black uppercase tracking-widest text-[#4C6B36] hover:underline"
          >
            Wipe All Users
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {logins.map((login, i) => (
            <div key={`login-${login.id}-${i}`} className="bg-white p-5 rounded-3xl border border-[#E2F0D9] shadow-sm flex flex-col gap-2 relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{login.name}</h3>
                    <p className="text-xs text-gray-400 font-mono select-all">UID: {login.id}</p>
                    <p className="text-xs text-gray-400 font-mono select-all">Email: {login.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      login.role === 'farmer' ? 'bg-[#F0F7EB] text-[#4C6B36]' : 
                      login.role === 'host' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {login.role ? t[login.role] : t.onboarding}
                    </span>
                    <button 
                      onClick={() => handleDeleteUser(login.id)}
                      className="p-1.5 text-red-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-[#F5F9F2]">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase">{t.mobile}</label>
                  <p className="text-sm font-bold">{login.mobile || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase">{t.age}</label>
                  <p className="text-sm font-bold">{login.age}</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-dashed border-[#F5F9F2] flex justify-between items-center text-[10px]">
                <span className="text-gray-400 font-bold uppercase">{t.region}</span>
                <span className="font-bold text-[#4C6B36]">{login.region}, {login.state}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* Brand Assets Section */}
        <div className="mt-12 bg-white p-8 rounded-3xl border border-[#E2F0D9] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#4C6B36] p-2 rounded-xl">
              <PackageCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">KhetNet Brand Assets</h2>
              <p className="text-sm text-gray-400">{t.brand_assets_desc || "Official logo and quality marks"}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-[#4C6B36]">Primary App Logo</h3>
              <div className="bg-[#F9FBFA] p-10 rounded-2xl border border-dashed border-[#E2F0D9] flex flex-col items-center justify-center group relative overflow-hidden">
                <KhetNetLogo className="w-48 h-48 drop-shadow-2xl" />
                <div className="mt-6 text-center">
                  <p className="font-black text-3xl tracking-tighter text-[#4C6B36]">KHETNET</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mt-1">BHARTIYA KISAN KA DIGITAL BAZAAR</p>
                </div>
                
                {/* Download Overlay */}
                <a 
                  href="/logo.svg" 
                  download="KhetNet_Logo.svg"
                  className="absolute inset-0 bg-[#4C6B36]/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer no-underline"
                >
                  <Download className="w-8 h-8 text-white mb-2" />
                  <p className="text-white font-black uppercase tracking-widest text-sm">Download Logo</p>
                  <p className="text-white/60 text-[10px] mt-1">Vector SVG Format</p>
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-[#F5F9F2] rounded-2xl border border-[#E2F0D9]">
                <h4 className="font-bold text-[#4C6B36] uppercase tracking-widest text-xs mb-3">Color Palette</h4>
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#4C6B36] shadow-sm shadow-black/10" title="#4C6B36" />
                  <div className="w-10 h-10 rounded-full bg-[#86AF49] shadow-sm shadow-black/10" title="#86AF49" />
                  <div className="w-10 h-10 rounded-full bg-[#E2F0D9] shadow-sm shadow-black/10" title="#E2F0D9" />
                  <div className="w-10 h-10 rounded-full bg-[#F5F9F2] shadow-sm shadow-black/10" title="#F5F9F2" />
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm shadow-black/10" title="#FFFFFF" />
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-[#E2F0D9] space-y-3">
                <h4 className="font-bold text-[#4C6B36] uppercase tracking-widest text-xs">Login Information (Save this)</h4>
                <div className="bg-[#F9FBFA] p-3 rounded-xl font-mono text-xs space-y-1">
                  <p className="text-black"><span className="text-gray-400">HOST GMAIL:</span> admin@khetnet.com</p>
                  <p className="text-black"><span className="text-gray-400">HOST PASS:</span> admin</p>
                </div>
                <p className="text-[9px] text-gray-400 italic">This login bypasses all onboarding checks and takes you directly to the control center.</p>
              </div>
            </div>
          </div>
        </div>
    </motion.div>
  );
}

function ChatInterface({ t, order, user, messages, onSend, onBack }: any) {
  const [text, setText] = useState('');
  const [translationsMap, setTranslationsMap] = useState<Record<string, string>>({});

  const translateMessage = async (msgId: string, originalText: string, targetLang: Language) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Translate the following agricultural marketplace message to ${targetLang}. 
        Return ONLY the translated text.
        Message: ${originalText}`
      });
      const translated = response.text || originalText;
      setTranslationsMap(prev => ({ ...prev, [msgId]: translated }));
    } catch (e) {
      console.error(e);
    }
  };

  const farmerMobile = order?.farmerMobile;

  useEffect(() => {
    // Auto-translate incoming messages
    messages.forEach((m: ChatMessage) => {
      if (m.senderId !== user.id && !translationsMap[m.id]) {
        translateMessage(m.id, m.text, user.language);
      }
    });
  }, [messages, user.language, translationsMap]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm"><ArrowLeft className="w-6 h-6" /></button>
        <div className="flex-1">
          <h2 className="font-bold">{order?.productName}</h2>
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <UserIcon className="w-3 h-3" /> {user.role === 'farmer' ? order?.wholesalerName : order?.farmerName}
            </p>
            {user.role === 'wholesaler' && (order?.farmerMobile || farmerMobile) && (
              <a href={`tel:${order?.farmerMobile || farmerMobile}`} className="text-[#4C6B36] flex items-center gap-1 text-[10px] font-black underline">
                <Phone className="w-3 h-3" /> {order?.farmerMobile || farmerMobile}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 px-4 py-6 scroll-smooth">
        <AnimatePresence mode="popLayout">
          {messages.map((m: ChatMessage, i: number) => {
            const isSender = m.senderId === user.id;
            const translatedText = translationsMap[m.id];
            
            return (
              <motion.div 
                key={`chat-msg-${m.id}-${i}`}
                initial={{ opacity: 0, x: isSender ? 20 : -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm relative ${isSender ? 'bg-[#4C6B36] text-white rounded-tr-none' : 'bg-white border border-[#E2F0D9] text-[#2D3E21] rounded-tl-none font-medium'}`}>
                  <p className="text-sm leading-relaxed tracking-tight">{translatedText || m.text}</p>
                  {translatedText && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-black/5 opacity-40 text-[9px] font-black uppercase tracking-widest">
                       <Languages className="w-3 h-3" /> Auto-translated
                    </div>
                  )}
                  <div className={`text-[8px] opacity-30 mt-1 font-black uppercase tracking-tighter ${isSender ? 'text-right' : 'text-left'}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-white rounded-[32px] shadow-sm border border-[#E2F0D9] flex flex-col gap-3 mt-4">
        {order?.status === 'received' ? (
          <div className="py-4 px-6 bg-[#E2F0D9] rounded-2xl text-[#4C6B36] font-black text-center text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            <PackageCheck className="w-5 h-5" /> {t.order_received_msg}
          </div>
        ) : (
          <>
            {user.role === 'wholesaler' && order?.status === 'approved' && (
              <button 
                onClick={() => onSend('ORDER_RECEIVED_SIGNAL_INTERNAL', false, true)}
                className="py-3 bg-[#4C6B36] text-white rounded-2xl text-[10px] font-black shadow-lg shadow-[#4C6B36]/10 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                {t.mark_received} <Package className="w-4 h-4" />
              </button>
            )}
            <div className="flex gap-2">
              <input 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && text && (onSend(text), setText(''))}
                placeholder={t.type_message} 
                className="flex-1 bg-[#F5F9F2] border-none rounded-2xl px-5 py-3 outline-none text-sm" 
              />
              <button onClick={() => text && (onSend(text), setText(''))} className="p-3 bg-[#4C6B36] text-white rounded-2xl active:scale-95 transition-all"><Send className="w-5 h-5" /></button>
            </div>
            <button onClick={() => onSend('', true)} className="flex items-center justify-center gap-2 py-3 text-[#4C6B36] font-bold text-[10px] uppercase tracking-widest bg-[#F0F7EB] rounded-2xl active:scale-95 transition-all">
              <MapPin className="w-4 h-4" /> {t.current_location}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
