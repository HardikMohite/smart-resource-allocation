'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, googleProvider } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import { Shield, LogOut, Wifi, WifiOff, Zap, PlusCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

// Fix for Leaflet SSR: Dynamic import without SSR
const Map = dynamic(() => import('@/components/Map'), { ssr: false });
const TaskFeed = dynamic(() => import('@/components/TaskFeed'), { ssr: false });
const DispatchModal = dynamic(() => import('@/components/DispatchModal'), { ssr: false });

const MOCK_TASKS: any[] = [
  { id: 'mock-1', task_id: '1', title: 'Monsoon Flooding (Mock)', description: 'Emergency training scenario.', category: 'Rescue', severity_score: 10, latitude: 19.0760, longitude: 72.8777, status: 'open' },
];

const SCENARIOS = [
  { title: "🔴 BUILDING COLLAPSE: SECTOR 4", desc: "Multi-story structure failure reported. Search and rescue active.", cat: "Rescue", lat: 19.2183, lng: 72.9781 },
  { title: "☣️ CHEMICAL LEAK: MIDC AREA", desc: "Hazardous material spill. HAZMAT deployment requested.", cat: "Hazmat", lat: 19.1176, lng: 73.0115 },
  { title: "🏥 MASS CASUALTY: COLABA", desc: "Large scale medical emergency. Multiple ambulances required.", cat: "Medical", lat: 18.9067, lng: 72.8147 },
  { title: "🔥 FOREST FIRE: NATIONAL PARK", desc: "Wildfire spreading toward residential perimeter. Fire crews needed.", cat: "Fire", lat: 19.2288, lng: 72.9182 }
];

const VOLUNTEER_SEEDS = [
  { name: "Officer Rajesh Kumar", lat: 19.0330, lng: 73.0297 },
  { name: "Medic Sarah Chen", lat: 19.1136, lng: 72.8697 },
  { name: "Responder Amit Shah", lat: 19.0760, lng: 72.8777 },
  { name: "Rescue Lead Priya", lat: 19.1860, lng: 72.8485 },
  { name: "Specialist David", lat: 19.0473, lng: 72.8193 }
];

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [tasks, setTasks] = useState<any[]>(MOCK_TASKS);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [scenarioIdx, setScenarioIdx] = useState(0);

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
      const realTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filteredMocks = MOCK_TASKS.filter(m => !realTasks.find(r => r.id === m.id));
      setTasks([...filteredMocks, ...realTasks]);
    }, () => setDbStatus('error'));

    const unsubVolunteers = onSnapshot(collection(db, 'volunteers'), (snap) => {
      const active = snap.docs.map(d => {
        const data = d.data();
        const location = data.location?.latitude 
          ? { latitude: data.location.latitude, longitude: data.location.longitude }
          : data.location;
        return { id: d.id, ...data, location };
      }).filter((v: any) => v.is_available === true);
      setVolunteers(active);
    }, () => {});

    return () => { unsubTasks(); unsubVolunteers(); };
  }, [user]);

  const handleSeedDisaster = async () => {
    try {
      const s = SCENARIOS[scenarioIdx % SCENARIOS.length];
      const id = `emergency-${Date.now()}`;
      await setDoc(doc(db, 'tasks', id), {
        title: s.title,
        description: s.desc,
        category: s.cat,
        severity_score: 10,
        latitude: s.lat,
        longitude: s.lng,
        status: 'open',
        created_at: serverTimestamp()
      });
      setScenarioIdx(prev => prev + 1);
      toast.success(`Broadcasting: ${s.title}`);
    } catch (e) {
      toast.error("Failed to seed emergency.");
    }
  };

  const handleSeedVolunteers = async () => {
    try {
      for (const v of VOLUNTEER_SEEDS) {
        const id = `demo-vol-${Math.random().toString(36).substr(2, 9)}`;
        await setDoc(doc(db, 'volunteers', id), {
          name: v.name,
          phone: "+91 98765 43210",
          is_available: true,
          location: { latitude: v.lat, longitude: v.lng },
          skills: ["First Aid", "Rescue", "Navigation"],
          updated_at: serverTimestamp()
        });
      }
      toast.success("5 Field Responders deployed to the grid!");
    } catch (e) {
      toast.error("Failed to seed volunteers.");
    }
  };

  const handleCancelDispatch = async (task: any) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        status: 'open',
        assigned_volunteer_uid: deleteField(),
        assigned_volunteer_name: deleteField(),
        dispatched_at: deleteField()
      });
      toast.success("Dispatch recalled. Responder notified.");
    } catch (e) {
      toast.error("Cancel failed. Task might be local-only.");
    }
  };

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (e: any) { toast.error(`Login Failed: ${e.message}`); }
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
          <button onClick={handleSeedVolunteers} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-500/20 transition-all font-black text-[10px] uppercase tracking-widest">
            <Users size={14} /> <span>Seed Responders</span>
          </button>
          <button onClick={handleSeedDisaster} className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-red-500/30 transition-all font-black text-[10px] uppercase tracking-widest">
            <PlusCircle size={14} /> <span>Seed Emergency</span>
          </button>
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/5 flex items-center space-x-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-xs font-black uppercase tracking-widest">{volunteers.length} Active</span>
          </div>
          <button onClick={() => signOut(auth)} className="p-3 hover:bg-white/5 rounded-xl transition-colors"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative z-10"><Map tasks={tasks} volunteers={volunteers} /></div>
        <div className="w-[420px] z-30 relative bg-slate-900 border-l border-white/10 shadow-2xl overflow-y-auto">
          <TaskFeed 
            tasks={tasks} 
            onFindMatch={(task) => { setSelectedTask(task); setIsModalOpen(true); }} 
            onCancelDispatch={handleCancelDispatch}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000]"><DispatchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} matches={volunteers.map(v => ({ uid: v.id, name: v.name || "Field Responder", distance_km: 1.2, match_score: 0.95 }))} onDispatch={async (v) => {
          if (!selectedTask) return;
          const taskId = selectedTask.id || `task-${Date.now()}`;
          const update = { 
            status: 'assigned', 
            assigned_volunteer_uid: v.uid, 
            assigned_volunteer_name: v.name || 'Field Responder', 
            dispatched_at: new Date().toISOString(),
            title: selectedTask.title || 'Emergency Mission',
            description: selectedTask.description || '',
            latitude: selectedTask.latitude || 19.0760,
            longitude: selectedTask.longitude || 72.8777
          };
          
          try { 
            await setDoc(doc(db, 'tasks', taskId), update, { merge: true });
            toast.success(`MISSION DISPATCHED: ${v.name} is on the way!`);
            setIsModalOpen(false);
          } catch (e: any) { 
            toast.error(`Sync Error: ${e.message}`); 
          }
        }} taskTitle={selectedTask?.title || ""} /></div>
      )}
    </main>
  );
}
