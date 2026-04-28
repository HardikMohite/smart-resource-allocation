'use client';

import React from 'react';
import Link from 'next/link';
import { Send, Users, Globe, Zap, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30">
      <Navbar />

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-8">
            <Zap size={14} />
            <span>Google Solution Challenge 2026 Entry</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Empowering Communities & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Accelerating Relief.</span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-12 max-w-2xl leading-relaxed">
            Our AI-driven triage system transforms unstructured field data into actionable tasks, 
            connecting victims with local volunteers through optimized geospatial matching.
          </p>

          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link 
              href="/login"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all hover:scale-105 shadow-xl shadow-blue-600/20"
            >
              <Users size={20} />
              <span>NGO Command Center</span>
            </Link>
            
            <Link 
              href="/report"
              className="w-full sm:w-auto bg-transparent border-2 border-slate-700 hover:border-slate-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all hover:bg-slate-800"
            >
              <Send size={20} />
              <span>Citizen Reporting Portal</span>
            </Link>
          </div>
        </div>

        {/* Features Preview */}
        <div id="technology" className="mt-32 grid md:grid-cols-3 gap-8 scroll-mt-24">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-8 rounded-3xl">
            <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-blue-400">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">AI-Driven Triage</h3>
            <p className="text-slate-400 leading-relaxed">
              Gemini 1.5 Pro instantly analyzes messy images and survey text to determine severity and needs.
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-8 rounded-3xl">
            <div className="bg-indigo-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-indigo-400">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Geospatial Matching</h3>
            <p className="text-slate-400 leading-relaxed">
              Optimized Haversine matching connects the nearest available volunteers to critical zones instantly.
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-8 rounded-3xl">
            <div className="bg-teal-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-teal-400">
              <ArrowRight size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Real-time Coordination</h3>
            <p className="text-slate-400 leading-relaxed">
              Live Firestore synchronization ensures every second counts when lives are on the line.
            </p>
          </div>
        </div>
      </main>

      {/* Impact Section */}
      <section id="impact" className="relative z-10 max-w-7xl mx-auto px-8 py-32 border-t border-slate-800/50 scroll-mt-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">Driving Global <span className="text-blue-500">Impact</span></h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Our platform is aligned with the United Nations Sustainable Development Goals to create a more resilient future.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-600/10 p-6 rounded-3xl mb-6 border border-blue-500/20">
              <span className="text-3xl font-bold text-blue-500">11</span>
            </div>
            <h4 className="font-bold mb-2 text-white">Sustainable Cities</h4>
            <p className="text-sm text-slate-400 leading-relaxed">Reducing disaster response times by 40% in urban environments.</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-indigo-600/10 p-6 rounded-3xl mb-6 border border-indigo-500/20">
              <span className="text-3xl font-bold text-indigo-500">13</span>
            </div>
            <h4 className="font-bold mb-2 text-white">Climate Action</h4>
            <p className="text-sm text-slate-400 leading-relaxed">Managing critical resource allocation during extreme weather events.</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="bg-teal-600/10 p-6 rounded-3xl mb-6 border border-teal-500/20">
              <span className="text-3xl font-bold text-teal-500">17</span>
            </div>
            <h4 className="font-bold mb-2 text-white">Global Partnerships</h4>
            <p className="text-sm text-slate-400 leading-relaxed">Bridging the gap between international NGOs and local volunteers.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 px-8 z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
          <p>© 2026 SmartRelief AI. Built for the Google Solution Challenge.</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="https://github.com/neev21-alt/smart-resource-allocation" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}