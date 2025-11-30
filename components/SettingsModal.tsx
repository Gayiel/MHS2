import React from 'react';
import { Volume2, X, Check, Mic2 } from 'lucide-react';
import { AVAILABLE_VOICES, VoiceOption } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  themeColor: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedVoice, 
  onSelectVoice,
  themeColor
}) => {
  if (!isOpen) return null;

  const getThemeClass = (type: 'bg' | 'text' | 'border' | 'ring', shade: number) => {
    return `${type}-${themeColor}-${shade}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
            <Mic2 className={`w-5 h-5 ${getThemeClass('text', 600)}`} /> 
            Voice Preferences
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wide">
              AI Voice Persona
            </h4>
            <div className="space-y-3">
              {AVAILABLE_VOICES.map((voice: VoiceOption) => (
                <button
                  key={voice.id}
                  onClick={() => onSelectVoice(voice.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selectedVoice === voice.id
                      ? `border-${themeColor}-500 bg-${themeColor}-50 dark:bg-${themeColor}-900/20`
                      : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedVoice === voice.id
                        ? `bg-${themeColor}-100 text-${themeColor}-600 dark:bg-${themeColor}-900/50 dark:text-${themeColor}-400`
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                    }`}>
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-800 dark:text-white text-sm">{voice.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{voice.description}</div>
                    </div>
                  </div>
                  
                  {selectedVoice === voice.id && (
                    <div className={`bg-${themeColor}-500 text-white p-1 rounded-full`}>
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl text-xs text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-100 dark:border-slate-700/50">
            <strong>Note:</strong> Voice changes will apply to the next message. The AI uses advanced Neural TTS to provide a natural, conversational tone.
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className={`px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-colors ${getThemeClass('bg', 600)} hover:${getThemeClass('bg', 700)}`}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};