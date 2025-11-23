import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, Bot, User, Shield, Activity, Lock, Stethoscope, Wind, Phone } from 'lucide-react';
import { analyzeMessageRisk, sendMessageToGemini } from './services/geminiService';
import { Message, RiskLevel } from './types';
import { DisclaimerModal } from './components/DisclaimerModal';
import { SafetyPanel } from './components/SafetyPanel';
import { CrisisAlert } from './components/CrisisAlert';
import { LandingPage } from './components/LandingPage';
import { NewsFeed } from './components/NewsFeed';

function App() {
  const [view, setView] = useState<'landing' | 'chat' | 'news'>('landing');
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Welcome to MindFlow Sanctuary. I am your AI support companion. I'm here to provide a confidential, non-judgmental space for you to process your thoughts and feelings. \n\nWhile I work alongside clinical protocols, I am an AI, not a human. How are you feeling right now?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, isTyping, view]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userText = text.trim();
    setInputValue('');

    // 1. Add User Message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      // 2. Parallel Execution: Chat Response & Risk Analysis
      const historyForChat = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const [chatResponse, riskAnalysis] = await Promise.all([
        sendMessageToGemini(historyForChat, userText),
        analyzeMessageRisk(userText)
      ]);

      // 3. Update User Message with Analysis Result
      setMessages(prev => prev.map(msg => 
        msg.id === newUserMsg.id ? { ...msg, assessment: riskAnalysis } : msg
      ));

      // 4. Check for Crisis Trigger
      if (riskAnalysis.riskLevel === RiskLevel.HIGH || riskAnalysis.riskLevel === RiskLevel.CRITICAL) {
        setShowCrisisAlert(true);
      }

      // 5. Add AI Response
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: chatResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newAiMsg]);

    } catch (error) {
      console.error("Interaction error", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I apologize, but I am having trouble connecting to the secure server. Please try again. If this is an emergency, please call 988.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handlePromptClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  // Routing Logic
  if (view === 'landing') {
    return <LandingPage onEnter={() => setView('chat')} onOpenNews={() => setView('news')} />;
  }

  if (view === 'news') {
    return <NewsFeed onBack={() => setView('landing')} />;
  }

  // Chat View
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 relative font-sans animate-in fade-in duration-500">
      {!hasAcceptedDisclaimer && (
        <DisclaimerModal onAccept={() => setHasAcceptedDisclaimer(true)} />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Header */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('landing')}
              className="md:hidden mr-2 text-slate-500"
            >
              ←
            </button>
            <div className="bg-teal-700 p-2 rounded-lg shadow-teal-200/50 shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800 leading-tight">MindFlow Sanctuary</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Professional Support Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
              <div className="flex items-center gap-1.5 text-teal-700">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Licensed Oversight</span>
              </div>
              <div className="w-px h-3 bg-slate-200"></div>
              <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Encrypted Session</span>
              </div>
              <div className="w-px h-3 bg-slate-200"></div>
              <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>HIPAA Compliant</span>
              </div>
            </div>

            <button 
              onClick={() => setShowMobilePanel(!showMobilePanel)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Messages List */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-50/50">
          {showCrisisAlert && <CrisisAlert onDismiss={() => setShowCrisisAlert(false)} />}
          
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`flex max-w-[90%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${
                    isUser ? 'bg-teal-600 text-teal-50' : 'bg-teal-700 text-white'
                  }`}>
                    {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  {/* Bubble */}
                  <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    isUser 
                      ? 'bg-teal-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {!isUser && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-medium uppercase">MindFlow AI</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex justify-start w-full animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white shadow-sm">
                    <Bot className="w-5 h-5" />
                 </div>
                 <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                 </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area with Quick Actions */}
        <footer className="bg-white border-t border-slate-200 p-4 md:p-6 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto relative space-y-3">
            
            {/* Quick Actions (Chips) */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <button 
                onClick={() => handlePromptClick("Can you guide me through a calming breathing exercise?")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors border border-indigo-100"
              >
                <Wind className="w-3 h-3" /> Calming Exercise
              </button>
              <button 
                onClick={() => handlePromptClick("I would like to talk to a human counselor.")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-medium hover:bg-teal-100 transition-colors border border-teal-100"
              >
                <User className="w-3 h-3" /> Human Counselor
              </button>
              <button 
                onClick={() => setShowCrisisAlert(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full text-xs font-medium hover:bg-rose-100 transition-colors border border-rose-100"
              >
                <Phone className="w-3 h-3" /> Crisis Help
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="relative flex items-center gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Take your time... share whatever feels right to you today 💭"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-4 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                disabled={isTyping}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 p-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:hover:bg-teal-700 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            
            <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Messages are encrypted. In emergencies, always call 911 or 988.</span>
            </p>
          </div>
        </footer>
      </div>

      {/* Sidebar Panel (Desktop: Always visible, Mobile: Toggable) */}
      <div className={`
        fixed inset-y-0 right-0 z-20 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:shadow-none shadow-2xl
        ${showMobilePanel ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <SafetyPanel messages={messages} />
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setShowMobilePanel(false)}
          className="lg:hidden absolute top-4 right-4 p-2 bg-slate-100 rounded-full"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Mobile Backdrop */}
      {showMobilePanel && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-10 lg:hidden"
          onClick={() => setShowMobilePanel(false)}
        />
      )}

    </div>
  );
}

export default App;
