
import React from 'react';
import { Phone, MessageSquareWarning, X, Globe, MessageCircle } from 'lucide-react';
import { CRISIS_RESOURCES, Resource } from '../types';

interface CrisisAlertProps {
  onDismiss: () => void;
}

export const CrisisAlert: React.FC<CrisisAlertProps> = ({ onDismiss }) => {
  
  const getIcon = (type: Resource['type']) => {
    switch (type) {
      case 'hotline': return Phone;
      case 'text': return MessageCircle;
      case 'website': return Globe;
      default: return Phone;
    }
  };

  const getHref = (resource: Resource) => {
    switch (resource.type) {
      case 'hotline': return `tel:${resource.actionValue}`;
      case 'text': return `sms:${resource.actionValue}?body=HOME`;
      case 'website': return resource.actionValue;
      default: return '#';
    }
  };

  return (
    <div className="mb-6 mx-4 md:mx-8 bg-orange-50 border border-orange-200/60 rounded-2xl p-4 md:p-6 animate-in slide-in-from-top duration-500 shadow-lg relative">
      <button 
        onClick={onDismiss} 
        className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="bg-orange-100 p-3 rounded-full shrink-0 hidden sm:block border border-orange-200">
          <MessageSquareWarning className="w-6 h-6 text-orange-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquareWarning className="w-5 h-5 text-orange-600 sm:hidden" />
            <h3 className="text-lg font-bold text-stone-800">Support is Available</h3>
          </div>
          <p className="text-stone-600 text-sm mb-4 leading-relaxed">
            I've noticed you might be going through a difficult moment. While I am an AI, there are caring humans ready to help you right now. 
            These resources are free, confidential, and available 24/7.
          </p>
          
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {CRISIS_RESOURCES.map((resource, idx) => {
              const Icon = getIcon(resource.type);
              return (
                <a 
                  key={idx} 
                  href={getHref(resource)}
                  target={resource.type === 'website' ? '_blank' : undefined}
                  rel={resource.type === 'website' ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all group hover:border-orange-300"
                >
                  <div className="bg-orange-50 p-2 rounded-lg group-hover:bg-orange-100 transition-colors">
                    <Icon className="w-4 h-4 text-orange-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-stone-800 text-sm truncate">{resource.name}</div>
                    <div className="text-orange-700 font-mono text-xs font-bold truncate">{resource.contactDisplay}</div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};