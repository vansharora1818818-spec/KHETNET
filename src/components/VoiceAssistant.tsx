import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  X, 
  Languages, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  FileText, 
  Navigation, 
  Trash2,
  Lock,
  Camera,
  Play,
  Cloud,
  CloudRain,
  Thermometer,
  Droplets,
  Shield,
  Sprout,
  Truck,
  TrendingUp,
  Coins,
  Eye,
  HeartHandshake,
  BookOpen,
  Award
} from 'lucide-react';
import { db } from '../App';
import { collection, addDoc } from 'firebase/firestore';

interface VoiceAssistantProps {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  lang: string;
  setLang: (l: any) => void;
  t: any;
  activeSubTab: string;
  setActiveSubTab: (t: any) => void;
  stage: string;
  setStage: (s: any) => void;

  // New Listing States for Farmers
  newCropName: string;
  setNewCropName: (n: string) => void;
  newCropCost: string;
  setNewCropCost: (c: string) => void;
  newCropQty: string;
  setNewCropQty: (q: string) => void;
  newCropGrade: 'A' | 'B' | 'C';
  setNewCropGrade: (g: 'A' | 'B' | 'C') => void;
  newCropMoisture: number;
  setNewCropMoisture: (m: number) => void;
  newCropHarvestDate: string;
  setNewCropHarvestDate: (d: string) => void;
}

