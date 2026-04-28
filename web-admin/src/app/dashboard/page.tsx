'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, doc, setDoc, updateDoc, getDocs } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, googleProvider } from '@/lib/firebase';
import Map from '@/components/Map';
import TaskFeed from '@/components/TaskFeed';
import DispatchModal from '@/components/DispatchModal';
import { Shield, AlertTriangle, LogOut, Users, Wifi, WifiOff, Play, Zap } from 'lucide-react';
import { toast } from 'sonner';

const MOCK_TASKS: any[] = [
  { id: '1', task_id: '1', title: 'Monsoon Flooding - Mumbai', description: 'Severe urban flooding reported.', category: 'Rescue', severity_score: 10, latitude: 19.0760, longitude: 72.8777, status: 'open' },
  { id: '2', task_id: '2', title: 'Earthquake Relief - Peru', description: 'Massive structural damage.', category: 'Medical', severity_score: 9, latitude: -12.0464, longitude: -77.0428, status: 'open' },
];

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error' | 'simulation'>('connecting');
  const [tasks, setTasks] = useState<any[]>(MOCK_TASKS);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Simulation Mode logic
  const startSimulation = () => {
    setDbStatus('simulation');
    setVolunteers([
      { id: 'sim1', name: 'Rescue Unit 01', location: { latitude: 19.08, longitude: 72.88 }, is_available: true },
      { id: 'sim2', name: 'Medical Response', location: { latitude: 19.07, longitude: 72.89 }, is_available: true }
    ]);
    toast.success("Presentation Mode Activated: Simulated Sync Live");
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { getRedirectResult } = await import('firebase/auth');
        await getRedirectResult(auth);
      } catch (error) {
        console.error("Redirect Result Error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      if (u) setUser(u); 
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || dbStatus === 'simulation') return;
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      setDbStatus('connected');
      if (!snap.empty) setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => setDbStatus('error'));

    const unsubVolunteers = onSnapshot(collection(db, 'volunteers'), (snap) => {
      const active = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((v: any) => v.is_available === true);
      setVolunteers(active);
    }, () => {});

    return () => { unsubTasks(); unsubVolunteers(); };
  }, [user, dbStatus]);

  const handleGoogleLogin = async () => {
    try {
      const { signInWithRedirect } = await import('firebase/auth');
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      toast.error("Google Auth Failed - Use Demo Mode");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center animate-pulse"><Shield className="text-blue-500 animate-bounce" size={48} /></div>;

  if (!user) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl text-center">
        <div className="bg-blue-500/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/30">
          <Shield className="text-blue-400" size={40} />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Command Center</h1>
        <p className="text-slate-400 mb-10 text-sm font-medium">Real-time Emergency Coordination</p>
        
        <button onClick={handleGoogleLogin} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black flex items-center justify-center space-x-3 mb-4 hover:scale-[1.02] transition-transform">
          <Zap size={18} fill="currentColor" /> <span>Sign in with Google</span>
        </button>

        <button onClick={() => { setUser({ displayName: "Admin" }); startSimulation(); }} className="w-full bg-blue-600/20 text-blue-400 border border-blue-500/30 py-4 rounded-2xl font-black flex items-center justify-center space-x-3 hover:bg-blue-600/30 transition-all">
          <Play size={18} fill="currentColor" /> <span>Launch Demo Simulation</span>
        </button>
      </div>
    </div>
  );

  return (
    <main className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-xl z-50">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20"><Shield size={24} /></div>
            <h1 className="font-black text-xl tracking-tighter uppercase italic">SmartRelief</h1>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${dbStatus === 'connected' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
             {dbStatus === 'connected' ? <Wifi size={14} /> : <Zap size={14} />} <span>Status: {dbStatus}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-white/5 flex items-center space-x-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-xs font-black uppercase tracking-widest">{volunteers.length} Ready</span>
          </div>
          <button onClick={() => signOut(auth).then(() => window.location.reload())} className="p-3 hover:bg-white/5 rounded-xl transition-colors"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative z-10"><Map tasks={tasks} volunteers={volunteers} /></div>
        <div className="w-[420px] z-30 relative bg-slate-900 border-l border-white/10 shadow-2xl">
          <TaskFeed tasks={tasks} onFindMatch={(task) => { setSelectedTask(task); setIsModalOpen(true); }} />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000]"><DispatchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} matches={volunteers.map(v => ({ uid: v.id, name: v.name, distance_km: 1.2, match_score: 0.95 }))} onDispatch={async (v) => {
          const update = { status: 'assigned', assigned_volunteer_name: v.name, dispatched_at: new Date().toISOString() };
          setTasks(ts => ts.map(t => t.id === selectedTask.id ? {...t, ...update} : t));
          if (dbStatus === 'connected') await updateDoc(doc(db, 'tasks', selectedTask.id), update);
          toast.success("Dispatch Signal Sent!");
          setIsModalOpen(false);
        }} taskTitle={selectedTask?.title || ""} /></div>
      )}
    </main>
  );
}
