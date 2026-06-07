import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, Sparkles, HelpCircle, User, Brain, Volume2, AlertCircle } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

interface AskKhetNetProps {
  t: any;
  user: any;
}

export function AskKhetNet({ t, user }: AskKhetNetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ready suggestions for Indian Farmers
  const suggestions = [
    { text: '🌾 Suggest organic fertilizer for high-yield Basmati Rice', keyword: 'rice' },
    { text: '💸 What is today\'s market trend for onions in Punjab?', keyword: 'onions' },
    { text: '🐛 How can I cure Leaf Blast disease in Wheat crop naturally?', keyword: 'leaf blast' },
    { text: '🚚 Tell me about KhetNet Pro third-party truck freight support', keyword: 'logistics' }
  ];

  // Simulated Voice triggers
  const voiceSimulationTexts = [
    "Sarabjit Singh from Amritsar: How can I spray urea correctly on my wheat crop for premium results?",
    "Explain latest central budget cold storage subsidy schedules available for Punjab farmers",
    "Find certified organic wholesale buyers near Bathinda region matchingbasmati rice",
    "What organic pesticides work best for yellow rust prevention in fields?"
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const finalUserText = textToSend;
    setMessages(prev => [...prev, { role: 'user', text: finalUserText }]);
    setInputVal('');
    setIsSending(true);

    try {
      // Connect to our secure backend proxy endpoint
      const res = await fetch("/api/ask-khetnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', text: finalUserText }],
          userRole: user?.role,
          location: { state: user?.state || "Punjab", region: user?.region || "Amritsar" },
          language: user?.language || "en"
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'bot', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: `An error occurred: ${data.error || 'Server error'}. Please retry.` }]);
      }
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'bot', text: "Excuse me, I faced a connection challenge. Please check your network and try again soon." }]);
    } finally {
      setIsSending(false);
    }
  };

  // Simulated Voice Recognition Sequence
  const triggerVoiceInput = () => {
    setIsListening(true);
    
    // Choose random query string
    const queryIdx = Math.floor(Math.random() * voiceSimulationTexts.length);
    const chosenText = voiceSimulationTexts[queryIdx];

    setTimeout(() => {
      setIsListening(false);
      setInputVal(chosenText);
    }, 4000); // 4 seconds simulated voice recording
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isListening]);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-2xl mx-auto p-4 relative font-sans">
      
      {/* Bot branding header */}
      <div className="flex items-center gap-3.5 bg-white p-4 rounded-2xl border border-[#E2F0D9] shadow-sm mb-4">
        <div className="w-11 h-11 bg-[#4C6B36] rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-heading font-black text-base text-gray-900 leading-none">Ask KhetNet Pro</h3>
            <span className="text-[9px] font-black uppercase bg-[#F0F7EB] text-[#4C6B36] px-2 py-0.5 rounded border border-[#4C6B36]/10">Startup India AI</span>
          </div>
          <p className="text-xs text-gray-400 font-medium">Certified advisor for bilingual agriculture resolutions & market trades.</p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="flex-1 overflow-y-auto space-y-6 flex flex-col justify-center items-center pb-8 pr-1">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-sm space-y-4"
          >
            <div className="w-16 h-16 bg-[#F0F7EB] rounded-full flex items-center justify-center mx-auto border border-[#E2F0D9]">
              <Sparkles className="w-8 h-8 text-[#4C6B36]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-black text-xl text-gray-800">Namaste! I'm your advisor</h4>
              <p className="text-xs text-gray-400 font-medium">Ask crop queries in Punjab, Hindi, Tamil dialects. Click any button below to try instantly:</p>
            </div>
          </motion.div>

          <div className="w-full space-y-2 max-w-md pt-2">
            {suggestions.map((s, idx) => (
              <motion.button
                key={idx}
                onClick={() => handleSend(s.text)}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.08 }}
                className="w-full text-left p-3.5 bg-white hover:bg-[#F0F7EB] rounded-2xl border border-[#E2F0D9] text-xs font-semibold text-gray-700 transition-colors shadow-sm flex items-center justify-between group active:scale-95"
              >
                <span>{s.text}</span>
                <Send className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#4C6B36] group-hover:translate-x-0.5 transition-all" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Feed */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scroll-smooth">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-xs md:text-sm shadow-sm relative leading-relaxed ${isUser ? 'bg-[#4C6B36] text-white rounded-tr-none' : 'bg-white border border-[#E2F0D9] text-gray-800 rounded-tl-none font-medium'}`}>
                  {m.text}
                  <div className="absolute right-3.5 bottom-1.5 flex items-center gap-1 opacity-20">
                    {isUser ? <User className="w-3 h-3 text-white" /> : <Brain className="w-3 h-3 text-[#4C6B36]" />}
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#E2F0D9] p-4 rounded-2xl rounded-tl-none text-xs text-gray-400 flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2.5 h-2.5 bg-[#4C6B36] rounded-full"
                />
                KhetNet AI is formulating agricultural solution...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Voice listening prompt overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#FDFCF8]/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-8 space-y-6 z-10 border border-[#E2F0D9]"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-20 h-20 bg-[#4C6B36]/10 rounded-full border border-[#4C6B36]/30 absolute inset-0"
              />
              <div className="w-20 h-20 bg-[#4C6B36] rounded-full flex items-center justify-center text-white relative z-10 shadow-lg">
                <Mic className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="font-heading font-black text-xl text-gray-800 uppercase tracking-tight">Speak Crop Query Now</h4>
              <p className="text-xs text-amber-600 font-extrabold flex items-center gap-1.5 justify-center">
                <Volume2 className="w-4 h-4 text-amber-500 animate-bounce" /> Listening in local regional language...
              </p>
              <p className="text-[11px] text-gray-400 font-semibold max-w-xs leading-snug italic pt-2">"Explain best low-cost pest control timing for Amritsar organic cotton seeds."</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer input bars */}
      <div className="bg-white p-3 rounded-2xl border border-[#E2F0D9] flex gap-2 items-center shadow-lg">
        <button
          onClick={triggerVoiceInput}
          title="Voice Command with Auto AI"
          className="p-3 bg-[#F0F7EB] hover:bg-[#E2F0D9] text-[#4C6B36] rounded-xl active:scale-95 transition-all text-xs flex items-center gap-1.5 font-bold"
        >
          <Mic className="w-5 h-5" /> 
          <span className="hidden sm:inline">Voice Input</span>
        </button>

        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputVal)}
          placeholder="Ask anything about farming, trades..."
          className="flex-1 bg-[#F5F9F2] text-xs font-semibold px-4 py-3 border-none rounded-xl outline-none focus:ring-1 focus:ring-[#4C6B36]"
        />

        <button
          onClick={() => handleSend(inputVal)}
          className="p-3 bg-[#4C6B36] hover:bg-[#3D562B] text-white rounded-xl active:scale-95 transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
