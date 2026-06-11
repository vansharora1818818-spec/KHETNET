import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  PieChart as PieIcon, 
  FileText, 
  Calendar, 
  AlertCircle,
  HelpCircle,
  Coins,
  Receipt,
  Download,
  DollarSign
} from 'lucide-react';
import { db } from '../App';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Cell, 
  Pie
} from 'recharts';

interface KhataEntry {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: number;
}

interface KhetKhataProps {
  user: any;
  t: any;
}

const EXPENSE_CATEGORIES = [
  { id: 'fertilizer', label: 'Fertilizer / खाद', color: '#EF4444' },
  { id: 'seeds', label: 'Seeds / बीज', color: '#F59E0B' },
  { id: 'pesticides', label: 'Pesticides / कीटनाशक', color: '#10B981' },
  { id: 'diesel', label: 'Diesel & Fuel / डीज़ल', color: '#3B82F6' },
  { id: 'labor', label: 'Labor Hire / मजदूरी', color: '#8B5CF6' },
  { id: 'machinery', label: 'Equipment rent / किराया', color: '#EC4899' },
  { id: 'transport', label: 'Freight Transport / ढुलाई', color: '#6B7280' },
  { id: 'other_exp', label: 'Other Expense / अन्य खर्चे', color: '#9CA3AF' }
];

const INCOME_CATEGORIES = [
  { id: 'crop_sale', label: 'Crop Wholesale / फसल बिक्री', color: '#10B981' },
  { id: 'subsidy', label: 'Govt Subsidy / सरकारी सब्सिडी', color: '#059669' },
  { id: 'custom_renting', label: 'Machinery Rental / किराया कमाई', color: '#34D399' },
  { id: 'other_inc', label: 'Other Income / अन्य आय', color: '#6EE7B7' }
];

const COLORS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280', '#F43F5E'];

