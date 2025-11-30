import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, Bot, User, Shield, Activity, Lock, Stethoscope, Wind, Phone, MapPin, ExternalLink, Mic, StopCircle, Volume2, VolumeX, Moon, Sun, Settings, ArrowLeft, Brain, Heart, Coffee, X, ShieldCheck, Database, ServerOff, AlertCircle, Globe } from 'lucide-react';
import { analyzeMessageRisk, sendMessageToGemini, generateSpeech, playAudioBuffer } from './services/geminiService';
import { Message, RiskLevel, Persona } from './types';
import { DisclaimerModal } from './components/DisclaimerModal';
import { PersonaPanel } from './components/SafetyPanel'; // Repurposed component
import { CrisisAlert } from './components/CrisisAlert';
import { LandingPage } from './components/LandingPage';
import { NewsFeed } from './components/NewsFeed';
import { GroundingPage } from './components/GroundingPage';
import { JournalingPage } from './components/JournalingPage';
import { SleepPage } from './components/SleepPage';
import { AssessmentModal } from './components/AssessmentModal';
import { SettingsModal } from './components/SettingsModal';

type ViewState = 'landing' | 'chat' | 'news' | 'grounding' | 'journaling' | 'sleep';

// Define Personas with Generated Avatar URLs
const PERSONAS: Persona[] = [
  {
    id: 'atlas',
    name: 'Dr. Atlas',
    role: 'Clinical Support Specialist',
    description: 'Structured and solution-focused. Helps with problem-solving and navigating services.',
    themeColor: 'teal',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Felix&backgroundColor=e0f2fe',
    systemInstruction: `You are Dr. Atlas, a Clinical Support Specialist.
    Your GOAL: Provide clear guidance, CBT-based insights, and connect users to local care.

    PROTOCOL:
    1. **SERVICE NAVIGATION PRIORITY (HIGH)**:
       - If the user mentions "doctor", "therapist", "insurance", or "appointment", **SKIP EMPATHY STATEMENTS** and go straight to logistics.
       - **IMMEDIATE ACTION**: Ask: "To find the best provider, I need your **Zip Code/City** and **Insurance Plan**."
       - **USE MAPS**: Once you have location, use the Maps tool to find verified clinics.
       - **DO NOT** assume they are in crisis if they are angry about the system. Help them fix the problem.

    2. **SOLVE & SUPPORT**:
       - Help the user break down their problem into manageable steps.
       - **CHUNKING RULE**: Do NOT overwhelm the user with long lists. Present **ONE step at a time**.

    3. **BRIDGE**:
       - Only when appropriate, suggest a tool. "To organize these thoughts, the Journal might help."
    `
  },
  {
    id: 'maya',
    name: 'Maya',
    role: 'Compassionate Companion',
    description: 'Warm and listening. She sits with you in the difficult moments before suggesting a path forward.',
    themeColor: 'amber',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Mila&backgroundColor=fef3c7',
    systemInstruction: `You are Maya, a Compassionate Companion.
    Your GOAL: Provide emotional validation and comfort.

    PROTOCOL:
    1. **LISTEN & VALIDATE**: Make them feel heard immediately.
    2. **CHECK NAVIGATION NEEDS**:
       - If they mention "nobody helps me" or "I can't find help", **SHIFT MODE**.
       - Ask: "That sounds so isolating. Let's solve this practical part together. Do you have a specific zip code where we should look for a doctor?"
    3. **SUGGEST RESOURCE**: "Writing this down can really help release the weight. Shall we go to the Reflective Journal?"
    4. **CONTENT RULE**: Keep responses short and conversational. No long lectures.
    `
  },
  {
    id: 'kai',
    name: 'Kai',
    role: 'Holistic Guide',
    description: 'Calm and grounding. He helps you regulate energy, but also respects your practical needs.',
    themeColor: 'indigo',
    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Kai&backgroundColor=e0e7ff',
    systemInstruction: `You are Kai, a Holistic Guide.
    Your GOAL: Help regulate the user's energy and assist with clarity.

    PROTOCOL:
    1. **CLARIFY INTENT**: 
       - If the user says "I have been looking for services for so long", DO NOT just say "Breathe."
       - Instead, say: "It is exhausting to search without answers. To help you best, what kind of services are you looking for?"
    2. **REGULATE**: 
       - If the user is purely overwhelmed/panicking, offer somatic support.
    3. **INVITE PRACTICE**: "For a deeper reset, I invite you to step into the Grounding Station."
    4. **CONTENT RULE**: Break instructions into small, digestible parts.
    `
  }
];

