'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, Send, ArrowLeft, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

export default function ReportPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mockId, setMockId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const generatedId = "demo-" + Math.random().toString(36).substr(2, 9);
      setMockId(generatedId);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white font-sans">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md">
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          {isSubmitted ? (
            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500 py-6">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-400">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-bold mb-3">Report Submitted!</h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Thank you. Our AI is verifying the situation. You can now track your report&apos;s progress and see which volunteer is assigned.
              </p>
              
              <Link 
                href={`/track/${mockId}`}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/20"
              >
                <span>Track My Report</span>
                <ArrowRight size={18} />
              </Link>

              <button 
                onClick={() => setIsSubmitted(false)}
                className="mt-10 text-[10px] text-slate-500 hover:text-slate-400 font-bold uppercase tracking-widest transition-colors"
              >
                Submit another report
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3 mb-8">
                <div className="bg-red-500/10 p-2.5 rounded-xl text-red-400">
                  <ShieldAlert size={24} />
                </div>
                <h1 className="text-2xl font-black">Report an Emergency</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">
                    Upload Photo of the Situation
                  </label>
                  <div className="relative group cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      required
                    />
                    <div className="border-2 border-dashed border-slate-700 group-hover:border-blue-500/50 bg-slate-900/50 rounded-3xl p-12 transition-all flex flex-col items-center justify-center text-slate-500 group-hover:text-blue-400">
                      <Camera size={40} className="mb-4 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-semibold">Tap to capture or upload</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Brief Description (Optional)
                  </label>
                  <textarea 
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                    placeholder="Describe the situation..."
                    rows={3}
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black flex items-center justify-center space-x-3 shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying with AI...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Send to Local NGOs</span>
                    </>
                  )}
                </button>
              </form>
              
              <div className="mt-8 pt-8 border-t border-slate-700/50">
                <p className="text-[10px] text-center text-slate-500 uppercase font-bold tracking-[0.2em]">
                  Secure AI Verification System
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