const supportedVoiceLanguages = [
  { code: 'hi-IN', name: 'Hindi', native: 'हिंदी' },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur-IN', name: 'Urdu', native: 'اردو' },
  { code: 'en-IN', name: 'English', native: 'English' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
  { code: 'as-IN', name: 'Assamese', native: 'অসমীয়া' },
  { code: 'or-IN', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'ks-IN', name: 'Kashmiri', native: 'کٲਸ਼ُر' },
  { code: 'doi-IN', name: 'Dogri', native: 'डोगरी' },
  { code: 'mai-IN', name: 'Maithili', native: 'मैथिली' },
  { code: 'ne-IN', name: 'Nepali', native: 'नेपाली' },
  { code: 'sat-IN', name: 'Santali', native: 'संताली' },
  { code: 'kok-IN', name: 'Konkani', native: 'कोंकणी' },
  { code: 'mni-IN', name: 'Manipuri', native: 'मণিপুরী' },
  { code: 'brx-IN', name: 'Bodo', native: 'बोडो' },
  { code: 'sa-IN', name: 'Sanskrit', native: 'संस्कृत' },
  { code: 'sd-IN', name: 'Sindhi', native: 'सिंधी' }
];

export function VoiceAssistant({
  user,
  setUser,
  lang,
  setLang,
  t,
  activeSubTab,
  setActiveSubTab,
  stage,
  setStage,
  newCropName,
  setNewCropName,
  newCropCost,
  setNewCropCost,
  newCropQty,
  setNewCropQty,
  newCropGrade,
  setNewCropGrade,
  newCropMoisture,
  setNewCropMoisture,
  newCropHarvestDate,
  setNewCropHarvestDate
}: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Custom manual natural text input fallback states
  const [customTextQuery, setCustomTextQuery] = useState('');
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);

  // Conversation speech transcription states
  const [transcript, setTranscript] = useState('');
  const [aiSpeechResponse, setAiSpeechResponse] = useState('');
  const [detectedLangName, setDetectedLangName] = useState('Hindi');
  const [listeningState, setListeningState] = useState<'idle' | 'listening' | 'finished'>('idle');

  // Network / Weak internet emulation states
  const [isOnline, setIsOnline] = useState(true);
  const [syncCount, setSyncCount] = useState(0);

  // Security confirmation state
  const [pendingListing, setPendingListing] = useState<any | null>(null);

  // Dynamic Bento Visual Cards state for Low Literacy support
  const [currentVisualCard, setCurrentVisualCard] = useState<'none' | 'weather' | 'schemes' | 'sowing' | 'buyers' | 'advice' | 'orders'>('none');

  // Context Conversation Memory state
  const [conversationalMemory, setConversationalMemory] = useState<any>({
    lastDiscussedCrop: 'Wheat',
    lastDiscussedQuantity: null,
    lastDiscussedPrice: null,
    preferredLanguage: 'Hindi'
  });

  // Native Web Speech Synthesis / Recognition references
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Active Ref Pattern to keep process callback updated without re-running initialization
  const processInputRef = useRef<any>(null);
  useEffect(() => {
    processInputRef.current = processKhetMitraVoiceInput;
  });

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on offline queued items
    const stored = localStorage.getItem('khetmitra_offline_listings');
    if (stored) {
      try {
        const list = JSON.parse(stored);
        setSyncCount(list.length);
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Speech APIs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        
        rec.onstart = () => {
          setIsRecording(true);
          setListeningState('listening');
          setMicrophoneError(null);
        };

        rec.onerror = (e: any) => {
          console.warn("Speech API recognition error", e);
          setIsRecording(false);
          setListeningState('idle');
          if (e.error === 'not-allowed') {
            setMicrophoneError("Microphone permission blocked. Please type your command below, use simulated voices, or test in a full tab!");
          } else {
            setMicrophoneError(`Mic error: ${e.error || "unavailable"}. Please type manually below.`);
          }
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        rec.onresult = (event: any) => {
          const text = event.results[event.results.length - 1][0].transcript;
          setTranscript(text);
          setListeningState('finished');
          if (processInputRef.current) {
            processInputRef.current(text);
          }
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Clean speaking on panel unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Sync Offline Storage tasks
  const handleOfflineSync = async () => {
    const stored = localStorage.getItem('khetmitra_offline_listings');
    if (!stored) return;
    try {
      const list = JSON.parse(stored);
      if (list.length === 0) return;

      setIsProcessing(true);
      for (const item of list) {
        const harvestDocObj = {
          ...item,
          createdAt: Date.now()
        };
        await addDoc(collection(db, 'products'), harvestDocObj);
      }
      
      localStorage.removeItem('khetmitra_offline_listings');
      setSyncCount(0);
      speakResponse("सभी ऑफलाइन सूचियां सफलतापूर्वक केंद्रीय बाजार में सिंक कर दी गई हैं।", "hi-IN");
      alert("Successfully synced offline listings to the marketplace!");
    } catch (e) {
      console.error(e);
      alert("Mandi server synchronization failed. Please check network bandwidth.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Speaks response using HTML5 Web Speech API with robust fallback voice routing
  const speakResponse = (text: string, langCode: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Auto map the code to fallback supported codes
    utterance.lang = langCode || 'hi-IN';
    utterance.rate = 0.95; // Gently slower for farmers to digest perfectly

    // Select suitable regional voice with robust fallback levels
    let voices = synthRef.current.getVoices();
    if (!voices || voices.length === 0) {
      voices = window.speechSynthesis.getVoices();
    }
    const cleanLangCode = (langCode || 'hi-IN').slice(0, 2).toLowerCase();
    
    // Level 1: Find voice matching specific spoken language (e.g., pa-IN, ta-IN)
    let matched = voices.find(v => v.lang.toLowerCase().startsWith(cleanLangCode));
    
    // Level 2: Fallback to general Indian sub-continental locale (Hindi/Indian-English)
    if (!matched && cleanLangCode !== 'en') {
      matched = voices.find(v => v.lang.toLowerCase().includes('-in') || v.lang.toLowerCase().startsWith('hi'));
    }
    
    // Level 3: Fallback to any default synthesis voice
    if (!matched) {
      matched = voices.find(v => v.default || v.lang.toLowerCase().startsWith('en'));
    }

    if (matched) utterance.voice = matched;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    setMicrophoneError(null);

    // Identify current active lang in App model
    const matchedVoiceLang = supportedVoiceLanguages.find(v => v.code.startsWith(lang)) || { code: 'hi-IN' };

    setTranscript('');
    setAiSpeechResponse('');
    
    if (recognitionRef.current) {
      try {
        // Listening configured standard context
        recognitionRef.current.lang = matchedVoiceLang.code;
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech API Busy. Falling back.");
        setMicrophoneError("Speech API is busy or blocked. Please type your query below instead!");
      }
    } else {
      setMicrophoneError("Speech Recognition is not supported in this frame or browser. Please type your query below!");
    }
  };

  // Demo fallback query helper for test/iFrame integration
  const triggerInteractiveSimulatedQuery = () => {
    setIsRecording(true);
    setListeningState('listening');
    setTranscript('Listening for farmer voice...');

    // Simulate different realistic Indian farmer inputs sequentially or randomly
    const queries = [
      { text: "1 किलो गेहूं जोड़ दो", desc: "Hindi: Add 1 Kg Wheat" },
      { text: "ਮੇਰੇ ਲਈ ਮੰਡੀ ਭਾਅ ਦਿਖਾਓ", desc: "Punjabi: Show Mandi prices" },
      { text: "Show today's wheat prices", desc: "English: Show Mandi prices" },
      { text: "500 किलो प्याज बेचनी है", desc: "Hindi: Sell 500Kg Onion" },
      { text: "मेरी फसल में बीमारी है", desc: "Hindi: Disease scanner" },
      { text: "ट्रांसपोर्ट बुक करो", desc: "Hindi: Book logistics" }
    ];

    // Pick dynamic query based on current sub-state or random
    setTimeout(() => {
      setIsRecording(false);
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      setTranscript(randomQuery.text);
      setListeningState('finished');
      processKhetMitraVoiceInput(randomQuery.text);
    }, 2500);
  };

  // Synchronous offline rule parsing fallback
  const runOfflineLocalHeuristics = (queryText: string) => {
    const lower = queryText.toLowerCase().trim();
    let detectedLanguage = "Hindi";
    let detectedLanguageCode = "hi-IN";
    let spokenReply = "";
    let actionType = "NONE";
    let actionTab = null;
    let cropDetails = null;
    let requiresConfirmation = false;

    // Detect Language
    if (lower.includes("ਕਣਕ") || lower.includes("ਪਿਆਜ") || lower.includes("ਮੰਡੀ") || lower.includes("ਵੇਚਣੀ")) {
      detectedLanguage = "Punjabi";
      detectedLanguageCode = "pa-IN";
    } else if (lower.includes("wheat") || lower.includes("price") || lower.includes("show") || lower.includes("transport")) {
      detectedLanguage = "English";
      detectedLanguageCode = "en-IN";
    }

    const isLangReq = lower.includes("select") || lower.includes("चुन") || lower.includes("chuno") || lower.includes("set") || lower.includes("भासा") || lower.includes("भाषा") || lower.includes("ਸੈੱਟ") || lower.includes("ਕਰो") || lower.includes("सिलेक्ट") || lower.includes("ਸਿਲੈਕਟ");
    let fallbackLangId = "";
    if (isLangReq) {
      if (lower.includes("hindi") || lower.includes("हिंदी") || lower.includes("हिन्दी")) fallbackLangId = "hi";
      else if (lower.includes("punjabi") || lower.includes("ਪੰਜਾਬੀ") || lower.includes("पंजाबी")) fallbackLangId = "pa";
      else if (lower.includes("english") || lower.includes("अंग्रेजी")) fallbackLangId = "en";
      else if (lower.includes("tamil") || lower.includes("தமிழ்") || lower.includes("तमिल")) fallbackLangId = "ta";
      else if (lower.includes("telugu") || lower.includes("తెలుగు") || lower.includes("तेलुगु")) fallbackLangId = "te";
    }

    if (fallbackLangId) {
      actionType = "SELECT_LANGUAGE";
      detectedLanguage = fallbackLangId === "hi" ? "Hindi" : (fallbackLangId === "pa" ? "Punjabi" : "English");
      detectedLanguageCode = fallbackLangId === "hi" ? "hi-IN" : (fallbackLangId === "pa" ? "pa-IN" : "en-IN");
      spokenReply = fallbackLangId === "hi" 
        ? "हिंदी भाषा चुन ली गई है। स्थान सेटअप पर चल रहे हैं।" 
        : `Selected language has been set. Forwarding now.`;
    } else if (
      lower.includes("close") || lower.includes("bye") || lower.includes("exit") || 
      lower.includes("band karo") || lower.includes("बन्द") || lower.includes("बंद") || 
      lower.includes("shadd do") || lower.includes("clode") || lower.includes("bnd kr")
    ) {
      actionType = "CLOSE_ASSISTANT";
      spokenReply = "सहायक बंद किया जा रहा है।";
    } else if (lower.includes("बीमारी") || lower.includes("पत्ता") || lower.includes("disease") || lower.includes("bimar") || lower.includes("ਪੱਤਾ")) {
      actionType = "OPEN_CAMERA_DISEASE";
      actionTab = "scanner";
      spokenReply = detectedLanguageCode === "hi-IN" 
        ? "कीट और पत्तों की बीमारी जांचने के लिए कैमरा खोला जा रहा है।" 
        : "ਤੁਹਾਡੀ ਫਸਲ ਦੇ ਪੱਤੇ ਦੀ ਫੋਟੋ ਲੈਣ ਲਈ ਕੈਮਰਾ ਖੋਲ੍ਹਿਆ ਜਾ ਰਿਹਾ ਹੈ।";
    } else if (lower.includes("भाव") || lower.includes("मंडी") || lower.includes("रेट") || lower.includes("prices") || lower.includes("ਮੰਡੀ")) {
      actionType = "SHOW_MANDI";
      actionTab = "prices";
      spokenReply = detectedLanguageCode === "hi-IN"
        ? "मुख्य मंडी कृषि मूल्य प्रविष्टि दिखाई जा रही है।"
        : "ਮੰਡੀ ਦੇ ਤਾਜ਼ਾ ਭਾਅ ਦਾ ਪੰਨਾ ਖੋਲ੍ਹ ਦਿੱਤਾ ਗਿਆ ਹੈ।";
    } else if (lower.includes("यातायात") || lower.includes("गाड़ी") || lower.includes("transport") || lower.includes("ਟਰਾਂਸਪੋਰਟ") || lower.includes("ट्रांसपोर्ट") || lower.includes("ट्रक")) {
      actionType = "BOOK_LOGISTICS";
      actionTab = "logistics";
      spokenReply = detectedLanguageCode === "hi-IN"
        ? "भाड़ा गाड़ी बुकिंग अनुभाग खोला जा रहा है।"
        : "ਢੁਲਾਈ ਗੱਡੀਆਂ ਦੀ ਸੂਚੀ ਦਿਖਾਈ ਜਾ ਰਹੀ ਹੈ।";
    } else if (lower.includes("जोड़") || lower.includes("बेचनी") || lower.includes("sell") || lower.includes("कणक") || lower.includes("प्याज") || lower.includes("गेहूं")) {
      let cropName = "Wheat";
      let quantity = 500;
      let cost = 45;

      if (lower.includes("प्याज") || lower.includes("onion") || lower.includes("ਪਿਆਜ")) {
        cropName = "Onion";
        cost = 25;
      }
      const numMatch = lower.match(/\d+/);
      if (numMatch) {
        quantity = parseInt(numMatch[0]);
      }

      actionType = "PREPARE_LISTING";
      actionTab = "sell_marketplace";
      requiresConfirmation = true;
      cropDetails = { name: cropName, quantity, costPerKg: cost };

      spokenReply = detectedLanguageCode === "hi-IN"
        ? `आप ${quantity} किलो ${cropName === 'Wheat' ? 'गेहूं' : 'प्याज'} को ₹${cost}/किलो के भाव पर लिस्ट करना चाहते हैं। क्या कर दूँ?`
        : `ਤੁਸੀਂ ${quantity} ਕਿਲੋ ${cropName === 'Wheat' ? 'ਕਣਕ' : 'ਪਿਆਜ'} ਨੂੰ ₹${cost} ਦੇ ਭਾਅ 'ਤੇ ਲਿਸਟ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ। ਕੀ ਸੇਵ ਕਰਾਂ?`;
    } else if (lower.includes("हां") || lower.includes("हाँ") || lower.includes("yes") || lower.includes("confirm") || lower.includes("ਹਾਂ")) {
      if (pendingListing) {
        actionType = "CONFIRM_ACTION";
      } else {
        spokenReply = "ठीक है, मैंने स्वीकार कर लिया है।";
      }
    } else {
      spokenReply = "मुझे समझने में कुछ कठिनाई हुई। कृपया फिर से बोलें।";
    }

    return {
      detectedLanguage,
      detectedLanguageCode,
      spokenReply,
      action: {
        type: actionType,
        tab: actionTab,
        cropDetails
      },
      requiresConfirmation
    };
  };

  // Main Orchestration to determine intent
  const processKhetMitraVoiceInput = async (spokenText: string) => {
    if (!spokenText || spokenText.trim().length === 0) return;
    setIsProcessing(true);

    try {
      // Call our robust server endpoint
      const response = await fetch('/api/khetmitra-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: spokenText,
          userContext: user,
          previousContext: conversationalMemory,
          pendingAction: pendingListing
        })
      });

      if (!response.ok) {
        throw new Error("Weak internet backend bypass");
      }

      const result = await response.json();
      
      // Update detected states
      setDetectedLangName(result.detectedLanguage);
      setAiSpeechResponse(result.spokenReply);
      
      // Auto identification language setting across all 23 supported Indian languages
      if (result.detectedLanguageCode) {
        const matchingLocale = result.detectedLanguageCode.split('-')[0];
        const isSupported = supportedVoiceLanguages.some(v => v.code.startsWith(matchingLocale));
        if (isSupported) {
          // Update global app locale language state
          setLang(matchingLocale);
        }
      }

      // Context conversation memory updates
      if (result.contextMemory) {
        setConversationalMemory(result.contextMemory);
      }

      // Action routing
      executeKhetMitraIntentAction(result);

    } catch (err) {
      console.warn("KhetMitra running off client storage heuristics:", err);
      // Fallback engine
      const fallback = runOfflineLocalHeuristics(spokenText);
      setDetectedLangName(fallback.detectedLanguage);
      setAiSpeechResponse(fallback.spokenReply);
      executeKhetMitraIntentAction(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action Executor
  const executeKhetMitraIntentAction = async (result: any) => {
    const { action, requiresConfirmation, spokenReply, detectedLanguageCode } = result;
    if (!action) return;

    const currentCode = detectedLanguageCode || 'hi-IN';

    // Text to Speech output
    speakResponse(spokenReply, currentCode);

    // Default: Reset card display on new voice commands unless it's a specific visual action CARD
    const visualActions = [
      'WEATHER_FORECAST', 
      'GOVERNMENT_SCHEMES', 
      'FERTILIZER_PESTICIDE_RECOMMENDATION', 
      'FIND_BUYERS', 
      'SELLING_TIME_ADVICE', 
      'TRACK_ORDERS'
    ];
    if (visualActions.includes(action.type)) {
      setIsOpen(true);
    } else if (action.type !== 'CONFIRM_ACTION' && action.type !== 'CANCEL_ACTION') {
      setCurrentVisualCard('none');
    }

    // Set visual state indicators
    if (action.type === 'WEATHER_FORECAST') {
      setCurrentVisualCard('weather');
    } else if (action.type === 'GOVERNMENT_SCHEMES') {
      setCurrentVisualCard('schemes');
    } else if (action.type === 'FERTILIZER_PESTICIDE_RECOMMENDATION') {
      setCurrentVisualCard('sowing');
    } else if (action.type === 'FIND_BUYERS') {
      setCurrentVisualCard('buyers');
    } else if (action.type === 'SELLING_TIME_ADVICE') {
      setCurrentVisualCard('advice');
    } else if (action.type === 'TRACK_ORDERS') {
      setCurrentVisualCard('orders');
    }

    // 1. Navigation Tab
    if (action.tab) {
      if (stage !== 'dashboard') {
        setStage('dashboard');
      }
      setActiveSubTab(action.tab);
    }

    // 2. Prepare Listing
    if (action.type === 'PREPARE_LISTING' && action.cropDetails) {
      const details = action.cropDetails;
      setNewCropName(details.name);
      setNewCropCost(details.costPerKg.toString());
      setNewCropQty(details.quantity.toString());
      setNewCropGrade('A');
      setNewCropMoisture(12);

      // Save pending state for Security Confirmation before push
      setPendingListing({
        cropDetails: details,
        requiresConfirmation: true
      });
      // Ensure panel stays open for security prompt
      setIsOpen(true);
    } 
    
    // 3. Confirm Listing action
    else if (action.type === 'CONFIRM_ACTION') {
      if (pendingListing && pendingListing.cropDetails) {
        await executePendingListingPublish();
      } else {
        const dummyReply = "No pending harvest order waiting to confirm / कोई लंबित लिस्टिंग पुष्टि की प्रतीक्षा नहीं कर रही है।";
        speakResponse(dummyReply, currentCode);
        setAiSpeechResponse(dummyReply);
      }
    }

    // 4. Cancel action
    else if (action.type === 'CANCEL_ACTION') {
      setPendingListing(null);
      setNewCropName('');
      setNewCropCost('');
      setNewCropQty('');
      setCurrentVisualCard('none');
      const cancelReply = "प्रक्रिया रद्द कर दी गई है।";
      speakResponse(cancelReply, currentCode);
      setAiSpeechResponse(cancelReply);
    }

    // 5. Open Disease scanner camera
    else if (action.type === 'OPEN_CAMERA_DISEASE') {
      if (stage !== 'dashboard') setStage('dashboard');
      setActiveSubTab('scanner');
    }

    // 6. Select Language and Forward to User Journey
    else if (action.type === 'SELECT_LANGUAGE' && action.language) {
      setLang(action.language);
      localStorage.setItem('khetnet_lang', action.language);
      
      // Auto move forward from selection stage
      if (stage === 'language') {
        setTimeout(() => {
          setStage('location');
        }, 1500); 
      }
    }

    // 7. Close voice assistant console drawer
    else if (action.type === 'CLOSE_ASSISTANT') {
      setTimeout(() => {
        if (synthRef.current) {
          synthRef.current.cancel();
          setIsSpeaking(false);
        }
        setIsOpen(false);
      }, 2000);
    }

    // 8. Custom Edit Action for Quantity updates
    else if (action.type === 'EDIT_LISTING') {
      if (pendingListing && pendingListing.cropDetails) {
        let updatedDetails = { ...pendingListing.cropDetails };
        const amountMatch = spokenReply.match(/\d+/);
        if (amountMatch) {
          updatedDetails.quantity = parseInt(amountMatch[0]);
          setNewCropQty(updatedDetails.quantity.toString());
        }
        setPendingListing({
          ...pendingListing,
          cropDetails: updatedDetails
        });
      }
    }

    // 9. Custom Delete Active Harvest Listings
    else if (action.type === 'DELETE_LISTING') {
      setNewCropName('');
      setNewCropCost('');
      setNewCropQty('');
      setPendingListing(null);
    }
  };

  // Securely finalize publish listing
  const executePendingListingPublish = async () => {
    if (!pendingListing || !pendingListing.cropDetails) return;
    setIsProcessing(true);

    const details = pendingListing.cropDetails;

    const harvestDocObj = {
      name: details.name,
      costPerKg: parseFloat(details.costPerKg || 45),
      maxQuantity: parseFloat(details.quantity || 100),
      grade: 'A',
      moisturePercent: 12,
      harvestDate: newCropHarvestDate || new Date().toISOString().split('T')[0],
      isVerified: user.isVerified || false,
      trustScore: user.trustScore || 85,
      farmerId: user.id || 'anonymous_farmer',
      farmerName: user.name || 'Listed Farmer',
      farmerMobile: user.mobile || '9988776655',
      state: user.state || 'Punjab',
      region: user.region || 'Amritsar',
      createdAt: Date.now()
    };

    if (isOnline) {
      try {
        await addDoc(collection(db, 'products'), harvestDocObj);
        const confirmSpeech = `${harvestDocObj.maxQuantity} किलो ${harvestDocObj.name} की लिस्टिंग सफलतापूर्वक प्रकाशित की जा चुकी है!`;
        speakResponse(confirmSpeech, lang === 'pa' ? 'pa-IN' : 'hi-IN');
        setAiSpeechResponse(confirmSpeech);
      } catch (err) {
        console.error("Firestore offline queue trigger:", err);
        queueOfflineListing(harvestDocObj);
      }
    } else {
      // Offline queue logic
      queueOfflineListing(harvestDocObj);
    }

    // Clear state inputs
    setNewCropName('');
    setNewCropCost('');
    setNewCropQty('');
    setPendingListing(null);
    setIsProcessing(false);
  };

  // Queue offline listing and sync later
  const queueOfflineListing = (docObj: any) => {
    const stored = localStorage.getItem('khetmitra_offline_listings');
    let list = [];
    if (stored) {
      try {
        list = JSON.parse(stored);
      } catch (err) {
        list = [];
      }
    }
    list.push(docObj);
    localStorage.setItem('khetmitra_offline_listings', JSON.stringify(list));
    setSyncCount(list.length);

    const offlineSpeech = "मंडी नेटवर्क कमजोर है। आपकी फसल जानकारी को फोन में सुरक्षित कर लिया गया है। वापस ऑनलाइन आने पर यह अपने आप मंडी में सिंक हो जाएगा।";
    speakResponse(offlineSpeech, 'hi-IN');
    setAiSpeechResponse(`ऑफलाइन सुरक्षित (Queue): ${docObj.maxQuantity}kg ${docObj.name}`);
    alert("Weak Mandi Connection. Crop listing saved locally. Sync later once internet is active.");
  };

  return (
    <div id="khetmitra-ai-agent-container" className="fixed bottom-24 right-6 z-50">
      <AnimatePresence>
        
        {/* Expanded UI Console Drawer optimized for farmers (Low-Literacy mode) */}
        {isOpen && (
          <motion.div
            key="khetmitra-panel"
            initial={{ scale: 0.85, opacity: 0, y: 70 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 70 }}
            className="w-80 sm:w-96 bg-white border-2 border-[#4C6B36]/30 rounded-[35px] shadow-2xl p-6 mb-4 space-y-4 text-center overflow-hidden relative"
          >
            {/* Top status utility */}
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4C6B36] animate-pulse"></span>
                <span className="text-[10px] font-black uppercase text-[#4C6B36] tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-[#4C6B36] text-white" /> KHETMITRA AI
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Connection visualizer */}
                {isOnline ? (
                  <span className="text-[8px] uppercase font-black text-[#4C6B36] flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> ONLINE
                  </span>
                ) : (
                  <span className="text-[8px] uppercase font-black text-rose-600 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> WEAK NET
                  </span>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Language Banner info */}
            <div className="flex justify-between items-center bg-gray-50/50 p-2.5 rounded-2xl text-[10px] font-bold text-gray-500">
              <span className="flex items-center gap-1 text-gray-600">
                <Languages className="w-3.5 h-3.5 text-[#4C6B36]" /> Speaking Dialect:
              </span>
              <span className="text-[#4C6B36] font-black">{detectedLangName}</span>
            </div>

            {/* Microphone permission alert */}
            {microphoneError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-2xl text-[10px] text-left leading-relaxed flex items-start gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p>{microphoneError}</p>
                </div>
              </div>
            )}

            {/* Offline sync banner if queues exist */}
            {syncCount > 0 && (
              <div className="bg-amber-50/55 border-2 border-amber-200 p-3 rounded-2xl text-left flex justify-between items-center">
                <div>
                  <h5 className="text-[10px] font-black uppercase text-amber-800 tracking-wide">Offline Post Journal</h5>
                  <p className="text-[9px] text-gray-500 mt-0.5">{syncCount} listings waiting to sync.</p>
                </div>
                <button
                  onClick={handleOfflineSync}
                  className="py-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                >
                  <RefreshCw className="w-3 h-3" /> Sync Now
                </button>
              </div>
            )}

            {/* Voice Transcription panel */}
            <div className="p-4 bg-gray-50/70 border border-gray-100 rounded-3xl text-left space-y-3 min-h-[110px] flex flex-col justify-between">
              <div>
                <span className="text-[8px] uppercase font-bold text-[#4C6B36]/60 tracking-wider">Farmer Spoke (You)</span>
                {transcript ? (
                  <p className="text-sm font-extrabold text-gray-900 leading-snug mt-1 italic">"{transcript}"</p>
                ) : (
                  <p className="text-xs font-semibold text-gray-400 mt-1 italic">Your speech will convert to text automatically...</p>
                )}
              </div>

              {aiSpeechResponse && (
                <div className="border-t border-gray-100 pt-2">
                  <span className="text-[8px] uppercase font-black text-[#4C6B36] tracking-wider flex items-center gap-0.5">
                    🤖 KhetMitra:
                  </span>
                  <p className="text-xs font-bold text-gray-800 leading-relaxed mt-0.5 italic">
                    {aiSpeechResponse}
                  </p>
                </div>
              )}
            </div>

            {/* LOW-LITERACY MODE INTEGRATED BENTO VISUAL CARDS CARD */}
            {currentVisualCard !== 'none' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                tabIndex={0}
                className="p-4 rounded-3xl text-left space-y-3 border-2 shadow-sm overflow-hidden bg-gradient-to-br from-white to-gray-50/50"
                style={{
                  borderColor:
                    currentVisualCard === 'weather' ? '#60A5FA' :
                    currentVisualCard === 'schemes' ? '#84CC16' :
                    currentVisualCard === 'sowing' ? '#F59E0B' :
                    currentVisualCard === 'buyers' ? '#4C6B36' :
                    currentVisualCard === 'advice' ? '#8B5CF6' : '#14B8A6'
                }}
              >
                {/* 1. WEATHER BENTO BLOCK */}
                {currentVisualCard === 'weather' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                        <CloudRain className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-800 tracking-wide">आज का मौसम (Amritsar Weather)</h4>
                        <p className="text-[10px] text-gray-500 font-bold">Rain expected. 🌦️</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <Thermometer className="w-4 h-4 mx-auto text-blue-500" />
                        <span className="block text-xs font-black text-gray-800 mt-1">32°C</span>
                        <span className="block text-[8px] text-gray-400 uppercase font-bold">Temp</span>
                      </div>
                      <div className="p-2 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <Cloud className="w-4 h-4 mx-auto text-blue-500" />
                        <span className="block text-xs font-black text-gray-800 mt-1">80%</span>
                        <span className="block text-[8px] text-gray-400 uppercase font-bold">Rain</span>
                      </div>
                      <div className="p-2 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <Droplets className="w-4 h-4 mx-auto text-blue-500" />
                        <span className="block text-xs font-black text-gray-800 mt-1">75%</span>
                        <span className="block text-[8px] text-gray-400 uppercase font-bold">Humid</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-2.5 rounded-2xl text-[10px] font-bold text-blue-800 space-y-0.5 border border-blue-100/50">
                      <span className="font-extrabold uppercase tracking-wide block">💡 ADVISORY / मौसम सलाह:</span>
                      <span>भारी बारिश को देखते हुए कीटनाशी छिड़काव टालने की सलाह दी जाती है।</span>
                    </div>
                  </div>
                )}

                {/* 2. GOVERNMENT SCHEMES & SUBSIDIES BENTO BLOCK */}
                {currentVisualCard === 'schemes' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-lime-100 rounded-full text-lime-600">
                        <Shield className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-800 tracking-wide">सरकारी योजनाएं (Govt Schemes)</h4>
                        <p className="text-[10px] text-gray-500 font-bold">Subsidies & Benefits for you</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="p-2.5 bg-lime-50/45 rounded-2xl border border-lime-100 flex items-start gap-2">
                        <Award className="w-4 h-4 text-lime-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-[11px] font-black text-lime-900">PM Fasal Bima Yojana (PMFBY)</span>
                          <span className="block text-[9px] text-gray-600 font-bold">1.5% premium subsidy for rabi crop yield shield insurance.</span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-lime-50/45 rounded-2xl border border-lime-100 flex items-start gap-2">
                        <Coins className="w-4 h-4 text-lime-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-[11px] font-black text-lime-900">PM-KISAN Samman Nidhi</span>
                          <span className="block text-[9px] text-gray-600 font-bold">₹6000 annual direct cash transfer in 3 installments.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. FERTILIZER & PESTICIDE SOWING ADVICE */}
                {currentVisualCard === 'sowing' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-100 rounded-full text-amber-600 animate-pulse">
                        <Sprout className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-800 tracking-wide">खाद एवं छिड़काव (Crop Treatment)</h4>
                        <p className="text-[10px] text-gray-500 font-bold">Soil nutritional & Spray advisor</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="p-2.5 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-between">
                        <div>
                          <span className="block text-[11px] font-black text-gray-800">NPK Fertilizer (12:32:16)</span>
                          <span className="block text-[9px] text-gray-500 font-bold">Recommended dosage for robust stem growth</span>
                        </div>
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded-full shrink-0">50 Kg/acre</span>
                      </div>
                      <div className="p-2.5 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-between">
                        <div>
                          <span className="block text-[11px] font-black text-gray-800">Organic Neem Spray</span>
                          <span className="block text-[9px] text-gray-500 font-bold">Early insect/aphid leaf protection treatment</span>
                        </div>
                        <span className="bg-green-100 text-green-900 text-[10px] font-black px-2.5 py-1 rounded-full shrink-0">Bio Sprit</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. ACTIVE BUYERS & TRADERS MATCHES */}
                {currentVisualCard === 'buyers' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-800 tracking-wide">मंडी खरीददार (Matching Buyers)</h4>
                        <p className="text-[10px] text-gray-500 font-bold">3 Certified Traders found nearby</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 dynamic-buyers">
                      <div className="p-2 bg-green-50/60 rounded-xl flex justify-between items-center text-[10px] font-bold text-gray-700">
                        <span>Amritsar Agro Foods Ltd</span>
                        <span className="bg-[#4C6B36] text-white px-2 py-0.5 rounded-full font-black">₹2280/ क्विंटल</span>
                      </div>
                      <div className="p-2 bg-green-50/60 rounded-xl flex justify-between items-center text-[10px] font-bold text-gray-700">
                        <span>Jagjit Singh Wheat Traders</span>
                        <span className="bg-[#4C6B36] text-white px-2 py-0.5 rounded-full font-black">₹2265/ क्विंटल</span>
                      </div>
                      <div className="p-2 bg-green-50/60 rounded-xl flex justify-between items-center text-[10px] font-bold text-gray-700">
                        <span>Ludhiana Grain Exchange Co</span>
                        <span className="bg-gray-400 text-white px-2 py-0.5 rounded-full font-black">₹2250/ क्विंटल</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. FUTURE SELLING TIME ADVICE */}
                {currentVisualCard === 'advice' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                        <TrendingUp className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-800 tracking-wide">बाजार भविष्यवाणी (Sell/Sow Advisor)</h4>
                        <p className="text-[10px] text-gray-500 font-bold">Central exchange future trend prediction</p>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-center space-y-1.5">
                      <span className="block text-xs uppercase font-black tracking-wider text-purple-900">Recommended Action: HOLD SELLING 🌾</span>
                      <span className="block text-[10px] font-extrabold text-[#4C6B36]">Gain of +₹120/ क्विंटल projected over the next 15 days due to festival demands. Sell by end of June.</span>
                    </div>
                  </div>
                )}

                {/* 6. TRANSACTIONS LEDGER AND ESCROW TRACKING */}
                {currentVisualCard === 'orders' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-teal-100 rounded-full text-teal-600">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-800 tracking-wide">सुरक्षित पेमेंट एवं आर्डर (Escrow Ledger)</h4>
                        <p className="text-[10px] text-gray-500 font-bold">Dynamic Cargo & Escrow Tracking</p>
                      </div>
                    </div>
                    <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black text-teal-900">
                        <span>Escrow Vault ID:</span>
                        <span className="font-mono bg-teal-100 px-1.5 py-0.5 rounded">KN-487DE</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black text-teal-900">
                        <span>Safe Protection status:</span>
                        <span className="text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">✓ SECURED Fenced</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Manual Text Query Bar Fallback */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (customTextQuery.trim()) {
                  setTranscript(customTextQuery);
                  setMicrophoneError(null);
                  processKhetMitraVoiceInput(customTextQuery);
                  setCustomTextQuery('');
                }
              }} 
              className="flex gap-1.5 border border-gray-100 p-1 bg-gray-50 rounded-2xl"
            >
              <input
                type="text"
                value={customTextQuery}
                onChange={(e) => setCustomTextQuery(e.target.value)}
                placeholder="Type here (e.g. 500 किलो प्याज बेचनी है...)"
                className="flex-1 py-1.5 px-3 bg-white border border-gray-200 outline-none focus:outline-none focus:border-[#4C6B36]/50 rounded-xl text-xs font-bold text-gray-800"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="py-1.5 px-3 bg-[#4C6B36] hover:bg-[#3D562B] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 disabled:bg-gray-300"
              >
                Send
              </button>
            </form>

            {/* SECURITY CONFIRMATION OVERLAY MODULE */}
            <AnimatePresence>
              {pendingListing && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-amber-50/70 border-2 border-amber-500 p-4 rounded-3xl text-left space-y-3 relative overflow-hidden"
                >
                  <div className="absolute right-3 top-3 bg-amber-100 text-amber-800 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> SECURITY SHIELD
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Verify Listing Choice</h4>
                    <p className="text-xs font-extrabold text-[#4C6B36] mt-1.5">
                      Do you want to post {pendingListing.cropDetails.quantity} Kg {pendingListing.cropDetails.name} for ₹{pendingListing.cropDetails.costPerKg}/Kg?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={executePendingListingPublish}
                      className="py-3 bg-[#4C6B36] hover:bg-[#3D562B] text-white text-[11px] font-black tracking-wider uppercase rounded-xl transition-colors shadow-md flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> List Now
                    </button>
                    <button
                      onClick={() => {
                        setPendingListing(null);
                        setNewCropName('');
                        setNewCropCost('');
                        setNewCropQty('');
                        speakResponse("प्रक्रिया रद्द कर दी गई है।", 'hi-IN');
                      }}
                      className="py-3 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black tracking-wider uppercase rounded-xl transition-colors shadow-md flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Micro Test simulations panel (low literacy support inside sandboxed iframe) */}
            <div className="space-y-1.5 text-left border-t border-gray-100 pt-3">
              <span className="text-[8px] text-gray-500 uppercase font-black tracking-wider">Tap simulated voices for iframe:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setTranscript("1 किलो गेहूं जोड़ दो");
                    processKhetMitraVoiceInput("1 किलो गेहूं जोड़ दो");
                  }}
                  className="py-1.5 px-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-bold text-gray-700 flex items-center gap-1 border border-gray-100 transition-all text-left"
                >
                  <Play className="w-2.5 h-2.5 text-[#4C6B36]" /> "गेहूं जोड़ दो" (Hindi)
                </button>
                <button
                  onClick={() => {
                    setTranscript("ਪਿਆਜ਼ ਵੇਚਣਾ ਹੈ");
                    processKhetMitraVoiceInput("ਪਿਆਜ਼ ਵੇਚਣਾ ਹੈ 500 ਕਿਲੋ");
                  }}
                  className="py-1.5 px-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-bold text-gray-700 flex items-center gap-1 border border-gray-100 transition-all text-left"
                >
                  <Play className="w-2.5 h-2.5 text-[#4C6B36]" /> "प्याज बेचना है" (Punjabi)
                </button>
                <button
                  onClick={() => {
                    setTranscript("mandi prices dikhao");
                    processKhetMitraVoiceInput("आज का मंडी का भाव दिखाओ");
                  }}
                  className="py-1.5 px-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-bold text-gray-700 flex items-center gap-1 border border-gray-100 transition-all text-left"
                >
                  <Play className="w-2.5 h-2.5 text-[#4C6B36]" /> "मंडी भाव दिखाओ"
                </button>
                <button
                  onClick={() => {
                    setTranscript("फसल में बीमारी है");
                    processKhetMitraVoiceInput("मेरी फसल में बीमारी है");
                  }}
                  className="py-1.5 px-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-bold text-gray-700 flex items-center gap-1 border border-gray-100 transition-all text-left"
                >
                  <Play className="w-2.5 h-2.5 text-[#4C6B36]" /> "फसल बीमारी जांच"
                </button>
              </div>
            </div>

            {/* Mic Center controls */}
            <div className="flex flex-col items-center py-2 space-y-2">
              <div className="relative">
                {isRecording && (
                  <span className="absolute -inset-2.5 bg-red-400/20 border border-red-500/25 rounded-full animate-ping block"></span>
                )}
                {isSpeaking && (
                  <span className="absolute -inset-2 bg-emerald-400/20 border border-emerald-500/25 rounded-full animate-pulse block"></span>
                )}
                <button
                  onClick={isRecording ? () => {
                    if (recognitionRef.current) recognitionRef.current.stop();
                    setIsRecording(false);
                    setListeningState('finished');
                  } : startListening}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white active:scale-95 transition-all text-white ${isRecording ? 'bg-rose-500 hover:bg-rose-600 animate-pulse' : 'bg-[#4C6B36] hover:bg-[#3D562B]'}`}
                >
                  {isRecording ? (
                    <MicOff className="w-6 h-6 animate-pulse" />
                  ) : (
                    <Mic className="w-6 h-6 fill-white text-[#4C6B36]" />
                  )}
                </button>
              </div>
              <h4 className="text-xs font-black text-gray-950 font-heading">
                {isRecording ? 'Listening Dynamic Voice...' : (isSpeaking ? 'Speaking Response...' : 'Tap Mic to Speak')}
              </h4>
            </div>

            {/* Readout sound mute toggles */}
            {aiSpeechResponse && (
              <div className="flex justify-center border-t border-gray-100 pt-3">
                {isSpeaking ? (
                  <button
                    onClick={() => {
                      if (synthRef.current) {
                        synthRef.current.cancel();
                        setIsSpeaking(false);
                      }
                    }}
                    className="py-1.5 px-3 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-xl flex items-center gap-1 border border-rose-100"
                  >
                    <VolumeX className="w-3.5 h-3.5" /> Stop Sound
                  </button>
                ) : (
                  <button
                    onClick={() => speakResponse(aiSpeechResponse, lang === 'pa' ? 'pa-IN' : 'hi-IN')}
                    className="py-1.5 px-3 bg-emerald-50 text-[#4C6B36] text-[10px] font-bold rounded-xl flex items-center gap-1 border border-emerald-100"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Hear Again
                  </button>
                )}
              </div>
            )}

            {/* Always visible Close console option at the very bottom */}
            <div className="flex flex-col items-center border-t border-gray-100 pt-3">
              <button
                onClick={() => {
                  if (synthRef.current) {
                    synthRef.current.cancel();
                    setIsSpeaking(false);
                  }
                  setIsOpen(false);
                }}
                className="w-full py-2 bg-gray-50 hover:bg-rose-50/60 text-gray-500 hover:text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border border-gray-100 hover:border-rose-100"
              >
                <X className="w-3.5 h-3.5" /> Close Assistant / बंद करें
              </button>
            </div>
          </motion.div>
        )}

        {/* Large Floating persistent circular microphone button in the bottom-right corner */}
        {(!isOpen || isRecording) && (
          <motion.div
            key="launcher-container"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-55 flex flex-col items-end pointer-events-none"
          >
            {/* Listening tooltip visualizer */}
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500 text-white text-[10px] px-3 py-1 bg-opacity-95 shadow-xl font-bold uppercase tracking-widest rounded-xl mb-3 pointer-events-auto border-2 border-white flex items-center gap-1.5 animate-bounce-short"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
                Listening Dialects...
              </motion.div>
            )}

            {/* Glowing active ring circles */}
            <div className="relative pointer-events-auto">
              {isRecording && (
                <>
                  <span className="absolute -inset-4 bg-red-500/20 rounded-full animate-ping"></span>
                  <span className="absolute -inset-2 bg-red-400/30 rounded-full animate-pulse border border-red-500/30"></span>
                </>
              )}
              {isSpeaking && (
                <>
                  <span className="absolute -inset-4 bg-yellow-400/20 rounded-full animate-ping"></span>
                  <span className="absolute -inset-2 bg-yellow-400/30 rounded-full animate-pulse border border-yellow-500/30"></span>
                </>
              )}
              <motion.button
                onClick={() => {
                  setIsOpen(true);
                  if (!isRecording) startListening();
                }}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-all active:scale-95 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#4C6B36] text-white hover:bg-[#3D562B]'}`}
                title="KhetMitra Agri Intelligent Voice Assistant"
              >
                <Mic className="w-7 h-7 fill-white text-emerald-50" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
