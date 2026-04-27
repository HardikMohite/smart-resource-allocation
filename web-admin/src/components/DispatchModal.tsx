'use client';

import React from 'react';
import { X, User, MapPin, CheckCircle } from 'lucide-react';

interface VolunteerMatch {
  uid: string;
  name: string;
  distance_km: number;
  skills: string[];
  match_score: number;
}

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: VolunteerMatch[];
  onDispatch: (volunteer: VolunteerMatch) => void;
  taskTitle: string;
}

export default function DispatchModal({ isOpen, onClose, matches, onDispatch, taskTitle }: DispatchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Dispatch Volunteer</h2>
            <p className="text-sm text-slate-500 mt-1">Recommended for: <span className="text-blue-600 font-medium">{taskTitle}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {matches.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No available volunteers within 10km found.</p>
            </div>
          ) : (
            matches.map((match) => (
              <div key={match.uid} className="border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:border-blue-200 transition-colors bg-slate-50/50">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{match.name}</h3>
                    <div className="flex items-center text-xs text-slate-500 mt-1 space-x-3">
                      <span className="flex items-center"><MapPin size={12} className="mr-1" /> {match.distance_km}km away</span>
                      <span className="flex items-center text-blue-600 font-bold"><CheckCircle size={12} className="mr-1" /> {Math.round(match.match_score * 100)}% Match</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => onDispatch(match)}
                  className="bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  Dispatch
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="text-slate-600 font-semibold px-4 py-2 hover:text-slate-900 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
