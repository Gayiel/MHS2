import React, { useState } from 'react';
import { ArrowLeft, Moon, Coffee, Smartphone, Brain, ChevronRight, CheckCircle } from 'lucide-react';
import { generateSleepPlan } from '../services/geminiService';

interface SleepPageProps {
  onBack: () => void;
}

export const SleepPage: React.FC<SleepPageProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    stress: 5,
    caffeine: 'None',
    screens: true,
    bedtime: '23:00'
  });
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateSleepPlan(data);
    setPlan(result);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-200 font-sans selection:bg-blue-500/30">
      <header className="px-6 py-6 flex items-center justify-between">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-center gap-2 text-blue-300">
          <Moon className="w-5 h-5" />
          <span className="font-bold tracking-wide">Sleep Coach</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {!plan ? (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-white mb-2">Let's optimize your rest.</h1>
              <p className="text-slate-400">Answer a few questions to generate a custom wind-down ritual for tonight.</p>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 space-y-8">
              
              {/* Question 1 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-blue-200 mb-3 uppercase tracking-wider">
                  <Brain className="w-4 h-4" /> Stress Level (1-10)
                </label>
                <input 
                  type="range" 
                  min="1" max="10" 
                  value={data.stress} 
                  onChange={(e) => setData({...data, stress: parseInt(e.target.value)})}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>Zen</span>
                  <span>Panic</span>
                </div>
              </div>

              {/* Question 2 */}
              <div>
                 <label className="flex items-center gap-2 text-sm font-bold text-blue-200 mb-3 uppercase tracking-wider">
                  <Coffee className="w-4 h-4" /> Caffeine Intake Today
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['None', 'Morning Only', 'Afternoon/Evening'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setData({...data, caffeine: opt})}
                      className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${
                        data.caffeine === opt 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3 */}
              <div>
                 <label className="flex items-center gap-2 text-sm font-bold text-blue-200 mb-3 uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" /> Using Screens in Bed?
                </label>
                <div className="flex gap-4">
                   <button 
                     onClick={() => setData({...data, screens: true})}
                     className={`flex-1 py-3 rounded-xl text-sm font-bold border ${data.screens ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700'}`}
                   >
                     Yes
                   </button>
                   <button 
                     onClick={() => setData({...data, screens: false})}
                     className={`flex-1 py-3 rounded-xl text-sm font-bold border ${!data.screens ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700'}`}
                   >
                     No
                   </button>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Designing Ritual...' : 'Generate Sleep Plan'}
                {!loading && <ChevronRight className="w-5 h-5" />}
              </button>

            </div>
          </div>
        ) : (
          <div className="animate-in zoom-in duration-500">
             <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700 shadow-2xl">
               <div className="flex items-center gap-3 mb-6">
                 <div className="bg-blue-500/20 p-3 rounded-full text-blue-400">
                   <Moon className="w-6 h-6" />
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold text-white">Your Nightly Ritual</h2>
                   <p className="text-sm text-slate-400">Designed for your current state</p>
                 </div>
               </div>
               
               <div className="prose prose-invert prose-p:text-slate-300 prose-li:text-slate-300 max-w-none">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {plan}
                  </div>
               </div>

               <button 
                 onClick={() => setPlan(null)}
                 className="mt-8 w-full py-3 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
               >
                 Start Over
               </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};