import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Wind, Play, Pause, Bot } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';

interface GroundingPageProps {
  onBack: () => void;
}

export const GroundingPage: React.FC<GroundingPageProps> = ({ onBack }) => {
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [messages, setMessages] = useState<{role: string, text: string}[]>([
    { role: 'model', text: "I'm here to help you feel grounded. We can start with the 5-4-3-2-1 technique. Look around you. Can you tell me 5 things you see?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Build history correctly
    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const response = await sendMessageToGemini(history, userMsg.text, undefined, undefined, 'grounding');
    
    setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    setIsTyping(false);
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* Left Panel: Visual Breathing Guide */}
      <div className="flex-1 bg-indigo-900 relative overflow-hidden flex flex-col items-center justify-center p-8 text-white">
        <button onClick={onBack} className="absolute top-6 left-6 text-white/70 hover:text-white z-10 flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        {/* Animated Circles Background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white rounded-full animate-[spin_20s_linear_infinite]"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
        </div>

        <div className="relative z-10 text-center">
          <h2 className="text-3xl font-bold mb-2">Visual Breathing</h2>
          <p className="text-indigo-200 mb-8">Box Breathing: Inhale (4s) - Hold (4s) - Exhale (4s) - Hold (4s)</p>

          <div className="relative w-64 h-64 flex items-center justify-center mx-auto mb-12">
            <div className={`absolute inset-0 border-4 border-white/30 rounded-full ${isBreathingActive ? 'scale-100' : 'scale-100'}`}></div>
            {/* Animated Breathing Circle */}
            <div 
              className={`w-full h-full bg-indigo-500/50 rounded-full blur-xl transition-all duration-[4000ms] ease-in-out ${
                isBreathingActive ? 'scale-125 opacity-80' : 'scale-50 opacity-30'
              }`}
              style={{ animation: isBreathingActive ? 'breathe 16s infinite' : 'none' }}
            ></div>
            
            <div className="absolute inset-0 flex items-center justify-center">
               <button 
                 onClick={() => setIsBreathingActive(!isBreathingActive)}
                 className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-indigo-900 hover:scale-110 transition-transform shadow-lg"
               >
                 {isBreathingActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
               </button>
            </div>
          </div>
          
          <style>{`
            @keyframes breathe {
              0%, 100% { transform: scale(0.5); opacity: 0.3; } /* Start Inhale / End Hold */
              25% { transform: scale(1.2); opacity: 0.8; } /* End Inhale / Start Hold */
              50% { transform: scale(1.2); opacity: 0.8; } /* End Hold / Start Exhale */
              75% { transform: scale(0.5); opacity: 0.3; } /* End Exhale / Start Hold */
            }
          `}</style>
        </div>
      </div>

      {/* Right Panel: Grounding Chat */}
      <div className="flex-1 flex flex-col h-full bg-white">
        <div className="p-6 border-b border-slate-100 bg-white">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wind className="w-6 h-6 text-indigo-600" />
            Grounding Assistant
          </h2>
          <p className="text-sm text-slate-500">Guided 5-4-3-2-1 Technique</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                 msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-indigo-600'
              }`}>
                {msg.role === 'user' ? 'You' : <Bot className="w-5 h-5" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm max-w-[80%] leading-relaxed ${
                msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && <div className="text-xs text-slate-400 ml-12">Guide is typing...</div>}
          <div ref={endRef}></div>
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-slate-100">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type here (e.g., 'I see a blue lamp...')"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};