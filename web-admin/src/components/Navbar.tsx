'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Menu, X, ArrowRight, Globe } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Report Emergency', href: '/report' },
    { name: 'Technology', href: '#technology' },
    { name: 'Impact', href: '#impact' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#0f172a]/80 backdrop-blur-lg border-b border-slate-800 py-3' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
            <Shield size={24} className="text-white" />
          </div>
          <span className="font-black text-xl tracking-tight uppercase text-white">
            SmartRelief <span className="text-blue-500">AI</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-10">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center space-x-6">
          <a 
            href="https://github.com/neev21-alt/smart-resource-allocation" 
            target="_blank" 
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Globe size={20} />
          </a>
          <Link 
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all hover:shadow-lg hover:shadow-blue-600/20"
          >
            <span>Launch App</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#0f172a] border-b border-slate-800 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col p-6 space-y-4">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-bold text-slate-300 hover:text-white"
              >
                {link.name}
              </Link>
            ))}
            <Link 
              href="/dashboard"
              className="bg-blue-600 text-white p-4 rounded-2xl font-bold text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Launch Command Center
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
