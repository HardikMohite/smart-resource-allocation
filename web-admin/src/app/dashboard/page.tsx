"use client";
// src/app/dashboard/page.tsx  (REPLACE existing file)
// Auth is now handled by middleware — this page only renders for authenticated users.

import React, { useState, useEffect, useCallback } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Map from "@/components/Map";
import TaskFeed from "@/components/TaskFeed";
import DispatchModal from "@/components/DispatchModal";
import { Shield, LogOut, Wifi, WifiOff, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const MOCK_TASKS: any[] = [
  { id: "1", task_id: "1", title: "Monsoon Flooding - Mumbai",  description: "Severe urban flooding.", category: "Rescue", severity_score: 10, latitude: 19.076, longitude: 72.8777, status: "open" },
  { id: "2", task_id: "2", title: "Earthquake Relief - Peru",    description: "Massive structural damage.", category: "Medical", severity_score: 9, latitude: -12.0464, longitude: -77.0428, status: "open" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [dbStatus, setDbStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [tasks, setTasks] = useState<any[]>(MOCK_TASKS);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  useEffect(() => {
    const unsubTasks = onSnapshot(
      collection(db, "tasks"),
      (snap) => {
        setDbStatus("connected");
        if (!snap.empty) setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => setDbStatus("error")
    );

    const unsubVolunteers = onSnapshot(
      collection(db, "volunteers"),
      (snap) => {
        setVolunteers(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((v: any) => v.is_available === true)
        );
      },
      () => {}
    );

    return () => { unsubTasks(); unsubVolunteers(); };
  }, []);

  return (
    <main className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-xl z-50">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Shield size={24} />
            </div>
            <h1 className="font-black text-xl tracking-tighter uppercase italic">SmartRelief</h1>
          </div>

          <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
            dbStatus === "connected"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : dbStatus === "error"
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-blue-500/10 border-blue-500/20 text-blue-400"
          }`}>
            {dbStatus === "connected" ? <Wifi size={14} /> : dbStatus === "error" ? <WifiOff size={14} /> : <Zap size={14} />}
            <span>Status: {dbStatus}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <span className="text-xs text-slate-400 font-medium hidden sm:block">
              {user.name}
            </span>
          )}
          <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-white/5 flex items-center space-x-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            <span className="text-xs font-black uppercase tracking-widest">{volunteers.length} Ready</span>
          </div>
          <button
            onClick={logout}
            className="p-3 hover:bg-white/5 rounded-xl transition-colors"
            title="Sign out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative z-10">
          <Map tasks={tasks} volunteers={volunteers} />
        </div>
        <div className="w-[420px] z-30 relative bg-slate-900 border-l border-white/10 shadow-2xl">
          <TaskFeed
            tasks={tasks}
            onFindMatch={(task) => { setSelectedTask(task); setIsModalOpen(true); }}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000]">
          <DispatchModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            matches={volunteers.map((v) => ({
              uid: v.id,
              name: v.name,
              distance_km: 1.2,
              match_score: 0.95,
            }))}
            onDispatch={async (v) => {
              const update = {
                status: "assigned",
                assigned_volunteer_name: v.name,
                dispatched_at: new Date().toISOString(),
              };
              setTasks((ts) => ts.map((t) => (t.id === selectedTask.id ? { ...t, ...update } : t)));
              if (dbStatus === "connected") {
                await updateDoc(doc(db, "tasks", selectedTask.id), update);
              }
              toast.success("Dispatch Signal Sent!");
              setIsModalOpen(false);
            }}
            taskTitle={selectedTask?.title || ""}
          />
        </div>
      )}
    </main>
  );
}
