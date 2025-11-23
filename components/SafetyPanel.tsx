import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Activity, BrainCircuit, ShieldCheck, Users, MessageSquare, Stethoscope, Radio } from 'lucide-react';
import { Message, RiskLevel } from '../types';

interface SafetyPanelProps {
  messages: Message[];
}

const StatItem = ({ icon: Icon, label, value, color = "text-slate-700" }: any) => (
  <div className="flex flex-col p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className={`w-3 h-3 ${color}`} />
      <span className="text-[10px] font-medium text-slate-400 uppercase">{label}</span>
    </div>
    <span className={`text-lg font-bold ${color} leading-none`}>{value}</span>
  </div>
);

export const SafetyPanel: React.FC<SafetyPanelProps> = ({ messages }) => {
  // Filter for user messages that have an assessment
  const assessedMessages = messages
    .filter(m => m.role === 'user' && m.assessment)
    .map((m, index) => ({
      name: `Msg ${index + 1}`,
      sentiment: m.assessment?.sentimentScore || 0,
      risk: m.assessment?.riskLevel,
      timestamp: m.timestamp
    }));

  const currentAssessment = messages.filter(m => m.role === 'user' && m.assessment).pop()?.assessment;

  const getRiskColor = (level: RiskLevel | undefined) => {
    switch (level) {
      case RiskLevel.CRITICAL: return 'bg-rose-100 text-rose-700 border-rose-200';
      case RiskLevel.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200';
      case RiskLevel.MEDIUM: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-teal-50 text-teal-700 border-teal-100';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 border-l border-slate-200 w-full lg:w-96 overflow-hidden font-sans">
      {/* Header */}
      <div className="p-5 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-2 text-teal-900 mb-1">
          <Activity className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-lg">Clinical Oversight</h3>
        </div>
        <p className="text-xs text-slate-500">Professional Dashboard • Licensed Supervision</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
        
        {/* Platform Stats Section (Simulated) */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Radio className="w-3 h-3 text-teal-500 animate-pulse" />
            MindFlow Network Live
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <StatItem label="Active Users" value="3,247" icon={Users} />
            <StatItem label="Counselors" value="1,284" icon={Stethoscope} color="text-teal-700" />
            <StatItem label="Active Sessions" value="847" icon={MessageSquare} />
            <StatItem label="Interventions" value="23" icon={AlertTriangle} color="text-rose-600" />
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Current Session Status */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Individual Risk Monitor</h4>
             <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded font-mono">ID: {Math.floor(Date.now() / 100000)}</span>
          </div>

          <div className={`rounded-lg border px-4 py-3 flex items-center justify-between mb-3 ${getRiskColor(currentAssessment?.riskLevel || RiskLevel.LOW)}`}>
            <div className="flex items-center gap-3">
              {currentAssessment?.riskLevel === RiskLevel.CRITICAL || currentAssessment?.riskLevel === RiskLevel.HIGH ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
              <div>
                <span className="block font-bold text-sm">{currentAssessment?.riskLevel || "Standing By"} Risk</span>
                <span className="text-[10px] opacity-90 block">Clinical Assessment</span>
              </div>
            </div>
          </div>
          
          {currentAssessment?.flags && currentAssessment.flags.length > 0 && (
             <div className="flex flex-wrap gap-1.5 mb-3">
              {currentAssessment.flags.map((flag, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-semibold text-slate-600">
                  {flag}
                </span>
              ))}
             </div>
          )}

          {currentAssessment?.reasoning && (
            <div className="relative pl-3 border-l-2 border-slate-200">
               <p className="text-xs text-slate-600 italic leading-relaxed">
                "{currentAssessment.reasoning}"
              </p>
            </div>
          )}
        </div>

        {/* Chart */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Affective Valence History</h4>
          <div className="h-40 w-full bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={assessedMessages}>
                <defs>
                  <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis domain={[-10, 10]} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  itemStyle={{ color: '#0f766e', fontWeight: '600' }}
                  formatter={(value) => [value, "Valence"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="sentiment" 
                  stroke="#0d9488" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSentiment)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 px-2 mt-1 font-medium uppercase">
            <span>Distress (-10)</span>
            <span>Baseline (0)</span>
            <span>Thriving (+10)</span>
          </div>
        </div>

        {/* Audit Log Simulator */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
             <BrainCircuit className="w-3 h-3" />
             Protocol Logs
          </h4>
          <div className="space-y-2">
            {assessedMessages.slice().reverse().map((msg, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg text-xs group hover:border-teal-200 transition-all">
                <div className="flex flex-col">
                   <span className="font-medium text-slate-700">Assessment Logged</span>
                   <span className="text-slate-400 text-[10px]">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                  msg.risk === 'Critical' ? 'text-rose-700 bg-rose-50' :
                  msg.risk === 'High' ? 'text-orange-700 bg-orange-50' :
                  'text-teal-700 bg-teal-50'
                }`}>
                  {msg.risk}
                </div>
              </div>
            ))}
            {assessedMessages.length === 0 && (
               <div className="text-center py-8">
                  <p className="text-xs text-slate-400">System ready. Waiting for user input.</p>
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};