import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Lock, Phone, BarChart3, BookOpen, Wind, Moon, Brain, Newspaper, Sun, Settings, ShieldCheck, Loader2, Activity, TrendingUp, TrendingDown, X, FileText, Info } from 'lucide-react';
import { fetchMentalHealthStats } from '../services/geminiService';

interface LandingPageProps {
  onEnter: () => void;
  onOpenNews: () => void;
  onOpenGrounding: () => void;
  onOpenJournal: () => void;
  onOpenSleep: () => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onEnter, 
  onOpenNews,
  onOpenGrounding,
  onOpenJournal,
  onOpenSleep,
  themeColor,
  setThemeColor,
  darkMode,
  toggleDarkMode
}) => {
  const [stats, setStats] = useState<{ value: string; label: string; subtext: string; type: 'reality' | 'response' }[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeInfoModal, setActiveInfoModal] = useState<'privacy' | 'terms' | 'methodology' | null>(null);

  useEffect(() => {
    let mounted = true;
    const getStats = async () => {
      const data = await fetchMentalHealthStats();
      if (mounted) {
        if (data.length > 0) setStats(data);
        setLoadingStats(false);
      }
    };
    getStats();
    return () => { mounted = false; };
  }, []);

  const getThemeClass = (type: 'bg' | 'text' | 'border' | 'ring', shade: number) => {
    return `${type}-${themeColor}-${shade}`;
  };

  const renderInfoModal = () => {
    if (!activeInfoModal) return null;

    let title = '';
    let content = null;

    if (activeInfoModal === 'privacy') {
        title = "Privacy Policy";
        content = (
            <div className="space-y-4">
                <p><strong>Last Updated: October 2024</strong></p>
                <p>MindFlow Sanctuary operates on a <strong>client-side only</strong> architecture. We prioritize your anonymity.</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>No Data Collection:</strong> We do not store your chat logs, audio recordings, or personal identifiers on our servers.</li>
                    <li><strong>Ephemeral Sessions:</strong> All conversation data exists only in your browser's temporary memory (RAM) and is cleared the moment you close the tab or refresh the page.</li>
                    <li><strong>Third-Party Processing:</strong> Anonymized text is sent to Google Gemini for processing via encrypted TLS 1.3 channels. No personal data is retained by the model for training.</li>
                </ul>
            </div>
        );
    } else if (activeInfoModal === 'terms') {
        title = "Terms of Service";
        content = (
            <div className="space-y-4">
                <p>By entering MindFlow Sanctuary, you acknowledge and agree to the following:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Not a Medical Service:</strong> MindFlow is an AI-assisted self-help tool, not a licensed medical provider. It cannot diagnose or prescribe.</li>
                    <li><strong>Emergency Protocol:</strong> If you express intent to harm yourself or others, the AI is programmed to interrupt the conversation and provide emergency contact numbers (988/911).</li>
                    <li><strong>User Responsibility:</strong> You are responsible for your own safety. If you feel you are in danger, you must seek professional human help immediately.</li>
                </ul>
            </div>
        );
    } else if (activeInfoModal === 'methodology') {
        title = "Clinical Methodology";
        content = (
            <div className="space-y-4">
                <p>Our AI personas are tuned using standard psychotherapeutic frameworks:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>CBT (Cognitive Behavioral Therapy):</strong> Used by 'Dr. Atlas' to identify and reframe negative thought patterns.</li>
                    <li><strong>DBT (Dialectical Behavior Therapy):</strong> Used in our grounding exercises to manage intense emotions.</li>
                    <li><strong>Person-Centered Therapy:</strong> Used by 'Maya' to provide unconditional positive regard and empathetic listening.</li>
                </ul>
                <p className="mt-4 text-xs italic">Note: While based on these frameworks, the AI is a simulation and not a substitute for a trained human therapist.</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                    <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                        <Info className="w-5 h-5 text-teal-500" /> {title}
                    </h3>
                    <button onClick={() => setActiveInfoModal(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                        <X className="w-5 h-5 dark:text-slate-400" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {content}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right">
                    <button onClick={() => setActiveInfoModal(null)} className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-medium">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className={`min-h-screen w-full font-sans flex flex-col relative overflow-x-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {renderInfoModal()}

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 opacity-50 pointer-events-none">
        <div className={`absolute w-full h-full ${darkMode ? 'opacity-20' : 'opacity-40'}`}>
           <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl ${getThemeClass('bg', 200)} opacity-30`}></div>
           <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-3xl ${getThemeClass('bg', 300)} opacity-20`}></div>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <nav className={`relative z-10 w-full ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'} backdrop-blur-md border-b sticky top-0 transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${getThemeClass('bg', 600)}`}>
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className={`font-bold text-xl tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>MindFlow Sanctuary</span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Theme Controls */}
             <div className={`hidden md:flex items-center gap-2 p-1.5 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                {['teal', 'indigo', 'amber', 'blue', 'stone'].map(c => (
                   <button
                     key={c}
                     onClick={() => setThemeColor(c)}
                     className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${themeColor === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''}`}
                     style={{ backgroundColor: `var(--color-${c}-500, ${c === 'teal' ? '#14b8a6' : c === 'indigo' ? '#6366f1' : c === 'amber' ? '#f59e0b' : c === 'blue' ? '#3b82f6' : '#78716c'})` }}
                     title={`Set Theme to ${c}`}
                   />
                ))}
             </div>

             <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 hidden md:block"></div>

             <button
               onClick={toggleDarkMode}
               className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-600'}`}
             >
               {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>

             <button 
                onClick={onOpenNews}
                className={`hidden md:flex items-center gap-2 text-sm font-bold transition-colors px-4 py-2 rounded-full ${
                  darkMode 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Newspaper className="w-4 h-4" /> News
              </button>
          </div>
        </div>
      </nav>

      {/* Main Content Dashboard */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-12 grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Hero & Toolkit (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Hero Section */}
          <div className={`rounded-3xl p-8 md:p-12 border shadow-xl relative overflow-hidden group transition-all duration-500 ${
            darkMode 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
          }`}>
             <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50 transition-colors duration-1000 ${getThemeClass('bg', 100)}`}></div>
             
             <div className="relative z-10">
               <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-6 ${
                 darkMode 
                 ? `${getThemeClass('bg', 900)} ${getThemeClass('text', 300)}` 
                 : `${getThemeClass('bg', 100)} ${getThemeClass('text', 800)}`
               }`}>
                 AI-Powered Professional Support
               </span>
               <h1 className={`text-4xl md:text-6xl font-bold mb-6 leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                 You don't have to <br/>
                 <span className={getThemeClass('text', 500)}>navigate this alone.</span>
               </h1>
               <p className={`text-lg mb-8 max-w-xl leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                 Access a secure, confidential space to process your thoughts. 
                 Guided by clinical protocols and overseen by licensed professionals.
               </p>
               
               <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                   onClick={onEnter}
                   className={`${getThemeClass('bg', 600)} hover:${getThemeClass('bg', 700)} text-white text-lg font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2`}
                 >
                   Enter Sanctuary <ArrowRight className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={onOpenNews}
                   className={`border text-lg font-medium py-4 px-8 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                     darkMode 
                     ? 'border-slate-600 hover:bg-slate-700 text-slate-300' 
                     : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                   }`}
                 >
                   Read Stories
                 </button>
               </div>
             </div>
          </div>

          {/* Wellness Toolkit */}
          <div className="grid md:grid-cols-3 gap-4">
            <div 
              onClick={onOpenGrounding}
              className={`backdrop-blur p-6 rounded-2xl border transition-colors cursor-pointer group hover:shadow-md ${
                darkMode 
                ? 'bg-slate-800/80 border-slate-700 hover:border-indigo-500' 
                : 'bg-white/80 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <Wind className="w-5 h-5" />
              </div>
              <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Grounding</h3>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Use the 5-4-3-2-1 technique to reconnect with your surroundings.
              </p>
            </div>

            <div 
              onClick={onOpenJournal}
              className={`backdrop-blur p-6 rounded-2xl border transition-colors cursor-pointer group hover:shadow-md ${
                darkMode 
                ? 'bg-slate-800/80 border-slate-700 hover:border-amber-500' 
                : 'bg-white/80 border-slate-200 hover:border-amber-300'
              }`}
            >
               <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Journaling</h3>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Reflective insights to reduce cognitive load.
              </p>
            </div>

            <div 
              onClick={onOpenSleep}
              className={`backdrop-blur p-6 rounded-2xl border transition-colors cursor-pointer group hover:shadow-md ${
                darkMode 
                ? 'bg-slate-800/80 border-slate-700 hover:border-blue-500' 
                : 'bg-white/80 border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <Moon className="w-5 h-5" />
              </div>
              <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Sleep Coach</h3>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Generate a personalized sleep ritual.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Reliable Metrics & Stats (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* COMPACT MIXED WIDGET */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 relative overflow-hidden">
             {/* Background glow for 'Live' feel */}
             <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl"></div>

             <div className="flex items-center justify-between mb-4 relative z-10 border-b border-slate-800 pb-3">
               <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">Live Monitor</h3>
               </div>
               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700/50">
                  <div className="w-1 h-1 rounded-full bg-teal-500 animate-pulse"></div>
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">System Nominal</span>
               </div>
             </div>
             
             {loadingStats ? (
                <div className="flex flex-col items-center justify-center py-4 text-slate-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-px bg-slate-800/50 rounded-lg overflow-hidden border border-slate-800">
                   {stats.map((stat, idx) => (
                     <div key={idx} className={`p-2.5 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                       stat.type === 'response' 
                         ? 'bg-slate-800/80' 
                         : 'bg-slate-900/50'
                     }`} style={{ animationDelay: `${idx * 100}ms` }}>
                       <div className="flex items-center justify-between mb-1">
                         <div className={`text-[9px] uppercase tracking-wide font-bold ${stat.type === 'response' ? 'text-teal-400' : 'text-slate-500'}`}>
                           {stat.subtext}
                         </div>
                       </div>
                       <div className={`text-base font-bold leading-tight ${stat.type === 'response' ? 'text-white' : 'text-slate-400'}`}>
                         {stat.value}
                       </div>
                       <div className="text-[10px] text-slate-500 font-medium truncate">
                         {stat.label}
                       </div>
                     </div>
                   ))}
                </div>
              )}
          </div>

          <div className={`p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
             <h3 className={`font-bold mb-3 text-xs uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-2`}>
               <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
               Privacy Protocol
             </h3>
             <div className="space-y-2">
               <div className="flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-green-500 shrink-0"></div>
                 <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Chats stored locally in RAM only.</p>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-green-500 shrink-0"></div>
                 <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">No personal data saved to servers.</p>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-green-500 shrink-0"></div>
                 <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Incognito by default.</p>
               </div>
             </div>
          </div>

        </div>

      </main>

      <footer className={`border-t py-8 mt-auto ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-500'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
           <div>© 2024 MindFlow Sanctuary.</div>
           <div className="flex gap-6">
             <button onClick={() => setActiveInfoModal('privacy')} className={`hover:${getThemeClass('text', 600)}`}>Privacy</button>
             <button onClick={() => setActiveInfoModal('terms')} className={`hover:${getThemeClass('text', 600)}`}>Terms</button>
             <button onClick={() => setActiveInfoModal('methodology')} className={`hover:${getThemeClass('text', 600)}`}>Methodology</button>
           </div>
        </div>
      </footer>
    </div>
  );
};