export default function KhetKhata({ user, t }: KhetKhataProps) {
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('fertilizer');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('Analyzing your logs...');

  // Set default category when type flips
  useEffect(() => {
    if (type === 'expense') {
      setCategory('fertilizer');
    } else {
      setCategory('crop_sale');
    }
  }, [type]);

  // Bind real-time snapshot
  useEffect(() => {
    if (!user || !user.id) return;

    setLoading(true);
    const q = query(
      collection(db, 'khata_entries'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: KhataEntry[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: d.userId,
          type: d.type,
          category: d.category,
          amount: d.amount,
          description: d.description,
          date: d.date,
          createdAt: d.createdAt
        });
      });
      setEntries(items);
      setLoading(false);
    }, (err) => {
      console.warn("Khata snapshot load fallback (offline support activated):", err);
      // Fallback local persistence if offline
      const stored = localStorage.getItem(`khetnet_khata_${user.id}`);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.id]);

  // Offline caching sync
  useEffect(() => {
    if (entries.length > 0 && user?.id) {
      localStorage.setItem(`khetnet_khata_${user.id}`, JSON.stringify(entries));
      calculateAiBudgetAdvice(entries);
    }
  }, [entries, user?.id]);

  const calculateAiBudgetAdvice = (currentEntries: KhataEntry[]) => {
    const totalExp = currentEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const totalInc = currentEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalInc - totalExp;

    if (currentEntries.length === 0) {
      setAiAdvice("Welcome to Khet Khata! Start logging your seed, labor, fuel, and crop sales to receive live AI cost audits.");
      return;
    }

    const fertilizerCosts = currentEntries.filter(e => e.category === 'fertilizer').reduce((sum, e) => sum + e.amount, 0);
    const seedCosts = currentEntries.filter(e => e.category === 'seeds').reduce((sum, e) => sum + e.amount, 0);

    let tip = "";
    if (netProfit < 0) {
      tip = "Your seasonal expenses are currently exceeding crop revenues. Advice: Check government subsidies under PMFBY & PM-KISAN. You can save up to 40% on fertilizer imports through custom cooperative banks.";
    } else if (fertilizerCosts > totalExp * 0.35) {
      tip = "Fertilizer expenses are highly dominant (above 35%). Soil recommendation: Use organic compost treatment or neem cake mixing. This will safely lower NPK fertilizer load by 25% next season.";
    } else if (totalInc > 50000 && totalExp < totalInc * 0.4) {
      tip = "Excellent capital efficiency! Your profit margin is solid at 60%+. Reinvestment tip: Upgrade your basmati certifications to unlock direct premium exports to NRI wholesale hubs.";
    } else {
      tip = "Budget healthy. Recommendation: Log machinery rental activities in Income blocks to optimize tractor downtime returns.";
    }
    setAiAdvice(tip);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) {
      setErrorCode("Please declare a valid numeric value.");
      return;
    }

    const value = parseFloat(amount);
    if (value <= 0) {
      setErrorCode("Amount must exceed zero.");
      return;
    }

    const selectedCatObj = (type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).find(c => c.id === category);

    const docObj = {
      userId: user.id,
      type,
      category: selectedCatObj?.label || category,
      amount: value,
      description: description || selectedCatObj?.label || 'General entry',
      date: date || new Date().toISOString().split('T')[0],
      createdAt: Date.now()
    };

    try {
      setErrorCode(null);
      await addDoc(collection(db, 'khata_entries'), docObj);
      setAmount('');
      setDescription('');
      setIsAdding(false);
    } catch (err: any) {
      console.warn("Saving offline to fallback:", err);
      // Local sync append
      const fallbackEntry: KhataEntry = {
        id: 'temp_' + Date.now(),
        ...docObj
      };
      setEntries(prev => [fallbackEntry, ...prev]);
      setAmount('');
      setDescription('');
      setIsAdding(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (id.startsWith('temp_')) {
      setEntries(prev => prev.filter(e => e.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'khata_entries', id));
    } catch (err) {
      console.error(err);
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  // Calculations
  const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const netEarnings = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? ((netEarnings / totalIncome) * 100).toFixed(1) : '0.0';

  // Format Recharts visual series data
  const categorySplitDataMap: Record<string, number> = {};
  entries.filter(e => e.type === 'expense').forEach(entry => {
    categorySplitDataMap[entry.category] = (categorySplitDataMap[entry.category] || 0) + entry.amount;
  });

  const expenseBreakdownChartData = Object.keys(categorySplitDataMap).map(key => ({
    name: key.split(' / ')[0], // simple label
    value: categorySplitDataMap[key]
  }));

  // General Income vs Expense visual bar
  const ledgerTrendChartData = [
    {
      name: 'Farm Totals',
      'Income (आय)': totalIncome,
      'Expenses (खर्च)': totalExpense
    }
  ];

  const triggerExportStatement = () => {
    // Generate simple text-based CSV download
    let csvContent = "data:text/csv;charset=utf-8,Date,Type,Category,Description,Amount (Rs)\n";
    entries.forEach(e => {
      csvContent += `${e.date},${e.type.toUpperCase()},${e.category.replace(/,/g, '')},${(e.description || '').replace(/,/g, '')},${e.amount}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `khetnet_ledger_${user.name || 'farmer'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-xl mx-auto px-6 space-y-6">
      {/* Title */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs text-[#4C6B36] font-black uppercase tracking-widest">Khet Khata Ledger</p>
          <h1 className="text-3xl font-heading font-black text-gray-950 tracking-tight leading-none italic">Farm Accounting</h1>
          <p className="text-xs text-gray-400 font-medium">Verify your seasonal input margins, expenses and sell profits.</p>
        </div>
        <button
          onClick={triggerExportStatement}
          className="p-3 bg-white text-[#4C6B36] border border-[#E2F0D9] rounded-2xl hover:bg-[#F0F7EB] transition-all flex items-center gap-1 text-xs font-bold shadow-sm"
          title="Export CSV Statement"
        >
          <Download className="w-4.5 h-4.5" />
          <span>Statement</span>
        </button>
      </div>

      {/* Ledger Cards Block */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#FAFDF6] border border-[#E2F0D9] p-4 rounded-3xl text-left shadow-sm">
          <p className="text-[9px] text-[#4C6B36] font-extrabold uppercase tracking-wider">Total Income</p>
          <h4 className="text-lg font-black text-emerald-600 mt-1">₹{totalIncome.toLocaleString('en-IN')}</h4>
          <span className="text-[8px] text-gray-400 mt-0.5 block font-bold uppercase tracking-widest flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3 text-emerald-500 inline" /> Earned
          </span>
        </div>

        <div className="bg-red-50/50 border border-red-100 p-4 rounded-3xl text-left shadow-sm">
          <p className="text-[9px] text-red-600 font-extrabold uppercase tracking-wider">Total Expense</p>
          <h4 className="text-lg font-black text-red-600 mt-1">₹{totalExpense.toLocaleString('en-IN')}</h4>
          <span className="text-[8px] text-gray-400 mt-0.5 block font-bold uppercase tracking-widest flex items-center gap-0.5">
            <ArrowDownRight className="w-3 h-3 text-red-500 inline" /> Invested
          </span>
        </div>

        <div className={`${netEarnings >= 0 ? 'bg-emerald-50/20 border-emerald-100' : 'bg-rose-50/20 border-rose-100'} border p-4 rounded-3xl text-left shadow-sm`}>
          <p className={`text-[9px] ${netEarnings >= 0 ? 'text-[#4C6B36]' : 'text-rose-600'} font-extrabold uppercase tracking-wider`}>Net Balance</p>
          <h4 className={`text-lg font-black ${netEarnings >= 0 ? 'text-emerald-700' : 'text-rose-700'} mt-1`}>
            {netEarnings >= 0 ? `₹${netEarnings.toLocaleString('en-IN')}` : `-₹${Math.abs(netEarnings).toLocaleString('en-IN')}`}
          </h4>
          <span className="text-[8px] text-gray-400 mt-0.5 block font-extrabold uppercase tracking-widest">
            {netEarnings >= 0 ? `${profitMargin}% Margin` : 'Net deficit'}
          </span>
        </div>
      </div>

      {/* AI Budget Consultant Board */}
      <div className="bg-gradient-to-r from-[#FAFDF6] to-white border-2 border-[#E2F0D9] p-5.5 rounded-3xl shadow-sm text-left relative overflow-hidden">
        <div className="absolute right-4 top-4 text-emerald-100">
          <TrendingUp className="w-12 h-12" />
        </div>
        <div className="relative z-10 flex items-start gap-3">
          <div className="p-2.5 bg-[#4C6B36] text-white rounded-2xl shrink-0 shadow-md">
            <Coins className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase text-[#4C6B36] tracking-widest">KhetNet AI Cost Auditor</h4>
            <p className="text-xs text-gray-800 leading-relaxed font-semibold">{aiAdvice}</p>
          </div>
        </div>
      </div>

      {/* Recharts Analytics Panel */}
      {entries.length > 0 && (
        <div className="bg-white border border-[#E2F0D9] p-5.5 rounded-3xl text-center space-y-6 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-950 uppercase tracking-widest text-left">Farm Financial Analyses</h3>
            <span className="text-[9px] bg-emerald-100 text-[#4C6B36] px-2 py-0.5 rounded font-black uppercase">Live Logs Charts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Visual 1: Balanced Bar graph */}
            <div className="h-44 w-full">
              <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-2">Income vs Expense Ledger</p>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={ledgerTrendChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="Income (आय)" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Expenses (खर्च)" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Visual 2: Expense slice map */}
            <div className="h-44 w-full flex flex-col items-center">
              <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-2">Cost Distribution Shares</p>
              {expenseBreakdownChartData.length > 0 ? (
                <div className="w-full h-[90%] flex items-center justify-center">
                  <div className="w-2/3 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                        <Pie
                          data={expenseBreakdownChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={45}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {expenseBreakdownChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend guide */}
                  <div className="w-1/3 flex flex-col justify-center items-start gap-1 text-[8px] font-bold text-gray-500 overflow-hidden">
                    {expenseBreakdownChartData.slice(0, 4).map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5 w-full truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate">{entry.name}: ₹{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-400 font-bold">
                  No active expenses to chart.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Entry Toggle & Composer Form */}
      <div className="bg-white border border-[#E2F0D9] p-5 rounded-[30px] shadow-sm text-left space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-gray-950 uppercase tracking-widest">Compose New Ledger Log</h3>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-1.5 bg-[#4C6B36] text-white rounded-full text-xs font-extrabold uppercase tracking-wider hover:bg-[#3D562B] transition-colors flex items-center gap-1"
          >
            {isAdding ? 'Close composer' : <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Log Entry</span>}
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddEntry}
              className="space-y-4 overflow-hidden pt-2"
            >
              {errorCode && (
                <div className="p-3 bg-red-50 text-red-650 text-xs font-extrabold rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorCode}</span>
                </div>
              )}

              {/* Expense/Income switcher */}
              <div className="grid grid-cols-2 gap-2 bg-[#F5F9F2] p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-[#4C6B36] text-white shadow-sm' : 'text-[#4C6B36] hover:bg-white/40'}`}
                >
                  Expense / खर्चा 💸
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-white/40'}`}
                >
                  Income / कमाई 💰
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold text-gray-400 block ml-1">Log Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl py-3 px-3 outline-none text-xs font-bold"
                  >
                    {type === 'expense' 
                      ? EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
                      : INCOME_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
                    }
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold text-gray-400 block ml-1">Sum (Rupees ₹)</label>
                  <input
                    required
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 12000"
                    className="w-full bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl py-2.5 px-3 outline-none text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold text-gray-400 block ml-1">Date</label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl py-2.5 px-3 outline-none text-xs font-bold"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-extrabold text-gray-400 block ml-1">Memo description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Urea bags bulk purchase"
                    className="w-full bg-[#FAFDF6] border border-[#E2F0D9] rounded-xl py-2.5 px-3 outline-none text-xs font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-colors ${type === 'expense' ? 'bg-[#4C6B36] hover:bg-[#3D562B]' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                Log Entry onto ledger
              </button>

            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Ledger History List */}
      <div className="bg-white border border-[#E2F0D9] p-5 rounded-[30px] shadow-sm text-left space-y-4">
        <h3 className="text-sm font-black text-gray-950 uppercase tracking-widest">Active Book Ledger History</h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400 font-extrabold animate-pulse">
            Pulling ledger accounts...
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-[#E2F0D9] rounded-2xl text-center text-xs text-gray-400 font-extrabold space-y-1.5">
            <Receipt className="w-8 h-8 text-[#4C6B36]/30 mx-auto" />
            <p className="uppercase tracking-wider">Your balance sheet is empty</p>
            <p className="text-[10px] font-medium text-gray-300">Tap 'Log Entry' at the top to compile budgets.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {entries.map(entry => (
              <div 
                key={entry.id}
                className="flex justify-between items-center p-3.5 bg-[#FAFDF6] hover:bg-[#F3F8ED] border border-[#E2F0D9] rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3 w-[70%]">
                  <div className={`p-2 rounded-xl shrink-0 ${entry.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {entry.type === 'income' ? <Coins className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                  </div>
                  <div className="truncate space-y-0.5">
                    <h5 className="text-xs font-black text-gray-950 truncate leading-none">{entry.description}</h5>
                    <p className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 leading-none">
                      {entry.category} • {entry.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end w-[30%]">
                  <span className={`text-xs font-black ${entry.type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {entry.type === 'income' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-white transition-all"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