function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<Persona>(PERSONAS[0]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  
  // Theme, Voice & Dark Mode
  const [themeColor, setThemeColor] = useState('teal');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Kore'); // Default voice

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Welcome to MindFlow Sanctuary. I am here to support you. \n\nHow are you feeling right now?",
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
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const stopAudioRef = useRef<(() => void) | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, isTyping, view]);

  // Apply Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
      setPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Robust MIME type detection
      const mimeTypes = [
        'audio/webm;codecs=opus', 
        'audio/webm', 
        'audio/mp4', 
        'audio/ogg'
      ];
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          // Send audio as message
          handleSendMessage("", false, { data: base64Data, mimeType: mimeType || 'audio/webm' });
        };
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200); // Collect data in 200ms chunks
      setIsRecording(true);
      
      // Start Timer
      setRecordingTime(0);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setPermissionDenied(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = () => {
    if (isPlayingAudio && stopAudioRef.current) {
      stopAudioRef.current();
      setIsPlayingAudio(false);
    }
    setAudioEnabled(!audioEnabled);
  };

  // --- Message Handling ---

  const handleSendMessage = async (
    text: string, 
    forceLocation: boolean = false,
    audioInput?: { data: string; mimeType: string },
    overridePersona?: Persona
  ) => {
    if (!text.trim() && !audioInput) return;

    const activePersona = overridePersona || currentPersona;

    if (stopAudioRef.current) {
      stopAudioRef.current();
      setIsPlayingAudio(false);
    }

    const userText = text.trim();
    setInputValue('');
    if (audioInput) setIsProcessingVoice(true);

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText || (audioInput ? "🎤 Voice Message" : ""),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      let currentLocation = userLocation;
      const textToCheck = userText.toLowerCase();
      // Expanded trigger words for location
      if (forceLocation || textToCheck.includes('nearby') || textToCheck.includes('near me') || textToCheck.includes('find') || textToCheck.includes('doctor') || textToCheck.includes('therapist')) {
        if (!currentLocation) {
           currentLocation = await requestLocation();
        }
      }

      const historyForChat = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // --- VOICE OPTIMIZATION ---
      // Inject a temporary instruction to keep responses short if audio is enabled.
      // This reduces text generation time, allowing TTS to start sooner.
      const voiceOptimization = (audioEnabled || audioInput) 
         ? "\n\n[SYSTEM NOTICE: VOICE MODE ACTIVE] \nCRITICAL: Keep your response CONVERSATIONAL and UNDER 30 WORDS (approx 2 sentences). Do not use bullet points. Do not list multiple resources. This is to prevent voice playback lag." 
         : "";
      
      const finalSystemInstruction = activePersona.systemInstruction + voiceOptimization;

      // 1. Get Chat Response (Priority 1)
      const chatResult = await sendMessageToGemini(
        historyForChat, 
        userText, 
        currentLocation, 
        audioInput, 
        'chat', 
        finalSystemInstruction
      );

      // 2. Update UI Immediately - Do NOT wait for risk analysis or TTS
      const aiMsgId = (Date.now() + 1).toString();
      const newAiMsg: Message = {
        id: aiMsgId,
        role: 'model',
        text: chatResult.text,
        timestamp: new Date(),
        groundingMetadata: chatResult.groundingMetadata
      };
      
      setMessages(prev => [...prev, newAiMsg]);
      setIsTyping(false);
      setIsProcessingVoice(false);

      // 3. Start Audio Playback (Background)
      if (audioEnabled && chatResult.text) {
        // Start TTS generation in parallel with reading, using selected voice
        generateSpeech(chatResult.text, selectedVoice).then(audioBuffer => {
           if (audioBuffer) {
             setIsPlayingAudio(true);
             const stopFn = playAudioBuffer(audioBuffer);
             stopAudioRef.current = () => {
               stopFn();
               setIsPlayingAudio(false);
             };
             // Auto-reset state when audio finishes (approx duration)
             setTimeout(() => {
               if (stopAudioRef.current === stopFn) setIsPlayingAudio(false);
             }, audioBuffer.duration * 1000 + 1000);
           }
        }).catch(err => console.error("TTS background error", err));
      }

      // 4. Run Risk Analysis (Background)
      // Only run analysis if there is text content to analyze
      const contentToAnalyze = userText || (audioInput ? "Audio message sent" : ""); 
      
      if (contentToAnalyze) {
        analyzeMessageRisk(contentToAnalyze).then(riskAnalysis => {
          // Update the message state with risk assessment results silently
          setMessages(prev => prev.map(msg => 
            msg.id === newUserMsg.id ? { ...msg, assessment: riskAnalysis } : msg
          ));

          // Only trigger alert for HIGH or CRITICAL, specifically avoiding false positives per new instructions
          if (riskAnalysis.riskLevel === RiskLevel.HIGH || riskAnalysis.riskLevel === RiskLevel.CRITICAL) {
            setShowCrisisAlert(true);
          }
        }).catch(err => console.error("Risk analysis background error", err));
      }

    } catch (error) {
      console.error("Interaction error", error);
      setIsTyping(false);
      setIsProcessingVoice(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I apologize, but I am having trouble connecting to the secure server.",
        timestamp: new Date()
      }]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleAssessmentComplete = (persona: Persona, context?: string) => {
    setCurrentPersona(persona);
    setThemeColor(persona.themeColor);
    setShowAssessment(false);
    setView('chat');

    // Reset messages for fresh context
    const initialMsg: Message = {
      id: 'welcome',
      role: 'model',
      text: `Hello, I am ${persona.name}. \n\n${context ? "I understand you're feeling " + context.toLowerCase() + "." : ""} I am here to listen and help you find the right path forward. \n\nWhat is on your mind?`,
      timestamp: new Date()
    };
    setMessages([initialMsg]);
  };

  // Helper to generate dynamic classes based on current theme
  const getThemeClass = (type: 'bg' | 'text' | 'border' | 'ring', shade: number) => {
    return `${type}-${themeColor}-${shade}`;
  };

  if (view === 'landing') {
    return (
      <>
        {showAssessment && (
          <AssessmentModal 
            personas={PERSONAS}
            onSelect={handleAssessmentComplete}
            onCancel={() => {
              setShowAssessment(false);
              setView('chat');
            }}
          />
        )}
        <LandingPage 
          onEnter={() => setShowAssessment(true)} 
          onOpenNews={() => setView('news')} 
          onOpenGrounding={() => setView('grounding')}
          onOpenJournal={() => setView('journaling')}
          onOpenSleep={() => setView('sleep')}
          themeColor={themeColor}
          setThemeColor={setThemeColor}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
        />
      </>
    );
  }

  // Common wrapper for sub-pages to support dark mode/theming
  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className={`${darkMode ? 'dark' : ''} h-full w-full`}>{children}</div>
  );

  if (view === 'news') return <PageWrapper><NewsFeed onBack={() => setView('landing')} themeColor={themeColor} /></PageWrapper>;
  if (view === 'grounding') return <PageWrapper><GroundingPage onBack={() => setView('landing')} /></PageWrapper>;
  if (view === 'journaling') return <PageWrapper><JournalingPage onBack={() => setView('landing')} /></PageWrapper>;
  if (view === 'sleep') return <PageWrapper><SleepPage onBack={() => setView('landing')} /></PageWrapper>;

  // Chat View
  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 relative font-sans transition-colors duration-300`}>
      {!hasAcceptedDisclaimer && (
        <DisclaimerModal onAccept={() => setHasAcceptedDisclaimer(true)} />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        themeColor={themeColor}
      />

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-300">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                 <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-700 dark:text-green-400">
                   <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white">Data Protection</h3>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Your privacy is our priority.</p>
                 </div>
              </div>
              
              <div className="space-y-4 mb-8">
                 <div className="flex gap-4">
                   <ServerOff className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                   <div>
                     <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Server Storage</h4>
                     <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                       We do not save your conversation history. Chats exist only in your browser's temporary memory (RAM) and are wiped when you close the tab.
                     </p>
                   </div>
                 </div>

                 <div className="flex gap-4">
                   <Database className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                   <div>
                     <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Ephemeral Sessions</h4>
                     <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                       Nothing is written to your device's storage. It's like an Incognito window by default.
                     </p>
                   </div>
                 </div>

                 <div className="flex gap-4">
                   <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                   <div>
                     <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Encrypted Transport</h4>
                     <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                       All communication with the AI models is encrypted via HTTPS (TLS 1.3).
                     </p>
                   </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Close & Continue
              </button>
           </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 h-16 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 shrink-0 z-10 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('landing')}
              className="mr-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
            >
              <ArrowLeft className="w-4 h-4" /> Hub
            </button>
            <div className={`p-2 rounded-lg shadow-lg ${getThemeClass('bg', 600)} shadow-${themeColor}-200/50`}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800 dark:text-white leading-tight hidden sm:block">MindFlow Sanctuary</h1>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${getThemeClass('bg', 500)}`}></span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
                  {currentPersona.name} Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Privacy Shield Toggle */}
            <button
               onClick={() => setShowPrivacyModal(true)}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs font-bold hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-400 transition-colors mr-2"
               title="Data Protection Info"
            >
               <ShieldCheck className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">Secure</span>
            </button>

            {/* Settings Toggle */}
            <button
               onClick={() => setShowSettingsModal(true)}
               className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
               title="Settings & Voice"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Audio Toggle */}
            <button 
              onClick={toggleAudio}
              className={`p-2 rounded-full transition-colors ${audioEnabled ? `${getThemeClass('bg', 50)} dark:bg-${themeColor}-900/30 ${getThemeClass('text', 600)} dark:text-${themeColor}-400` : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              title={audioEnabled ? "Mute Voice Response" : "Enable Voice Response"}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => setShowMobilePanel(!showMobilePanel)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Messages List */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-50/50 dark:bg-slate-900/50 scrollbar-hide">
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
                    {isUser ? (
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${getThemeClass('bg', 600)} text-white`}>
                          <User className="w-5 h-5" />
                       </div>
                    ) : (
                       <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1 border border-slate-200 dark:border-slate-700 bg-white">
                          <img src={currentPersona.avatarUrl} alt="AI" className="w-full h-full object-cover" />
                       </div>
                    )}

                    {/* Bubble */}
                    <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                      isUser 
                        ? `${getThemeClass('bg', 600)} text-white rounded-tr-none` 
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      
                      {/* Grounding/Maps Display */}
                      {msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                             <MapPin className="w-3 h-3" /> Sources & Locations
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {msg.groundingMetadata.groundingChunks.map((chunk, idx) => {
                              if (chunk.maps) {
                                return (
                                  <a 
                                    key={idx} 
                                    href={chunk.maps.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs hover:border-teal-400 dark:hover:border-teal-400 transition-colors shadow-sm group hover:bg-white dark:hover:bg-slate-700"
                                  >
                                     <div className="bg-red-50 dark:bg-red-900/20 p-1.5 rounded-md group-hover:bg-red-100 dark:group-hover:bg-red-900/30">
                                       <MapPin className="w-3.5 h-3.5 text-red-500" />
                                     </div>
                                     <div>
                                       <div className="font-semibold text-slate-700 dark:text-slate-200">{chunk.maps.title}</div>
                                       <div className="text-[10px] text-slate-400">View on Google Maps</div>
                                     </div>
                                  </a>
                                );
                              }
                              if (chunk.web) {
                                 return (
                                  <a 
                                    key={idx} 
                                    href={chunk.web.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs hover:border-blue-400 dark:hover:border-blue-400 transition-colors shadow-sm group hover:bg-white dark:hover:bg-slate-700"
                                  >
                                     <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-md group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                                       <Globe className="w-3.5 h-3.5 text-blue-500" />
                                     </div>
                                     <div className="max-w-[150px]">
                                       <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">{chunk.web.title}</div>
                                       <div className="text-[10px] text-slate-400 truncate">Source Link</div>
                                     </div>
                                  </a>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex justify-start w-full animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white shadow-sm">
                    <img src={currentPersona.avatarUrl} alt="AI" className="w-full h-full object-cover" />
                 </div>
                 <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-none flex gap-2 items-center shadow-sm">
                    {isProcessingVoice ? (
                      <>
                        <Mic className="w-3 h-3 text-red-500 animate-pulse" />
                        <span className="text-xs text-slate-500">Processing audio...</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </>
                    )}
                 </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 md:p-6 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors relative">
          
          {/* Permission Error Banner */}
          {permissionDenied && (
            <div className="absolute -top-12 left-0 right-0 mx-4 md:mx-auto max-w-xl bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Microphone access denied. Please check your browser settings.</span>
              <button onClick={() => setPermissionDenied(false)} className="ml-auto hover:bg-red-100 rounded-full p-0.5"><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="max-w-4xl mx-auto relative space-y-3">
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <button 
                onClick={() => handleSendMessage("Can you guide me through a calming breathing exercise?")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-full text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-100 dark:border-slate-600 ${getThemeClass('text', 600)} dark:text-${themeColor}-400`}
                disabled={isRecording}
              >
                <Wind className="w-3 h-3" /> Calming Exercise
              </button>
              <button 
                onClick={() => handleSendMessage("I need to find a therapist near me.", true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-full text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-100 dark:border-slate-600 ${getThemeClass('text', 600)} dark:text-${themeColor}-400`}
                disabled={isRecording}
              >
                <MapPin className="w-3 h-3" /> Find Therapist
              </button>
              <button 
                onClick={() => setShowCrisisAlert(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors border border-orange-100 dark:border-orange-900/50"
              >
                <Phone className="w-3 h-3" /> Crisis Help
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="relative flex items-center gap-3">
              <div className="relative w-full">
                {isRecording && (
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </div>
                   </div>
                )}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isRecording ? `Recording... ${formatTime(recordingTime)}` : `Message ${currentPersona.name}...`}
                  className={`w-full bg-slate-50 dark:bg-slate-900 border text-slate-800 dark:text-white rounded-xl ${isRecording ? 'pl-10 text-red-600 font-medium' : 'pl-4'} pr-24 py-3.5 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 transition-all placeholder:text-slate-400 ${
                    isRecording 
                    ? `border-red-400 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-400` 
                    : 'border-slate-200 dark:border-slate-600'
                  }`}
                  disabled={isTyping || isRecording}
                />
              </div>
              
              <div className="absolute right-2 flex items-center gap-1">
                {/* Voice Record Button - Themed, No Red */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTyping}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    isRecording 
                      ? `bg-red-500 text-white animate-pulse shadow-lg shadow-red-200` 
                      : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600'
                  }`}
                  title={isRecording ? "Stop Recording" : "Start Voice Input"}
                >
                  {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Send Button */}
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isTyping || isRecording}
                  className={`p-2 ${getThemeClass('bg', 600)} text-white rounded-lg hover:bg-${themeColor}-700 disabled:opacity-50 disabled:hover:bg-${themeColor}-600 transition-colors shadow-sm`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </footer>
      </div>

      {/* Sidebar Panel (Desktop: Always visible, Mobile: Toggable) */}
      <div className={`
        fixed inset-y-0 right-0 z-20 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:shadow-none shadow-2xl
        ${showMobilePanel ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <PersonaPanel 
          currentPersona={currentPersona} 
          personas={PERSONAS} 
          onSelectPersona={(p) => {
            setCurrentPersona(p);
            setThemeColor(p.themeColor);
            // Optional: Close mobile panel on select
            if (window.innerWidth < 1024) setShowMobilePanel(false);
          }} 
        />
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setShowMobilePanel(false)}
          className="lg:hidden absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-700 rounded-full"
        >
          <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
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