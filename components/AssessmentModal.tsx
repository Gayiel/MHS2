import React from 'react';
import { Heart, Brain, Wind, ArrowRight, Activity } from 'lucide-react';
import { Persona } from '../types';

interface AssessmentModalProps {
  personas: Persona[];
  onSelect: (persona: Persona, initialContext?: string) => void;
  onCancel: () => void;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({ personas, onSelect, onCancel }) => {
  const options = [
    {
      id: 'anxiety',
      label: "I'm feeling anxious or overwhelmed",
      subtext: "Racing thoughts, physical tension, or panic.",
      icon: Wind,
      personaId: 'kai',
      context: "I'm feeling very anxious and overwhelmed right now."
    },
    {
      id: 'sadness',
      label: "I'm feeling down or stuck",
      subtext: "Low energy, lack of motivation, or sadness.",
      icon: Brain,
      personaId: 'atlas',
      context: "I'm feeling down and stuck. I need help finding a way forward."
    },
    {
      id: 'vent',
      label: "I just need to talk / vent",
      subtext: "I need a safe space to be heard without judgment.",
      icon: Heart,
      personaId: 'maya',
      context: "I really need to vent and have someone listen to me."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-8 pb-4 text-center">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">How are you feeling right now?</h2>
          <p className="text-slate-500 dark:text-slate-400">Selecting an option helps us match you with the right support guide.</p>
        </div>

        <div className="p-6 grid gap-4 overflow-y-auto">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => {
                  const persona = personas.find(p => p.id === option.personaId) || personas[0];
                  onSelect(persona, option.context);
                }}
                className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all text-left shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform text-slate-600 dark:text-slate-300">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {option.label}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {option.subtext}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </button>
            );
          })}
        </div>

        <div className="p-6 pt-2 text-center">
           <button 
             onClick={onCancel}
             className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium transition-colors"
           >
             I'd rather choose my own guide
           </button>
        </div>
      </div>
    </div>
  );
};