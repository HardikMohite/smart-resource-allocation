'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Map from '@/components/Map';
import TaskFeed from '@/components/TaskFeed';
import DispatchModal from '@/components/DispatchModal';
import { Activity, Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [matches, setMatches] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Real-time listener for tasks
  useEffect(() => {
    const mockTasks = [
      { id: '1', task_id: '1', title: 'Flood Damage - Area 5', description: 'Major flooding reported near the riverside. Need immediate evacuation assistance.', category: 'Rescue', severity_score: 9, latitude: 40.7128, longitude: -74.0060 },
      { id: '2', task_id: '2', title: 'Medical Supplies Shortage', description: 'Local clinic is running out of basic first aid kits and antibiotics.', category: 'Medical', severity_score: 8, latitude: 40.7306, longitude: -73.9352 },
      { id: '3', task_id: '3', title: 'Power Line Down', description: 'Live wire on the street near public school. Urgent infrastructure repair needed.', category: 'Infrastructure', severity_score: 7, latitude: 40.7589, longitude: -73.9851 },
    ];

    try {
      const q = query(collection(db, 'tasks'), where('status', '==', 'open'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          setTasks(mockTasks);
        } else {
          const taskList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
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
  }, []);

  // Real-time listener for volunteers
  useEffect(() => {
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
  }, []);

  const handleFindMatch = async (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
    setIsLoadingMatches(true);
    
    try {
      // TODO: Replace with actual backend URL when deployed
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

  const handleDispatch = async (volunteer) => {
    if (!selectedTask) return;
    
    try {
      const taskRef = doc(db, 'tasks', selectedTask.id || selectedTask.task_id);
      await updateDoc(taskRef, {
        status: 'assigned',
        assigned_volunteer_uid: volunteer.uid,
        dispatched_at: new Date().toISOString()
      });
      
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error dispatching volunteer:", error);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Navigation Bar */}
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 shadow-lg z-10">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield size={24} />
            </div>
            <h1 className="font-bold text-xl tracking-tight uppercase">NGO Command Center</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-slate-300">Live: {volunteers.length} Volunteers Online</span>
          </div>
          <button className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            System Settings
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Map */}
        <div className="flex-1 relative bg-slate-200">
          <Map tasks={tasks} />
          
          {/* Floating Stats Overlay */}
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

        {/* Right Column: Task Feed */}
        <div className="w-[400px] shadow-2xl z-20">
          <TaskFeed tasks={tasks} onFindMatch={handleFindMatch} />
        </div>
      </div>

      {/* Dispatch Modal */}
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
