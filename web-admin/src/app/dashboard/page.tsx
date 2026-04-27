'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Map from '@/components/Map';
import TaskFeed from '@/components/TaskFeed';
import DispatchModal from '@/components/DispatchModal';
import { Activity, Shield, AlertTriangle, ArrowLeft, Lock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [matches, setMatches] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  
  const prevTasksCount = React.useRef(0);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      setError("");
      toast.success("Welcome back, Commander.");
    } else {
      setError("Unauthorized access. Incorrect credentials.");
      toast.error("Access Denied");
    }
  };

  // Real-time listener for tasks
  useEffect(() => {
    if (!isAuthenticated) return;

    const mockTasks = [
      { id: '1', task_id: '1', title: 'Monsoon Flooding - Mumbai', description: 'Severe urban flooding reported. Emergency rescue teams requested.', category: 'Rescue', severity_score: 10, latitude: 19.0760, longitude: 72.8777 },
      { id: '2', task_id: '2', title: 'Earthquake Relief - Peru', description: 'Massive structural damage. Urgent need for medical supplies and trauma care.', category: 'Medical', severity_score: 9, latitude: -12.0464, longitude: -77.0428 },
      { id: '3', task_id: '3', title: 'Drought Crisis - Kenya', description: 'Clean water shortage in remote village. NGO coordination required for supply run.', category: 'Water', severity_score: 8, latitude: -1.2921, longitude: 36.8219 },
    ];

    try {
      const q = query(collection(db, 'tasks'), where('status', 'in', ['open', 'pending_verification', 'assigned']));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const taskList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (taskList.length > prevTasksCount.current) {
          const newTask = taskList[taskList.length - 1];
          if (prevTasksCount.current > 0) {
            toast.error(`🚨 New Citizen Report: ${newTask.title}`, {
              description: "Urgent verification required!",
              duration: 8000,
            });
            try { new Audio('/alert.mp3').play(); } catch(e) {}
          }
        }
        
        prevTasksCount.current = taskList.length;
        
        if (snapshot.empty && prevTasksCount.current === 0) {
          setTasks(taskList.length > 0 ? taskList : mockTasks);
        } else {
          setTasks(taskList);
        }
      }, (error) => {
        console.error("Firestore error:", error);
        setTasks(mockTasks);
      });
      return () => unsubscribe();
    } catch (e) {
      setTasks(mockTasks);
    }
  }, [isAuthenticated]);

  // Real-time listener for volunteers
  useEffect(() => {
    if (!isAuthenticated) return;

    const mockVolunteers = [
      { id: 'v1', name: 'John Doe', is_available: true, location: { latitude: 40.7128, longitude: -74.0060 } },
      { id: 'v2', name: 'Jane Smith', is_available: true, location: { latitude: 40.7200, longitude: -74.0100 } },
    ];

    try {
      const q = query(collection(db, 'volunteers'), where('is_available', '==', true));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          setVolunteers(mockVolunteers);
        } else {
          const volunteerList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setVolunteers(volunteerList);
        }
      }, (error) => {
        console.error("Firestore error:", error);
        setVolunteers(mockVolunteers);
      });
      return () => unsubscribe();
    } catch (e) {
      setVolunteers(mockVolunteers);
    }
  }, [isAuthenticated]);

  const handleFindMatch = async (task: any) => {
    setSelectedTask(task);
    setIsModalOpen(true);
    setIsLoadingMatches(true);
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/tasks/${task.task_id}/match`);
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setMatches([]);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleDispatch = async (volunteer: any) => {
    if (!selectedTask) return;
    try {
      const taskRef = doc(db, 'tasks', (selectedTask as any).id || (selectedTask as any).task_id);
      await updateDoc(taskRef, {
        status: 'assigned',
        assigned_volunteer_uid: volunteer.uid || volunteer.id,
        assigned_volunteer_name: volunteer.name,
        assigned_volunteer_phone: "+1 (555) 902-3456", // Mock phone for demo
        dispatched_at: new Date().toISOString()
      });
      toast.success(`Dispatched ${volunteer.name} successfully!`);
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error dispatching volunteer:", error);
      toast.error("Dispatch failed. Please check connection.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white font-sans">
        <Link href="/" className="fixed top-8 left-8 flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>
        
        <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-blue-600/20 p-4 rounded-2xl text-blue-400 mb-6 border border-blue-500/20">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-black mb-2">NGO Admin Access</h1>
            <p className="text-slate-400 text-sm">Enter administrative credentials to access the Command Center.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-center text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-mono tracking-widest"
                autoFocus
              />
              {error && <p className="text-red-400 text-xs mt-3 text-center font-bold uppercase tracking-wider">{error}</p>}
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02]"
            >
              <span>Login to System</span>
              <ChevronRight size={20} />
            </button>
          </form>
          
          <p className="mt-8 text-[10px] text-center text-slate-500 uppercase font-bold tracking-[0.2em]">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col h-screen bg-slate-50 overflow-hidden">
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
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-slate-300">Live: {volunteers.length} Volunteers Online</span>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors text-white"
          >
            Logout
          </button>
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
                <p className="text-2xl font-black text-slate-900">{tasks.filter((t: any) => t.severity_score > 7).length}</p>
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
        taskTitle={(selectedTask as any)?.title || ""}
      />
    </main>
  );
}
