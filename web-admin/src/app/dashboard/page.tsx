'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Map from '@/components/Map';
import TaskFeed from '@/components/TaskFeed';
import DispatchModal from '@/components/DispatchModal';
import { Activity, Shield, AlertTriangle, ArrowLeft, LogOut, Gavel } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

interface Task {
  id: string;
  task_id: string;
  title: string;
  description: string;
  category: string;
  severity_score: number;
  status: string;
  latitude: number;
  longitude: number;
}

interface Volunteer {
  id: string;
  uid?: string;
  name: string;
  is_available: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [matches, setMatches] = useState<Volunteer[]>([]);
  
  const prevTasksCount = React.useRef(0);

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Successfully authenticated");
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Google Sign-In failed.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.info("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Real-time listener for tasks
  useEffect(() => {
    if (!user) return;

    const mockTasks: Task[] = [
      { id: '1', task_id: '1', title: 'Monsoon Flooding - Mumbai', description: 'Severe urban flooding reported.', category: 'Rescue', severity_score: 10, latitude: 19.0760, longitude: 72.8777, status: 'open' },
      { id: '2', task_id: '2', title: 'Earthquake Relief - Peru', description: 'Massive structural damage.', category: 'Medical', severity_score: 9, latitude: -12.0464, longitude: -77.0428, status: 'open' },
      { id: '3', task_id: '3', title: 'Drought Crisis - Kenya', description: 'Clean water shortage.', category: 'Water', severity_score: 8, latitude: -1.2921, longitude: 36.8219, status: 'open' },
    ];

    const q = query(collection(db, 'tasks'), where('status', 'in', ['open', 'pending_verification', 'assigned']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];

      if (taskList.length > prevTasksCount.current) {
        const newTask = taskList[taskList.length - 1];
        if (prevTasksCount.current > 0) {
          toast.error(`🚨 New Citizen Report: ${newTask.title}`, {
            description: "Urgent verification required!",
            duration: 8000,
          });
          try { new Audio('/alert.mp3').play(); } catch(e) { console.error("Audio failed", e); }
        }
      }
      
      prevTasksCount.current = taskList.length;
      
      if (snapshot.empty && prevTasksCount.current === 0) {
        setTasks(mockTasks);
      } else {
        setTasks(taskList);
      }
    }, (error) => {
      console.error("Firestore error:", error);
      setTasks(mockTasks);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time listener for volunteers
  useEffect(() => {
    if (!user) return;

    const mockVolunteers: Volunteer[] = [
      { id: 'v1', name: 'John Doe', is_available: true, location: { latitude: 40.7128, longitude: -74.0060 } },
      { id: 'v2', name: 'Jane Smith', is_available: true, location: { latitude: 40.7200, longitude: -74.0100 } },
    ];

    const q = query(collection(db, 'volunteers'), where('is_available', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setVolunteers(mockVolunteers);
      } else {
        const volunteerList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Volunteer[];
        setVolunteers(volunteerList);
      }
    }, (error) => {
      console.error("Firestore error:", error);
      setVolunteers(mockVolunteers);
    });

    return () => unsubscribe();
  }, [user]);

  const handleFindMatch = useCallback(async (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/tasks/${task.task_id}/match`);
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setMatches([]);
    }
  }, []);

  const handleDispatch = useCallback(async (volunteer: Volunteer) => {
    if (!selectedTask) return;
    try {
      const taskRef = doc(db, 'tasks', selectedTask.id || selectedTask.task_id);
      await updateDoc(taskRef, {
        status: 'assigned',
        assigned_volunteer_uid: volunteer.uid || volunteer.id,
        assigned_volunteer_name: volunteer.name,
        assigned_volunteer_phone: "+1 (555) 902-3456",
        dispatched_at: new Date().toISOString()
      });
      toast.success(`Dispatched ${volunteer.name} successfully!`);
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error dispatching volunteer:", error);
      toast.error("Dispatch failed.");
    }
  }, [selectedTask]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white font-sans">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white font-sans">
        <Link href="/" className="fixed top-8 left-8 flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>
        
        <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="bg-blue-600/20 p-4 rounded-2xl text-blue-400 mb-6 border border-blue-500/20">
              <Shield size={32} />
            </div>
            <h1 className="text-3xl font-black mb-2">NGO Admin Portal</h1>
            <p className="text-slate-400 text-sm">Secure access for humanitarian coordinators and responders.</p>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-xl transition-all hover:scale-[1.02] active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M24 12.25c0-.85-.07-1.71-.22-2.5H12v4.75h6.75c-.29 1.57-1.18 2.91-2.5 3.8v3.1h4.05c2.37-2.18 3.73-5.38 3.73-8.85z"/>
              <path fill="#FBBC05" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-4.05-3.1c-1.11.75-2.52 1.19-3.9 1.19-3.01 0-5.56-2.03-6.47-4.75H1.42v3.17C3.4 21.6 7.42 24 12 24z"/>
              <path fill="#34A853" d="M5.53 14.43c-.24-.71-.38-1.47-.38-2.25s.14-1.54.38-2.25V6.76H1.42C.51 8.5 0 10.25 0 12s.51 3.5 1.42 5.24l4.11-3.17z"/>
              <path fill="#4285F4" d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.43-3.43C17.96 1.07 15.24 0 12 0 7.42 0 3.4 2.4 1.42 6.76l4.11 3.17c.91-2.72 3.46-4.75 6.47-4.75z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
          
          <div className="mt-10 flex items-center justify-center space-x-2 text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">
            <Gavel size={14} />
            <span>Encrypted Production Gateway</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 shadow-lg z-10">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield size={24} />
            </div>
            <h1 className="font-bold text-xl tracking-tight uppercase text-white">NGO Command Center</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4 px-4 py-1.5 bg-slate-800/50 rounded-full border border-slate-700">
            <div className="flex items-center space-x-2">
              {user.photoURL && (
                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-blue-500/50">
                  <Image src={user.photoURL} alt={user.displayName || "Admin Profile"} fill className="object-cover" />
                </div>
              )}
              <span className="text-xs font-bold text-slate-200">{user.displayName || "Administrator"}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-slate-300">Live: {volunteers.length} Ready</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative bg-slate-200">
          <Map tasks={tasks} />
          <div className="absolute top-4 left-4 flex space-x-4">
            <div className="bg-white/90 backdrop-blur shadow-xl rounded-2xl p-4 border border-white flex items-center space-x-4">
              <div className="bg-red-100 text-red-600 p-3 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Critical Tasks</p>
                <p className="text-2xl font-black text-slate-900">{tasks.filter(t => t.severity_score > 7).length}</p>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur shadow-xl rounded-2xl p-4 border border-white flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Active</p>
                <p className="text-2xl font-black text-slate-900">{tasks.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-[400px] shadow-2xl z-20">
          <TaskFeed tasks={tasks} onFindMatch={handleFindMatch} />
        </div>
      </div>

      <DispatchModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        matches={matches}
        onDispatch={handleDispatch}
        taskTitle={selectedTask?.title || ""}
      />
    </main>
  );
}
