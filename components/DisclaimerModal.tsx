import React from 'react';
import { ShieldCheck, Activity, Lock } from 'lucide-react';

interface DisclaimerModalProps {
  onAccept: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="bg-teal-700 p-8 text-white text-center shrink-0 relative overflow-hidden">
           {/* Decorative background circle */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-600 rounded-full opacity-50 blur-3xl"></div>
           
          <Activity className="w-12 h-12 mx-auto mb-4 relative z-10 text-teal-100" />
          <h2 className="text-2xl font-bold relative z-10 tracking-tight">MindFlow Sanctuary</h2>
          <p className="text-teal-100 mt-2 relative z-10 font-medium">Professional Mental Health AI Platform</p>
          
          <div className="flex justify-center gap-4 mt-4 relative z-10">
            <span className="inline-flex items-center gap-1 text-[10px] bg-teal-800/50 px-2 py-1 rounded border border-teal-600">
              <Lock className="w-3 h-3" /> HIPAA Compliant Standards
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] bg-teal-800/50 px-2 py-1 rounded border border-teal-600">
              <ShieldCheck className="w-3 h-3" /> Local-Only Data
            </span>
          </div>
        </div>
        
        <div className="p-6 space-y-5 text-slate-700 overflow-y-auto">
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded text-sm shadow-sm">
            <h3 className="font-bold text-orange-800 mb-1">Clinical Disclaimer</h3>
            <p className="text-orange-900/80 leading-relaxed">
              MindFlow is an AI-powered support tool supervised by automated protocols. 
              **It is not a replacement for human therapy or emergency care.**
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 mt-0.5">
                <span className="text-xs font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">AI-Driven Support</h4>
                <p className="text-xs text-slate-500 mt-1">I use evidence-based conversation frameworks, but I do not have human feelings or credentials.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 mt-0.5">
                <span className="text-xs font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Crisis Safety Protocols</h4>
                <p className="text-xs text-slate-500 mt-1">Chats are monitored for risk. High-risk conversations may trigger automatic resource referrals.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 mt-0.5">
                <span className="text-xs font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Emergency Situations</h4>
                <p className="text-xs text-slate-500 mt-1">If you are in immediate danger, you agree to stop using this service and call 911 or 988 immediately.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 flex gap-3 bg-slate-50 border-t border-slate-100 shrink-0">
          <button 
            onClick={() => window.location.href = 'https://988lifeline.org/'}
            className="flex-1 px-4 py-3 rounded-xl border border-orange-200 text-orange-700 font-semibold hover:bg-orange-50 transition-colors text-sm"
          >
            Emergency
          </button>
          <button 
            onClick={onAccept}
            className="flex-[2] px-4 py-3 rounded-xl bg-teal-700 text-white font-semibold hover:bg-teal-800 shadow-lg shadow-teal-200/50 transition-all text-sm flex items-center justify-center gap-2"
          >
            I Understand & Enter Sanctuary
          </button>
        </div>
      </div>
    </div>
  );
};