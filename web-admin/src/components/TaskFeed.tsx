import React from 'react';
import { AlertCircle, MapPin, Clock, ArrowRight, Shield, Phone, Brain, XCircle } from 'lucide-react';

interface Task {
  id: string;
  task_id: string;
  title: string;
  description: string;
  category: string;
  severity_score: number;
  latitude: number;
  longitude: number;
  status: string;
}

interface TaskFeedProps {
  tasks: Task[];
  onFindMatch: (task: Task) => void;
  onCancelDispatch: (task: Task) => void;
}

export default function TaskFeed({ tasks, onFindMatch, onCancelDispatch }: TaskFeedProps) {
  const awaitingDispatch = tasks.filter(t => t.status === 'open');
  const activeDispatches = tasks.filter(t => t.status === 'assigned');

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-white/10">
      <div className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-black tracking-tight text-white uppercase italic">Live Task Stream</h2>
          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-black">{tasks.length} Total</span>
        </div>
        
        {/* Gemini AI Intelligence Box */}
        <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
          <div className="flex items-center space-x-2 mb-2">
            <Brain size={14} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Intelligence Summary</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            <span className="text-blue-300 font-bold">Gemini AI Analysis:</span> Significant cluster of high-severity flooding in Mumbai area. Recommend immediate deployment of rescue boats to Sector 4.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Awaiting Dispatch */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Awaiting Dispatch</h3>
          {awaitingDispatch.map((task) => (
            <div key={task.id} className="group relative bg-slate-800/40 border border-white/5 rounded-2xl p-5 hover:bg-slate-800/60 transition-all hover:border-blue-500/30">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-white leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tight">{task.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-black ${task.severity_score > 7 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  LVL {task.severity_score}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-lg">{(task.category || 'EMERGENCY')}</span>
                <button 
                  onClick={() => onFindMatch(task)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all transform group-hover:translate-x-1"
                >
                  <ArrowRight size={14} /> <span>Find Match</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Active Dispatches */}
        {activeDispatches.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-green-500/80 uppercase tracking-widest">Active Dispatches</h3>
            {activeDispatches.map((task) => (
              <div key={task.id} className="bg-green-500/[0.03] border border-green-500/20 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 flex space-x-2">
                  <button 
                    onClick={() => onCancelDispatch(task)}
                    className="p-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all group"
                    title="Cancel Dispatch"
                  >
                    <XCircle size={14} />
                  </button>
                  <div className="flex items-center space-x-1 bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full text-[8px] font-black border border-green-500/20">
                    <Clock size={10} className="animate-pulse" /> <span>DISPATCHED</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-white uppercase tracking-tight">{task.title}</h4>
                    <div className="flex items-center space-x-3 mt-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-black text-xs border border-green-500/20">
                        {(task.category || 'E')[0]}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white">Field Responder (Demo)</p>
                        <p className="text-[9px] text-slate-500">On the way to site</p>
                      </div>
                      <div className="ml-auto">
                        <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-blue-400 transition-colors">
                          <Phone size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[9px] font-bold">
                    <span className="text-slate-500">Assignment ID: <span className="text-slate-400 font-mono">{(task.task_id || task.id || "").toString().slice(0, 8)}</span></span>
                    <span className="text-blue-500 tracking-tighter uppercase font-black">Live Tracking Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
