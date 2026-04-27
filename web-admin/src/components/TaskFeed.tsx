'use client';

import React from 'react';
import { AlertCircle, MapPin, Users } from 'lucide-react';

interface Task {
  task_id: string;
  title: string;
  description: string;
  category: string;
  severity_score: number;
}

interface TaskFeedProps {
  tasks: Task[];
  onFindMatch: (task: Task) => void;
}

export default function TaskFeed({ tasks, onFindMatch }: TaskFeedProps) {
  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 text-lg">Unassigned Tasks</h2>
        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-bold">
          {tasks.length} Active
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
            <AlertCircle size={48} className="opacity-20" />
            <p>No open tasks found</p>
          </div>
        ) : (
          tasks.map((task) => (
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
              
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                {task.description}
              </p>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-xs text-slate-400 space-x-2">
                  <span className="bg-slate-200 px-2 py-0.5 rounded capitalize">{task.category}</span>
                </div>
                
                <button 
                  onClick={() => onFindMatch(task)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  <Users size={14} />
                  <span>Find Match</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
