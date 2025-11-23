import React from 'react';
import { ArrowRight, Shield, Lock, Phone, BarChart3, BookOpen, Wind, Moon, Brain, Newspaper } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
  onOpenNews: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onOpenNews }) => {
  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans flex flex-col relative overflow-x-hidden">
      {/* Subtle Background Animation */}
      <div className="fixed inset-0 z-0 opacity-50 pointer-events-none">
        <div className="wave"></div>
      </div>

      {/* Top Navigation Bar */}
      <nav className="relative z-10 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 p-2 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">MindFlow Sanctuary</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-teal-600" /> HIPAA Secure</span>
            <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-teal-600" /> Encrypted</span>
          </div>
          <button 
            onClick={onOpenNews}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-teal-700 transition-colors bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full"
          >
            <Newspaper className="w-4 h-4" /> News & Stories
          </button>
        </div>
      </nav>

      {/* Crisis Banner - Full Width */}
      <div className="relative z-20 bg-rose-600 text-white py-3 px-4 text-center shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm">
          <span className="font-bold flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Immediate Crisis Support Available 24/7
          </span>
          <div className="flex gap-3">
            <a href="tel:988" className="bg-white text-rose-700 px-3 py-1 rounded-md font-bold hover:bg-rose-50 transition-colors">Call 988</a>
            <a href="https://988lifeline.org" target="_blank" rel="noreferrer" className="underline hover:text-rose-100">988lifeline.org</a>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-12 grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Hero & Toolkit (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Hero Section */}
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-teal-100 transition-colors duration-1000"></div>
             
             <div className="relative z-10">
               <span className="inline-block px-4 py-1.5 bg-teal-100 text-teal-800 rounded-full text-xs font-bold uppercase tracking-wide mb-6">
                 AI-Powered Professional Support
               </span>
               <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                 You don't have to <br/>
                 <span className="text-teal-600">navigate this alone.</span>
               </h1>
               <p className="text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
                 Access a secure, confidential space to process your thoughts. 
                 Guided by clinical protocols and overseen by licensed professionals.
               </p>
               
               <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                   onClick={onEnter}
                   className="bg-teal-600 hover:bg-teal-700 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-lg shadow-teal-200/50 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                 >
                   Enter Sanctuary <ArrowRight className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={onOpenNews}
                   className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-lg font-medium py-4 px-8 rounded-xl transition-colors flex items-center justify-center gap-2"
                 >
                   Read Stories
                 </button>
               </div>
             </div>
          </div>

          {/* Wellness Toolkit - "Comprehensive Suggestions" */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-slate-200 hover:border-teal-300 transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <Wind className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Grounding</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Feeling overwhelmed? Try the 5-4-3-2-1 technique to reconnect with your surroundings instantly.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-slate-200 hover:border-teal-300 transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Journaling</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Getting thoughts out of your head and onto a secure log can reduce cognitive load.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-slate-200 hover:border-teal-300 transition-colors cursor-pointer group">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <Moon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Sleep Hygiene</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review the checklist for better rest. Sleep is the foundation of emotional regulation.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Reliable Metrics & Stats (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-6 text-teal-400">
              <BarChart3 className="w-5 h-5" />
              <span className="font-bold uppercase tracking-wider text-xs">The Reality</span>
            </div>
            
            <div className="space-y-8">
              <div>
                <div className="text-4xl font-bold mb-1 text-white">57.8M</div>
                <div className="text-sm text-slate-400 font-medium">U.S. Adults with Any Mental Illness (AMI)</div>
                <div className="text-[10px] text-slate-500 mt-1">Source: NIMH (2021)</div>
              </div>

              <div className="w-full h-px bg-slate-700"></div>

              <div>
                <div className="text-4xl font-bold mb-1 text-rose-400">47.2%</div>
                <div className="text-sm text-slate-400 font-medium">Received Treatment in Past Year</div>
                <div className="text-[10px] text-slate-500 mt-1">Source: SAMHSA (2021)</div>
                <p className="text-xs text-slate-300 mt-3 italic border-l-2 border-rose-500 pl-3">
                  "More than half of people with mental illness did not receive care."
                </p>
              </div>

              <div className="w-full h-px bg-slate-700"></div>

              <div>
                <div className="text-4xl font-bold mb-1 text-teal-400">2nd</div>
                <div className="text-sm text-slate-400 font-medium">Leading cause of death (Ages 10-14 & 25-34)</div>
                <div className="text-[10px] text-slate-500 mt-1">Source: CDC (2022)</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-3">Latest Community Update</h3>
             <div className="p-3 bg-teal-50 rounded-lg border border-teal-100 mb-3">
               <span className="text-[10px] font-bold text-teal-700 uppercase">New Research</span>
               <p className="text-xs text-teal-900 mt-1 font-medium">
                 "Mindfulness-based cognitive therapy (MBCT) may be as effective as antidepressants for preventing relapse."
               </p>
             </div>
             <button 
               onClick={onOpenNews}
               className="w-full text-center text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
             >
               Read more in News Feed
             </button>
          </div>

        </div>

      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
           <div>© 2024 MindFlow Sanctuary. All rights reserved.</div>
           <div className="flex gap-6">
             <a href="#" className="hover:text-teal-600">Privacy Policy</a>
             <a href="#" className="hover:text-teal-600">Terms of Service</a>
             <a href="#" className="hover:text-teal-600">Clinical Methodology</a>
           </div>
        </div>
      </footer>
    </div>
  );
};
