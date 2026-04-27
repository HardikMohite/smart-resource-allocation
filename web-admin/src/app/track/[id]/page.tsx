'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin, Clock, CheckCircle2, Phone, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TrackingPage() {
  const params = useParams();
  const taskId = params.id as string;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;

    const unsubscribe = onSnapshot(doc(db, 'tasks', taskId), (docSnap) => {
      if (docSnap.exists()) {
        setTask({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    }, (error) => {
      console.error("Tracking error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [taskId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white text-center">
        <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
        <p className="text-slate-400 mb-8 text-sm">We couldn't find a report with this ID. It may have been cleared or the ID is incorrect.</p>
        <Link href="/" className="bg-blue-600 px-6 py-3 rounded-xl font-bold">Back to Home</Link>
      </div>
    );
  }

  const steps = [
    { label: 'Report Received', status: 'completed', icon: <Clock size={16} /> },
    { label: 'AI Verification', status: task.status !== 'pending_verification' ? 'completed' : 'current', icon: <ShieldCheck size={16} /> },
    { label: 'Volunteer Dispatched', status: task.status === 'assigned' ? 'completed' : (task.status === 'open' ? 'current' : 'pending'), icon: <User size={16} /> },
    { label: 'Resolution', status: task.status === 'resolved' ? 'completed' : 'pending', icon: <CheckCircle2 size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 font-sans">
      <div className="max-w-2xl mx-auto pt-12">
        <Link href="/" className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-12">
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div>
              <p className="text-[10px] uppercase font-black text-blue-500 tracking-[0.2em] mb-2">Live Status Tracking</p>
              <h1 className="text-3xl font-black">{task.title}</h1>
              <p className="text-slate-400 text-sm mt-2 flex items-center space-x-2">
                <MapPin size={14} className="text-red-400" />
                <span>Geotagged Location Active</span>
              </p>
            </div>
            <div className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${
              task.status === 'assigned' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {task.status.replace('_', ' ')}
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="relative mb-16 px-4">
            <div className="absolute top-[18px] left-8 right-8 h-0.5 bg-slate-700"></div>
            <div className="flex justify-between relative z-10">
              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step.status === 'completed' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 
                    (step.status === 'current' ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-900 text-slate-600 border border-slate-700')
                  }`}>
                    {step.status === 'completed' ? <CheckCircle2 size={18} /> : step.icon}
                  </div>
                  <span className={`text-[10px] font-bold mt-4 uppercase tracking-tighter text-center max-w-[60px] ${
                    step.status === 'pending' ? 'text-slate-600' : 'text-white'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Volunteer Section */}
          {task.status === 'assigned' ? (
            <div className="bg-slate-900/50 border border-green-500/20 rounded-3xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-green-400">Volunteer Assigned</h3>
                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-ping"></span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl">
                    {task.assigned_volunteer_name?.charAt(0) || 'V'}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{task.assigned_volunteer_name || 'Emergency Responder'}</h4>
                    <p className="text-slate-400 text-sm">ETA: 8-12 Minutes</p>
                  </div>
                </div>
                <a 
                  href={`tel:${task.assigned_volunteer_phone}`}
                  className="bg-green-500 hover:bg-green-400 text-white p-4 rounded-2xl shadow-lg shadow-green-500/20 transition-all hover:scale-110 active:scale-95"
                >
                  <Phone size={24} />
                </a>
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-center space-x-3 text-slate-500">
                <ShieldCheck size={16} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Verified NGO Responder</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-700/50 rounded-3xl p-8 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                <User size={32} />
              </div>
              <p className="text-slate-400 text-sm">Searching for the nearest available volunteer... Our AI is currently matching your needs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
