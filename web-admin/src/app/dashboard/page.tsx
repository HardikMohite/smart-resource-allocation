'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, signOut, GoogleAuthProvider } from 'firebase/auth';
import { db, auth, googleProvider } from '@/lib/firebase';
import Map from '@/components/Map';
import TaskFeed from '@/components/TaskFeed';
import DispatchModal from '@/components/DispatchModal';
import { Shield, LogOut, Wifi, WifiOff, Zap } from 'lucide-react';
import { toast } from 'sonner';

const MOCK_TASKS: any[] = [
  { id: '1', task_id: '1', title: 'Monsoon Flooding - Mumbai', description: 'Severe urban flooding reported.', category: 'Rescue', severity_score: 10, latitude: 19.0760, longitude: 72.8777, status: 'open' },
  { id: '2', task_id: '2', title: 'Earthquake Relief - Peru', description: 'Massive structural damage.', category: 'Medical', severity_score: 9, latitude: -12.0464, longitude: -77.0428, status: 'open' },
];

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [tasks, setTasks] = useState<any[]>(MOCK_TASKS);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      setDbStatus('connected');
      if (!snap.empty) setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => setDbStatus('error'));

    const unsubVolunteers = onSnapshot(collection(db, 'volunteers'), (snap) => {
      const active = snap.docs.map(d => {
        const data = d.data();
        const location = data.location?.latitude 
          ? { latitude: data.location.latitude, longitude: data.location.longitude }
          : data.location;
        return { id: d.id, ...data, location };
      }).filter((v: any) => v.is_available === true);
      
      console.log(`🚀 [SYNC] Received ${active.length} active responders.`);
      setVolunteers(active);
    }, () => {});

    return () => { unsubTasks(); unsubVolunteers(); };
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      toast.error(`Login Failed: ${error.message}`);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><Shield className="text-blue-500 animate-bounce" size={48} /></div>;

  if (!user) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl text-center">
        <div className="bg-blue-500/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/30">
          <Shield className="text-blue-400" size={40} />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Command Center</h1>
        <p className="text-slate-400 mb-10 text-sm font-medium">Real-time Emergency Coordination</p>
        <button onClick={handleGoogleLogin} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black flex items-center justify-center space-x-3 hover:scale-[1.02] transition-transform shadow-xl">
          <Zap size={18} fill="currentColor" /> <span>Sign in with Google</span>
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
          <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${dbStatus === 'connected' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
             {dbStatus === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />} <span>{dbStatus}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-white/5 flex items-center space-x-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-xs font-black uppercase tracking-widest">{volunteers.length} Active</span>
          </div>
          <button onClick={() => signOut(auth)} className="p-3 hover:bg-white/5 rounded-xl transition-colors"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative z-10"><Map tasks={tasks} volunteers={volunteers} /></div>
        <div className="w-[420px] z-30 relative bg-slate-900 border-l border-white/10 shadow-2xl overflow-y-auto">
          <TaskFeed tasks={tasks} onFindMatch={(task) => { setSelectedTask(task); setIsModalOpen(true); }} />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000]"><DispatchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} matches={volunteers.map(v => ({ uid: v.id, name: v.name, distance_km: 1.2, match_score: 0.95 }))} onDispatch={async (v) => {
          const update = { status: 'assigned', assigned_volunteer_uid: v.uid, assigned_volunteer_name: v.name, dispatched_at: new Date().toISOString() };
          setTasks(ts => ts.map(t => t.id === selectedTask.id ? {...t, ...update} : t));
          toast.success(`MISSION DISPATCHED: ${v.name} is on the way!`);
          setIsModalOpen(false);
          try { await updateDoc(doc(db, 'tasks', selectedTask.id), update); } catch (e) { console.log("Demo Mode: Local sync."); }
        }} taskTitle={selectedTask?.title || ""} /></div>
      )}
    </main>
  );
}
