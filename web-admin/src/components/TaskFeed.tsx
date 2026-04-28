'use client';

import React from 'react';
import { AlertCircle, Users, CheckCircle2, Phone, ShieldAlert } from 'lucide-react';

interface Task {
  task_id: string;
  title: string;
  description: string;
  category: string;
  severity_score: number;
  status: string;
  assigned_volunteer_name?: string;
  assigned_volunteer_phone?: string;
}

interface TaskFeedProps {
  tasks: Task[];
  onFindMatch: (task: Task) => void;
}

export default function TaskFeed({ tasks, onFindMatch }: TaskFeedProps) {
  const unassignedTasks = tasks.filter(t => t.status !== 'assigned');
  const assignedTasks = tasks.filter(t => t.status === 'assigned');

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 text-lg">Live Task Stream</h2>
        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-bold">
          {tasks.length} Total
        </span>
      </div>

      <div className="bg-blue-600/5 p-4 m-4 rounded-2xl border border-blue-100/50">
        <div className="flex items-center space-x-2 text-blue-600 mb-2">
          <ShieldAlert size={14} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Intelligence Summary</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          <span className="text-blue-600">Gemini AI Analysis:</span> Significant cluster of high-severity flooding in Mumbai area. Recommend immediate deployment of rescue boats to Sector 4.
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Unassigned Section */}
        {unassignedTasks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Awaiting Dispatch</h3>
            {unassignedTasks.map((task) => (
              <div 
                key={task.task_id}
                className="bg-slate-50 border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {task.title}
                  </h3>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    task.severity_score > 7 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    Lvl {task.severity_score}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{task.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="bg-slate-200 px-2 py-0.5 rounded text-[10px] capitalize text-slate-500 font-medium">{task.category}</span>
                  <button 
                    onClick={() => onFindMatch(task)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
                  >
                    <Users size={14} />
                    <span>Find Match</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assigned Section */}
        {assignedTasks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase font-bold text-green-500 tracking-widest">Active Dispatches</h3>
            {assignedTasks.map((task) => (
              <div 
                key={task.task_id}
                className="bg-green-50/50 border border-green-100 rounded-xl p-4"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900">{task.title}</h3>
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-black uppercase">Dispatched</span>
                  </div>
                </div>
                
                <div className="mt-4 bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {task.assigned_volunteer_name?.charAt(0) || 'V'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{task.assigned_volunteer_name || 'Volunteer Assigned'}</p>
                        <p className="text-[10px] text-slate-400">On the way to site</p>
                      </div>
                    </div>
                    <a 
                      href={`tel:${task.assigned_volunteer_phone}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                    >
                      <Phone size={14} />
                    </a>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Assignment ID: <span className="font-mono text-slate-600">{task.task_id.slice(0, 8)}</span></span>
                    <span className="text-blue-500 font-bold">LIVE TRACKING ACTIVE</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-20">
            <AlertCircle size={48} className="opacity-20" />
            <p>No active tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
}
