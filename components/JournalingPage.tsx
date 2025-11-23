import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Sparkles, Save } from 'lucide-react';
import { analyzeJournalEntry } from '../services/geminiService';

interface JournalingPageProps {
  onBack: () => void;
}

export const JournalingPage: React.FC<JournalingPageProps> = ({ onBack }) => {
  const [entry, setEntry] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedMode, setSavedMode] = useState(false);

  const handleAnalyze = async () => {
    if (!entry.trim()) return;
    setIsAnalyzing(true);
    const result = await analyzeJournalEntry(entry);
    setAnalysis(result);
    setIsAnalyzing(false);
    setSavedMode(true);
  };

  return (
    <div className="min-h-screen w-full bg-amber-50/30 font-serif">
      <header className="bg-white border-b border-amber-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-amber-50 rounded-full text-amber-900/60 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Reflective Journal
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 md:p-10">
        {!savedMode ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-amber-800/60 mb-4 italic">
              "Write freely. What is on your mind right now? There is no right or wrong way to feel."
            </p>
            <textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Start writing here..."
              className="w-full h-[60vh] p-6 rounded-xl border border-amber-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 text-lg leading-relaxed text-slate-800 resize-none placeholder:text-slate-300"
            />
            
            <div className="mt-6 flex justify-end gap-3">
               <button 
                 onClick={handleAnalyze}
                 disabled={!entry.trim() || isAnalyzing}
                 className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isAnalyzing ? (
                   <span>Reflecting...</span>
                 ) : (
                   <>
                     <Sparkles className="w-4 h-4" />
                     Reflect & Save
                   </>
                 )}
               </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            {/* The Insight Card */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border-t-4 border-amber-500">
              <div className="flex items-center gap-2 text-amber-600 mb-4 font-sans font-bold uppercase tracking-wider text-xs">
                <Sparkles className="w-4 h-4" />
                AI Insight
              </div>
              <p className="text-xl text-slate-700 leading-relaxed italic font-medium">
                "{analysis}"
              </p>
            </div>

            {/* The Entry Card */}
            <div className="bg-white rounded-xl p-8 border border-amber-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
               <div className="text-xs text-slate-400 mb-4 font-sans">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</div>
               <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{entry}</p>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => {
                  setEntry('');
                  setAnalysis(null);
                  setSavedMode(false);
                }}
                className="text-amber-700 font-sans font-bold hover:underline"
              >
                Write Another Entry
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};