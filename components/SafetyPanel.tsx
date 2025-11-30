
import React from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';
import { Persona } from '../types';

interface PersonaPanelProps {
  currentPersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  personas: Persona[];
}

export const PersonaPanel: React.FC<PersonaPanelProps> = ({ currentPersona, onSelectPersona, personas }) => {
  
  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full lg:w-80 overflow-hidden font-sans transition-colors duration-300">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white mb-1">
          <Sparkles className="w-5 h-5 text-teal-500" />
          <h3 className="font-bold text-lg">Choose Your Guide</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Select the personality that fits your needs today.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
        
        {personas.map((persona) => {
          const isActive = currentPersona.id === persona.id;
          
          return (
            <button
              key={persona.id}
              onClick={() => onSelectPersona(persona)}
              className={`w-full text-left relative p-4 rounded-xl border-2 transition-all duration-200 group ${
                isActive 
                  ? `bg-white dark:bg-slate-800 border-${persona.themeColor}-500 shadow-lg` 
                  : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
              }`}
            >
              {isActive && (
                <div className={`absolute -top-2 -right-2 bg-${persona.themeColor}-500 text-white rounded-full p-1 shadow-md`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={`relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 transition-colors ${
                   isActive ? `border-${persona.themeColor}-200` : 'border-slate-100 group-hover:border-slate-200'
                }`}>
                  <img 
                    src={persona.avatarUrl} 
                    alt={persona.name}
                    className="w-full h-full object-cover bg-slate-50" 
                  />
                </div>
                
                <div>
                  <h4 className={`font-bold text-sm mb-0.5 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {persona.name}
                  </h4>
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                     isActive ? `text-${persona.themeColor}-600` : 'text-slate-400'
                  }`}>
                    {persona.role}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {persona.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        <div className="mt-8 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
           <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Active Configuration</h4>
           <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
             <div className={`w-2 h-2 rounded-full bg-${currentPersona.themeColor}-500 animate-pulse`}></div>
             Using {currentPersona.name} Protocol
           </div>
        </div>

      </div>
    </div>
  );
};