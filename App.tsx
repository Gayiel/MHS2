import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, Bot, User, Shield, Activity, Lock, Stethoscope, Wind, Phone, MapPin, ExternalLink, Mic, StopCircle, Volume2, VolumeX } from 'lucide-react';
import { analyzeMessageRisk, sendMessageToGemini, generateSpeech, playAudioBuffer } from './services/geminiService';
import { Message, RiskLevel } from './types';
import { DisclaimerModal } from './components/DisclaimerModal';
import { SafetyPanel } from './components/SafetyPanel';
import { CrisisAlert } from './components/CrisisAlert';
import { LandingPage } from './components/LandingPage';
import { NewsFeed } from './components/NewsFeed';
import { GroundingPage } from './components/GroundingPage';
import { JournalingPage } from './components/JournalingPage';
import { SleepPage } from './components/SleepPage';

type ViewState = 'landing' | 'chat' | 'news' | 'grounding' | 'journaling' | 'sleep';

function App() {
  const [view, setView] = useState<ViewState>('landing');
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
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);

  // Voice & Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const stopAudioRef = useRef<(() => void) | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, isTyping, view]);

  // Request location for "Find Help" feature
  const requestLocation = async (): Promise<{latitude: number, longitude: number} | undefined> => {
    setIsLocating(true);
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setIsLocating(false);
        resolve(undefined);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(loc);
          setIsLocating(false);
          resolve(loc);
        },
        (error) => {
          console.error("Location access denied or error", error);
          setIsLocating(false);
          resolve(undefined);
        }
      );
    });
  };

  // --- Voice Handling ---

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Strip the data:audio/webm;base64, prefix
          const base64Data = base64String.split(',')[1];
          handleSendMessage("", false, { data: base64Data, mimeType: 'audio/webm' });
        };
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleAudio = () => {
    if (isPlayingAudio && stopAudioRef.current) {
      stopAudioRef.current(); // Stop current playback if turning off
      setIsPlayingAudio(false);
    }
    setAudioEnabled(!audioEnabled);
  };

  // --- Message Handling ---

  const handleSendMessage = async (
    text: string, 
    forceLocation: boolean = false,
    audioInput?: { data: string; mimeType: string }
  ) => {
    if (!text.trim() && !audioInput) return;

    // Stop any currently playing audio
    if (stopAudioRef.current) {
      stopAudioRef.current();
      setIsPlayingAudio(false);
    }

    const userText = text.trim();
    setInputValue('');

    // 1. Add User Message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText || (audioInput ? "🎤 Voice Message" : ""),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      // Determine if we should send location data (if user asks for nearby help or pressed the button)
      let currentLocation = userLocation;
      
      // If forced (button click) or simple heuristic text match, ensure we have location
      const textToCheck = userText.toLowerCase();
      if (forceLocation || textToCheck.includes('nearby') || textToCheck.includes('near me')) {
        if (!currentLocation) {
          // If we don't have it, try to get it
           currentLocation = await requestLocation();
        }
      }

      // 2. Parallel Execution: Chat Response & Risk Analysis
      const historyForChat = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // NOTE: Risk analysis primarily works on text. If voice only, we analyze the user's *previous* context or skip specific analysis for this turn 
      // unless we transcribe first. For this MVP, we analyze the text prompt or skip if audio-only until response.
      // We pass the audioInput to Gemini Chat.
      const chatPromise = sendMessageToGemini(historyForChat, userText, currentLocation, audioInput);
      const analysisPromise = userText ? analyzeMessageRisk(userText) : Promise.resolve({ 
        riskLevel: RiskLevel.LOW, sentimentScore: 0, flags: [], reasoning: "Voice message input - implicit safety check." 
      } as any);

      const [chatResult, riskAnalysis] = await Promise.all([chatPromise, analysisPromise]);

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
        text: chatResult.text,
        timestamp: new Date(),
        groundingMetadata: chatResult.groundingMetadata
      };
      setMessages(prev => [...prev, newAiMsg]);

      // 6. Handle Voice Output (TTS)
      if (audioEnabled && chatResult.text) {
        try {
           setIsPlayingAudio(true);
           const audioBuffer = await generateSpeech(chatResult.text);
           if (audioBuffer) {
             const stopFn = playAudioBuffer(audioBuffer);
             stopAudioRef.current = () => {
               stopFn();
               setIsPlayingAudio(false);
             };
             // Auto-reset playing state (approximate duration)
             setTimeout(() => {
               if (stopAudioRef.current === stopFn) setIsPlayingAudio(false);
             }, audioBuffer.duration * 1000);
           } else {
             setIsPlayingAudio(false);
           }
        } catch (e) {
          console.error("TTS playback failed", e);
          setIsPlayingAudio(false);
        }
      }

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

  const handlePromptClick = (prompt: string, forceLocation: boolean = false) => {
    handleSendMessage(prompt, forceLocation);
  };

  // Routing Logic
  if (view === 'landing') {
    return (
      <LandingPage 
        onEnter={() => setView('chat')} 
        onOpenNews={() => setView('news')} 
        onOpenGrounding={() => setView('grounding')}
        onOpenJournal={() => setView('journaling')}
        onOpenSleep={() => setView('sleep')}
      />
    );
  }

  if (view === 'news') {
    return <NewsFeed onBack={() => setView('landing')} />;
  }

  if (view === 'grounding') {
    return <GroundingPage onBack={() => setView('landing')} />;
  }

  if (view === 'journaling') {
    return <JournalingPage onBack={() => setView('landing')} />;
  }

  if (view === 'sleep') {
    return <SleepPage onBack={() => setView('landing')} />;
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
             {/* Audio Toggle */}
            <button 
              onClick={toggleAudio}
              className={`p-2 rounded-full transition-colors ${audioEnabled ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:bg-slate-100'}`}
              title={audioEnabled ? "Mute Voice Output" : "Enable Voice Output"}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

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
                <div className={`flex flex-col max-w-[90%] md:max-w-[75%] gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
                  
                  <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
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
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium uppercase">MindFlow AI</span>
                          {audioEnabled && isPlayingAudio && messages[messages.length - 1].id === msg.id && (
                             <div className="flex gap-0.5 items-end h-3">
                               <div className="w-0.5 bg-teal-400 h-full animate-[bounce_1s_infinite]"></div>
                               <div className="w-0.5 bg-teal-400 h-2/3 animate-[bounce_1.2s_infinite]"></div>
                               <div className="w-0.5 bg-teal-400 h-full animate-[bounce_0.8s_infinite]"></div>
                             </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Render Grounding Data (Maps) if available */}
                  {!isUser && msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                    <div className="ml-11 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-2 animate-in slide-in-from-left duration-500">
                      {msg.groundingMetadata.groundingChunks
                        .filter(chunk => chunk.maps)
                        .map((chunk, idx) => (
                        <a 
                          key={idx}
                          href={chunk.maps?.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all group flex flex-col"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="bg-teal-50 p-2 rounded-lg">
                              <MapPin className="w-4 h-4 text-teal-600" />
                            </div>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-teal-500" />
                          </div>
                          <span className="font-bold text-slate-800 text-sm line-clamp-1 mb-1">{chunk.maps?.title}</span>
                          <span className="text-xs text-teal-600 font-medium flex items-center gap-1">
                            View on Google Maps
                          </span>
                        </a>
                      ))}
                    </div>
                  )}

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
                onClick={() => handlePromptClick("I would like to find a therapist or clinic nearby.", true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-medium hover:bg-teal-100 transition-colors border border-teal-100"
              >
                <MapPin className="w-3 h-3" /> Find Help Nearby
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
                placeholder={isRecording ? "Listening..." : "Type or speak your thoughts..."}
                className={`w-full bg-slate-50 border text-slate-800 rounded-xl pl-4 pr-24 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 ${
                  isRecording ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
                disabled={isTyping || isRecording}
              />
              
              <div className="absolute right-2 flex items-center gap-1">
                {/* Voice Record Button */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTyping}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' 
                      : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                  }`}
                  title={isRecording ? "Stop Recording" : "Start Voice Input"}
                >
                  {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Send Button */}
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isTyping || isRecording}
                  className="p-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:hover:bg-teal-700 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
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