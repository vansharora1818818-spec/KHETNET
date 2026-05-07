
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
  AlertCircle
} from 'lucide-react';
import { translations } from './translations';
import { locations } from './locations';
import type { User, Product, Order, ChatMessage, Language } from './types';
import { GoogleGenAI } from "@google/genai";

// Logo Component: Tractor in a Farm
function KhetNetLogo({ className = "w-12 h-12", color = "white" }: { className?: string, color?: string }) {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background Farm/Field */}
        <path d="M10 80 Q 50 70 90 80" stroke={color} strokeWidth="2" strokeOpacity="0.4" />
        <path d="M10 85 Q 50 75 90 85" stroke={color} strokeWidth="2" strokeOpacity="0.3" />
        <path d="M10 90 Q 50 80 90 90" stroke={color} strokeWidth="2" strokeOpacity="0.2" />
        
        {/* Tractor Body */}
        <path d="M35 65 H65 V50 H55 V40 H40 V65Z" fill={color} />
        <path d="M55 40 H75 V50 H65" stroke={color} strokeWidth="3" strokeLinecap="round" />
        
        {/* Wheels */}
        <circle cx="42" cy="70" r="8" fill={color} />
        <circle cx="42" cy="70" r="4" fill="white" fillOpacity="0.3" />
        <circle cx="68" cy="70" r="6" fill={color} />
        <circle cx="68" cy="70" r="3" fill="white" fillOpacity="0.3" />
        
        {/* Exhaust */}
        <path d="M45 40 V30 H48" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M48 30 L52 25" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
      </svg>
    </div>
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

    const [stage, setStage] = useState<'language' | 'location' | 'login' | 'details' | 'category' | 'dashboard' | 'host'>('language');
    const [lang, setLang] = useState<Language>('en');
    const [user, setUser] = useState<Partial<User>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
    const [aiInput, setAiInput] = useState('');

    // Host Data (Mocking a registry of logins)
    const [allLogins, setAllLogins] = useState<User[]>(() => {
      const saved = localStorage.getItem('khetnet_logins');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) { console.error(e); }
      }
      return [
        { id: '1', name: 'Ramesh Kumar', age: 45, email: 'ramesh@farm.com', password: 'pass1', role: 'farmer', state: 'Punjab', region: 'Ludhiana', language: 'hi' },
        { id: '2', name: 'Suresh Singh', age: 38, email: 'suresh@wholesale.com', password: 'pass2', role: 'wholesaler', state: 'Haryana', region: 'Gurugram', language: 'en' },
      ];
    });

  // App Data (Mocking backend state)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('khetnet_products');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('khetnet_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [cart, setCart] = useState<{ productId: string, quantity: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'cart' | 'profile' | 'new_item' | 'orders'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null); // Order ID
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('khetnet_chat');
    return saved ? JSON.parse(saved) : [];
  });

    // Load from persistence on mount
    useEffect(() => {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        try {
          const { user: savedUser, stage: savedStage, lang: savedLang } = JSON.parse(savedSession);
          if (savedUser) setUser(savedUser);
          if (savedStage) setStage(savedStage);
          if (savedLang) setLang(savedLang);
        } catch (e) {
          console.error("Error parsing saved session", e);
        }
      }
    }, []);

    // Save session on changes
    useEffect(() => {
      if (stage !== 'language') {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ user, stage, lang }));
      }
    }, [user, stage, lang]);

    // Save logins on changes
    useEffect(() => {
      if (allLogins.length > 0) {
        localStorage.setItem(LOGINS_KEY, JSON.stringify(allLogins));
      }
    }, [allLogins]);

    // Save products on changes
    useEffect(() => {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    }, [products]);

    // Save orders on changes
    useEffect(() => {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }, [orders]);

    // Save chat on changes
    useEffect(() => {
      localStorage.setItem(CHAT_KEY, JSON.stringify(chatMessages));
    }, [chatMessages]);

  const t = translations[lang];

  const handleLanguageSelect = (l: Language) => {
    setLang(l);
    setStage('location');
  };

  const handleAreaSelect = (state: string, region: string) => {
    setUser(prev => ({ ...prev, state, region, language: lang }));
    setStage('login');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Host Login Check (Absolute priority)
    if (email.trim() === 'devilboy102030405060708090' && password === '1234vansh') {
      const hostUser: User = { 
        id: 'host', 
        name: 'Host Admin', 
        email: email.trim(), 
        password,
        age: 99,
        state: 'N/A',
        region: 'N/A',
        role: null,
        language: lang
      };
      setUser(hostUser);
      setStage('host');
      return;
    }

    // 2. Existing User Check (Skip onboarding if found)
    const existingUser = allLogins.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.password === password);
    if (existingUser) {
      // Preserve current chosen location if they selected it this session, otherwise use stored
      const mergedUser = { 
        ...existingUser, 
        state: user.state || existingUser.state, 
        region: user.region || existingUser.region,
        language: lang 
      };
      setUser(mergedUser);
      if (existingUser.role) {
        setStage('dashboard');
        setActiveTab('home');
      } else {
        setStage('category');
      }
      return;
    }
    
    // 3. New User Flow
    setStage('details');
  };

  const handleGoogleLogin = () => {
    setEmail('user@gmail.com');
    setStage('details');
  };

  const handleDetailsSubmit = (name: string, age: number) => {
    if (age < 18) {
      return; // Handled by button disable but just in case
    }
    
    // Create new user base
    const newUser: User = { 
      id: Math.random().toString(36).substr(2, 9),
      name, 
      age, 
      email: email.trim() || 'user@gmail.com',
      password: password || '123456', 
      state: user.state || 'Punjab',
      region: user.region || 'Ludhiana',
      language: lang,
      role: null
    };

    setUser(newUser);
    // Add to registry early
    setAllLogins(prev => [...prev.filter(u => u.email !== newUser.email), newUser]);
    setStage('category');
  };

  const handleCategorySelect = (role: 'farmer' | 'wholesaler') => {
    // Functional update to ensure we have the latest user from details stage
    setUser(current => {
      if (!current) return current;
      const updatedUser = { ...current, role } as User;
      
      // Update registry with complete user
      setAllLogins(prev => {
        const filtered = prev.filter(u => u.email !== updatedUser.email);
        return [...filtered, updatedUser];
      });

      return updatedUser;
    });

    setStage('dashboard');
    setActiveTab('home');
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setStage('language');
    setLang('en');
    setUser({});
    setEmail('');
    setPassword('');
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
        model: "gemini-3-flash-preview",
        contents: `You are the KhetNet assistant. Help the user with agricultural marketplace issues. 
          User is ${user.role || 'choosing a role'}. 
          Language: ${lang}. 
          User question: ${textToSubmit}`
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
        {stage === 'language' && (
          <motion.div 
            key="language"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-screen space-y-8 p-6"
          >
            <div className="bg-[#4C6B36] p-6 rounded-3xl shadow-xl shadow-[#4C6B36]/20">
              <KhetNetLogo className="w-20 h-20" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#2D3E21]">KhetNet</h1>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              {[
                { id: 'hi', label: 'हिंदी' },
                { id: 'en', label: 'English' },
                { id: 'ta', label: 'தமிழ்' },
                { id: 'te', label: 'తెలుగు' }
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleLanguageSelect(l.id as Language)}
                  className="p-5 rounded-2xl border-2 border-[#E2F0D9] bg-white hover:border-[#4C6B36] hover:bg-[#F0F7EB] transition-all text-xl font-medium shadow-sm active:scale-95"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {stage === 'location' && (
          <AreaSelection t={t} onSelect={handleAreaSelect} onBack={() => setStage('language')} />
        )}

        {stage === 'login' && (
          <LoginScreen 
            t={t} 
            email={email} 
            setEmail={setEmail} 
            password={password} 
            setPassword={setPassword} 
            showPassword={showPassword} 
            setShowPassword={setShowPassword} 
            onSubmit={handleLogin} 
            onGoogle={handleGoogleLogin} 
          />
        )}

        {stage === 'details' && (
          <DetailsScreen t={t} onSubmit={handleDetailsSubmit} />
        )}

        {stage === 'category' && (
          <CategoryScreen t={t} onSelect={handleCategorySelect} />
        )}

        {stage === 'dashboard' && (
          <Dashboard 
            t={t} 
            user={user as User} 
            setUser={setUser}
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            products={products} 
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
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

        {stage === 'host' && (
          <HostDashboard t={t} logins={allLogins} onLogout={logout} />
        )}
      </AnimatePresence>

      {/* AI Bot Icon */}
      <div className="fixed bottom-24 right-6 z-50">
        <button 
          onClick={() => setIsAiOpen(!isAiOpen)}
          className="bg-[#4C6B36] text-white p-4 rounded-full shadow-lg shadow-[#4C6B36]/30 hover:bg-[#3D562B] transition-all transform hover:scale-110 active:scale-95"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

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
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
function AreaSelection({ t, onSelect, onBack }: any) {
  const [selectedState, setSelectedState] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

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
            {Object.keys(locations).map(s => <option key={s} value={s}>{s}</option>)}
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
              {locations[selectedState as keyof typeof locations].map(r => <option key={r} value={r}>{r}</option>)}
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

function LoginScreen({ t, email, setEmail, password, setPassword, showPassword, setShowPassword, onSubmit, onGoogle }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 h-screen flex flex-col justify-center max-w-sm mx-auto w-full"
    >
      <div className="mb-12 flex flex-col items-center">
        <div className="w-24 h-24 bg-[#4C6B36] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#4C6B36]/30 mb-4">
          <KhetNetLogo className="w-16 h-16" />
        </div>
        <h2 className="text-2xl font-black text-[#2D3E21] tracking-tight">{t.welcome_to_khetnet}</h2>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#4C6B36] ml-1">{t.email}</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#4C6B36] transition-colors" />
            <input 
              type="email" 
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-[#E2F0D9] focus:border-[#4C6B36] outline-none transition-all placeholder:text-gray-300 shadow-sm"
              placeholder={t.email_placeholder}
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
          <div className="flex items-center gap-2 mt-2 ml-1 cursor-pointer select-none" onClick={() => setShowPassword(!showPassword)}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showPassword ? 'bg-[#4C6B36] border-[#4C6B36]' : 'border-gray-300'}`}>
              {showPassword && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-gray-500">{t.show_password}</span>
          </div>
        </div>

        <button className="w-full py-5 rounded-2xl bg-[#4C6B36] text-white font-bold text-lg shadow-lg hover:bg-[#3D562B] transition-all active:scale-95 flex items-center justify-center gap-2">
          {t.login}
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E2F0D9]"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#FDFCF8] px-2 text-gray-400 font-medium">{t.or_continue}</span></div>
        </div>

        <button 
          type="button" 
          onClick={onGoogle}
          className="w-full py-4 rounded-2xl border-2 border-[#E2F0D9] bg-white hover:border-[#4C6B36] hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-3 active:scale-95"
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" className="w-6 h-6" alt="Google" />
          {t.login_with_google}
        </button>
      </form>
    </motion.div>
  );
}

function DetailsScreen({ t, onSubmit }: any) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 h-screen flex flex-col justify-center max-w-sm mx-auto w-full">
      <h2 className="text-3xl font-bold text-[#2D3E21] mb-8">{t.personal_info}</h2>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#4C6B36] ml-1">{t.name}</label>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 rounded-2xl border-2 border-[#E2F0D9] focus:border-[#4C6B36] outline-none"
            placeholder={t.name_placeholder}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#4C6B36] ml-1">{t.age}</label>
          <input 
            type="number"
            value={age} 
            onChange={(e) => setAge(e.target.value)}
            className={`w-full p-4 rounded-2xl border-2 outline-none transition-all ${
              age && Number(age) < 18 ? 'border-red-500 bg-red-50' : 'border-[#E2F0D9] focus:border-[#4C6B36]'
            }`}
            placeholder={t.age_placeholder}
          />
          {age && Number(age) < 18 && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" /> {t.age_warning}
            </motion.p>
          )}
        </div>
        <button 
          disabled={!name || !age || Number(age) < 18}
          onClick={() => onSubmit(name, Number(age))}
          className="w-full py-5 rounded-2xl bg-[#4C6B36] text-white font-bold text-lg disabled:opacity-50 transition-all active:scale-95"
        >
          {t.next}
        </button>
      </div>
    </motion.div>
  );
}

function CategoryScreen({ t, onSelect }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-screen flex flex-col justify-center items-center text-center">
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
  t, user, setUser, activeTab, setActiveTab, products, setProducts, orders, setOrders, cart, setCart, 
  searchQuery, setSearchQuery, searchHistory, setSearchHistory, logout, 
  activeChat, setActiveChat, chatMessages, setChatMessages
}: any) {
  
  const filteredProducts = products.filter((p: Product) => 
    p.state === user.state && p.region === user.region &&
    (searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)
  );

  const cartItemsCount = cart.length;

  const addToCart = (productId: string) => {
    setCart((prev: any) => [...prev, { productId, quantity: 1 }]);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev: any) => prev.filter((i: any) => i.productId !== productId));
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev: any) => prev.map((i: any) => 
      i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    ));
  };

  const placeOrder = () => {
    const newOrders = cart.map((item: any) => {
      const product = products.find((p: Product) => p.id === item.productId);
      return {
        id: Math.random().toString(36).substr(2, 9),
        productId: item.productId,
        productName: product?.name || 'Item',
        wholesalerId: user.id || 'w1',
        wholesalerName: user.name || 'Wholesaler',
        farmerId: product?.farmerId || 'f1',
        status: 'pending',
        createdAt: Date.now(),
        totalCost: (product?.costPerKg || 0) * item.quantity,
        quantity: item.quantity
      };
    });
    setOrders([...orders, ...newOrders]);
    setCart([]);
    alert(t.request_sent);
  };

  // Farmer specific logic
  const handleOrderAction = (orderId: string, action: 'approved' | 'declined') => {
    setOrders(orders.map((o: Order) => o.id === orderId ? { ...o, status: action } : o));
  };

  return (
    <div className="pb-24 pt-4 px-4 bg-[#F9FBFA] min-h-screen">
      <header className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#4C6B36] rounded-xl flex items-center justify-center shadow-lg shadow-[#4C6B36]/10">
            <KhetNetLogo className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold leading-tight">{t.hi}, {user.name}</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {user.region}, {user.state}
            </p>
          </div>
        </div>
        <button onClick={logout} className="p-3 bg-white rounded-xl shadow-sm hover:text-red-500 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-xl mx-auto">
        {user.id && !user.mobile && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-[#4C6B36] rounded-2xl shadow-lg shadow-[#4C6B36]/20 flex items-center justify-between text-white"
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
              className="px-4 py-2 bg-white text-[#4C6B36] rounded-xl text-xs font-black uppercase tracking-wider"
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
              messages={chatMessages.filter((m: ChatMessage) => m.orderId === activeChat)}
              onSend={(text: string, isLocation = false) => {
                const msg: ChatMessage = {
                  id: Date.now().toString(),
                  orderId: activeChat,
                  senderId: user.id!,
                  text: isLocation ? t.shared_location : text,
                  timestamp: Date.now(),
                  location: isLocation ? { lat: 0, lng: 0 } : undefined
                };
                setChatMessages([...chatMessages, msg]);
              }}
              onBack={() => setActiveChat(null)} 
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {user.role === 'farmer' ? (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-bold">{t.new_orders}</h2>
                          <span className="text-xs font-bold text-[#4C6B36] bg-[#F0F7EB] px-2 py-1 rounded-full uppercase">{t.farmer_feed}</span>
                        </div>
                        {orders.filter((o: Order) => o.farmerId === user.id && o.status === 'pending').length === 0 ? (
                          <EmptyState icon={<FileText />} text={t.no_new_orders} />
                        ) : (
                          orders.filter((o: Order) => o.farmerId === user.id && o.status === 'pending').map((o: Order) => (
                            <div key={o.id} className="bg-white p-5 rounded-3xl shadow-sm border border-[#E2F0D9] flex flex-col gap-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-lg">{o.productName}</h4>
                                  <p className="text-sm text-gray-500">{o.wholesalerName} • {o.quantity}kg</p>
                                </div>
                                <span className="font-bold text-[#4C6B36]">₹{o.totalCost}</span>
                              </div>
                              <div className="flex gap-3">
                                <button onClick={() => handleOrderAction(o.id, 'approved')} className="flex-1 py-3 bg-[#4C6B36] text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                                  <Check className="w-4 h-4" /> {t.approve}
                                </button>
                                <button onClick={() => handleOrderAction(o.id, 'declined')} className="flex-1 py-3 bg-red-50 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                                  <Ban className="w-4 h-4" /> {t.decline}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-bold">{t.your_items}</h2>
                        </div>
                        {products.filter((p: Product) => p.farmerId === user.id).length === 0 ? (
                          <EmptyState icon={<Package />} text={t.no_products} />
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {products.filter((p: Product) => p.farmerId === user.id).map((p: Product) => (
                              <div key={p.id} className="bg-white p-3 rounded-3xl shadow-sm border border-[#E2F0D9] group">
                                <div className="aspect-square bg-[#F5F9F2] rounded-2xl mb-3 flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={`https://source.unsplash.com/featured/?${p.name},crop,farm`} 
                                    alt={p.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <h4 className="font-bold text-sm">{p.name}</h4>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-gray-400">{p.maxQuantity}kg</span>
                                  <span className="text-sm font-bold text-[#4C6B36]">₹{p.costPerKg}/kg</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">{t.available_buying}</h2>
                        <span className="text-xs font-bold text-[#4C6B36] bg-[#F0F7EB] px-2 py-1 rounded-full uppercase">{t.local_items}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {filteredProducts.length === 0 ? (
                          <div className="col-span-2 py-12 text-center space-y-4">
                            <EmptyState icon={<ShoppingCart />} text={t.no_items_region} />
                            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                              {t.region}: {user.region}, {user.state}
                            </p>
                          </div>
                        ) : (
                          filteredProducts.map((p: Product) => (
                            <div key={p.id} className="bg-white p-3 rounded-3xl shadow-sm border border-[#E2F0D9] group">
                              <div className="aspect-square bg-[#F5F9F2] rounded-2xl mb-3 relative overflow-hidden">
                                <img 
                                  src={p.photo || `https://source.unsplash.com/featured/?${p.name},crop,farm`} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                  alt={p.name} 
                                  referrerPolicy="no-referrer"
                                />
                                <button 
                                  onClick={() => addToCart(p.id)}
                                  className="absolute bottom-2 right-2 p-2 bg-[#4C6B36] text-white rounded-xl shadow-lg transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all active:scale-90"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>
                              <h4 className="font-bold truncate px-1">{p.name}</h4>
                              <p className="text-xs text-gray-400 truncate px-1 mb-2">{p.farmerName}</p>
                              <div className="flex items-center justify-between px-1">
                                <span className="font-bold text-[#4C6B36]">₹{p.costPerKg} /kg</span>
                              </div>
                            </div>
                          ))
                        )}
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
                        {searchHistory.map((s: string) => (
                          <button key={s} onClick={() => setSearchQuery(s)} className="px-4 py-2 bg-white border border-[#E2F0D9] rounded-2xl text-sm font-medium hover:border-[#4C6B36] transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchQuery && (
                    <div className="space-y-4">
                      {filteredProducts.map((p: Product) => (
                         <div key={p.id} className="bg-white p-4 rounded-3xl border border-[#E2F0D9] flex gap-4 items-center">
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
                        {cart.map((item: any) => {
                          const p = products.find(prod => prod.id === item.productId);
                          return (
                            <div key={item.productId} className="bg-white p-4 rounded-3xl border border-[#E2F0D9] flex items-center gap-4">
                              <div className="w-16 h-16 bg-[#F5F9F2] rounded-2xl flex-shrink-0" />
                              <div className="flex-1">
                                <h4 className="font-bold">{p?.name || 'Item'}</h4>
                                <p className="text-sm text-[#4C6B36] font-bold">₹{p?.costPerKg || 0} /kg</p>
                              </div>
                              <div className="flex items-center gap-3 bg-[#F9FBFA] p-1 rounded-2xl">
                                <button onClick={() => updateCartQty(item.productId, -1)} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-[#4C6B36]"><Plus className="w-4 h-4 rotate-45" /></button>
                                <span className="font-bold w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateCartQty(item.productId, 1)} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-[#4C6B36]"><Plus className="w-4 h-4" /></button>
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
                      orders.filter((o: Order) => user.role === 'farmer' ? o.farmerId === user.id : o.wholesalerId === user.id).map((o: Order) => (
                        <div key={o.id} className="bg-white p-5 rounded-3xl border border-[#E2F0D9] relative overflow-hidden group">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-lg">{o.productName}</h4>
                              <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(o.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              o.status === 'approved' ? 'bg-[#E2F0D9] text-[#4C6B36]' : 
                              o.status === 'declined' ? 'bg-red-50 text-red-500' : 
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {t[o.status]}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-[#F5F9F2] pt-4">
                            <span className="font-bold text-[#4C6B36]">₹{o.totalCost}</span>
                            {o.status === 'approved' && (
                              <button onClick={() => setActiveChat(o.id)} className="flex items-center gap-2 text-sm font-bold text-[#4C6B36] hover:underline">
                                <MessageCircle className="w-4 h-4" /> {t.chat}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'new_item' && (
                <motion.div key="new_item" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <h2 className="text-2xl font-bold">{t.new_item}</h2>
                  <NewItemForm t={t} user={user} onSubmit={(productData: any) => {
                    const newProduct: Product = {
                      ...productData,
                      id: Math.random().toString(36).substr(2, 9),
                      farmerId: user.id || 'u1',
                      farmerName: user.name || 'Farmer',
                      state: user.state!,
                      region: user.region!,
                      createdAt: Date.now()
                    };
                    setProducts([...products, newProduct]);
                    setActiveTab('home');
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
                      <span className="font-bold">{user.email}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.mobile}</label>
                      {user.mobile ? (
                        <span className="font-bold">{user.mobile}</span>
                      ) : (
                        <div className="flex gap-2">
                          <input 
                            type="tel" 
                            placeholder={t.mobile_placeholder}
                            className="flex-1 p-3 rounded-xl border border-[#E2F0D9] outline-none focus:border-[#4C6B36] text-sm"
                            onBlur={(e) => {
                              if (e.target.value) {
                                setUser((prev: any) => ({ ...prev, mobile: e.target.value }));
                                alert("Mobile number saved!");
                              }
                            }}
                            onChange={(e) => {
                              // We need a way to update the user in App.tsx
                              // For now, let's just make it a local input that we can ideally persist
                            }}
                          />
                        </div>
                      )}
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
        <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-[#E2F0D9] px-6 py-4 pb-8 flex justify-between items-center rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.02)] z-40">
          {user.role === 'wholesaler' ? (
            <>
              <NavButton icon={<Home className={activeTab === 'home' ? 'text-white' : 'text-gray-400'} />} label={t.home} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
              <NavButton icon={<Search className={activeTab === 'search' ? 'text-white' : 'text-gray-400'} />} label={t.search} active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
              <div className="relative">
                <NavButton icon={<ShoppingCart className={activeTab === 'cart' ? 'text-white' : 'text-gray-400'} />} label={t.cart} active={activeTab === 'cart'} onClick={() => setActiveTab('cart')} />
                {cartItemsCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#4C6B36] text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">{cartItemsCount}</span>}
              </div>
              <NavButton icon={<UserIcon className={activeTab === 'profile' ? 'text-white' : 'text-gray-400'} />} label={t.profile} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            </>
          ) : (
            <>
              <NavButton icon={<Home className={activeTab === 'home' ? 'text-white' : 'text-gray-400'} />} label={t.home} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
              <NavButton icon={<Camera className={activeTab === 'new_item' ? 'text-white' : 'text-gray-400'} />} label={t.new_item} active={activeTab === 'new_item'} onClick={() => setActiveTab('new_item')} />
              <NavButton icon={<FileText className={activeTab === 'orders' ? 'text-white' : 'text-gray-400'} />} label={t.orders} active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
              <NavButton icon={<UserIcon className={activeTab === 'profile' ? 'text-white' : 'text-gray-400'} />} label={t.profile} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            </>
          )}
        </nav>
      )}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group relative">
      <div className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-[#4C6B36] shadow-lg shadow-[#4C6B36]/20' : 'text-gray-300 hover:bg-[#F5F9F2]'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${active ? 'text-[#4C6B36]' : 'text-gray-400 group-hover:text-gray-600'}`}>{label}</span>
    </button>
  );
}

function EmptyState({ icon, text }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-300">
      <div className="mb-4 opacity-20">{icon}</div>
      <p className="font-bold text-sm uppercase tracking-widest">{text}</p>
    </div>
  );
}

function NewItemForm({ t, onSubmit }: any) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [qty, setQty] = useState('');

  return (
    <div className="bg-white p-6 rounded-3xl border border-[#E2F0D9] shadow-sm space-y-6">
      <div className="aspect-square bg-[#F5F9F2] rounded-2xl flex flex-col items-center justify-center border-dashed border-2 border-[#E2F0D9] text-gray-400 hover:bg-[#F0F7EB] transition-colors cursor-pointer group">
        <Camera className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-widest">{t.upload_photo}</span>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-[#4C6B36] uppercase tracking-widest ml-1">{t.item_name}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-[#E2F0D9] focus:border-[#4C6B36] outline-none transition-all" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#4C6B36] uppercase tracking-widest ml-1">{t.cost_per_kg}</label>
            <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-[#E2F0D9] focus:border-[#4C6B36] outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-[#4C6B36] uppercase tracking-widest ml-1">{t.max_quantity}</label>
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-[#E2F0D9] focus:border-[#4C6B36] outline-none transition-all" />
          </div>
        </div>
      </div>
      <button onClick={() => onSubmit({ name, costPerKg: Number(cost), maxQuantity: Number(qty) })} className="w-full py-5 bg-[#4C6B36] text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all">
        {t.submit}
      </button>
    </div>
  );
}

function HostDashboard({ t, logins, onLogout }: { t: any, logins: User[], onLogout: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 min-h-screen bg-[#F9FBFA]">
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-3xl shadow-sm border border-[#E2F0D9]">
        <div className="flex items-center gap-3">
          <div className="bg-[#4C6B36] p-2 rounded-xl">
            <KhetNetLogo className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold">{t.host_center}</h1>
        </div>
        <button onClick={onLogout} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-[#4C6B36]" /> {t.recent_logins} ({logins.length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {logins.map((login) => (
            <div key={login.id} className="bg-white p-5 rounded-3xl border border-[#E2F0D9] shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{login.name}</h3>
                    <p className="text-xs text-gray-400 font-mono select-all">Email: {login.email}</p>
                    <p className="text-xs text-gray-400 font-mono select-all">Pass: {login.password}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    login.role === 'farmer' ? 'bg-[#F0F7EB] text-[#4C6B36]' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {login.role ? t[login.role] : t.onboarding}
                  </span>
                </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-[#F5F9F2]">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase">{t.age}</label>
                  <p className="text-sm font-bold">{login.age}</p>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase">{t.region}</label>
                  <p className="text-sm font-bold truncate">{login.region}, {login.state}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ChatInterface({ t, order, user, messages, onSend, onBack }: any) {
  const [text, setText] = useState('');

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm"><ArrowLeft className="w-6 h-6" /></button>
        <div>
          <h2 className="font-bold">{order?.productName}</h2>
          <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {t.connect_with} {order?.farmerId === user.id ? t.wholesaler : t.farmer}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-2">
        {messages.map((m: ChatMessage) => (
          <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${m.senderId === user.id ? 'bg-[#4C6B36] text-white rounded-tr-none' : 'bg-white border border-[#E2F0D9] text-[#2D3E21] rounded-tl-none'}`}>
              {m.text}
              <div className="text-[8px] opacity-50 mt-1">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white rounded-[32px] shadow-sm border border-[#E2F0D9] flex flex-col gap-3 mt-4">
        <div className="flex gap-2">
          <input 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && text && (onSend(text), setText(''))}
            placeholder={t.type_message} 
            className="flex-1 bg-[#F5F9F2] border-none rounded-2xl px-5 py-3 outline-none" 
          />
          <button onClick={() => text && (onSend(text), setText(''))} className="p-3 bg-[#4C6B36] text-white rounded-2xl active:scale-95 transition-all"><Send className="w-5 h-5" /></button>
        </div>
        <button onClick={() => onSend('', true)} className="flex items-center justify-center gap-2 py-3 text-[#4C6B36] font-bold text-sm bg-[#F0F7EB] rounded-2xl active:scale-95 transition-all">
          <MapPin className="w-4 h-4" /> {t.current_location}
        </button>
      </div>
    </motion.div>
  );
}
