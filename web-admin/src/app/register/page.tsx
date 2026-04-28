"use client";
// src/app/register/page.tsx

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ─── password policy rules ────────────────────────────────────────────────────

interface Rule { label: string; test: (p: string) => boolean }

const RULES: Rule[] = [
  { label: "At least 8 characters",            test: (p) => p.length >= 8 },
  { label: "One uppercase letter (A–Z)",        test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a–z)",        test: (p) => /[a-z]/.test(p) },
  { label: "One number (0–9)",                  test: (p) => /\d/.test(p) },
  { label: "One special character (!@#$…)",     test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function strengthLabel(passed: number): { text: string; color: string } {
  if (passed <= 1) return { text: "Very weak",  color: "bg-red-500" };
  if (passed === 2) return { text: "Weak",       color: "bg-orange-500" };
  if (passed === 3) return { text: "Fair",       color: "bg-yellow-500" };
  if (passed === 4) return { text: "Strong",     color: "bg-blue-500" };
  return              { text: "Very strong", color: "bg-green-500" };
}

// ─── component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [form, setForm] = useState({
    name: "",
    age: "",
    phone: "",
    email: "",
    gender: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword]        = useState(false);
  const [showConfirm, setShowConfirm]          = useState(false);
  const [error, setError]                      = useState("");
  const [loading, setLoading]                  = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  // live password analysis
  const ruleResults = useMemo(() => RULES.map((r) => r.test(form.password)), [form.password]);
  const passedCount = ruleResults.filter(Boolean).length;
  const { text: strengthText, color: strengthColor } = strengthLabel(passedCount);
  const isPasswordStrong = passedCount === RULES.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isPasswordStrong) {
      setError("Please meet all password requirements before continuing.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      await refreshUser();
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all";
  const labelClass =
    "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2";

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-white font-sans">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md py-8">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-10">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
            <Shield size={24} />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">SmartRelief</span>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          <h1 className="text-2xl font-black mb-1 uppercase tracking-tighter">Create Account</h1>
          <p className="text-slate-400 text-sm mb-8">Join the SmartRelief network</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={set("name")}
                placeholder="Jane Doe"
                className={inputClass}
              />
            </div>

            {/* Age + Gender row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Age</label>
                <input
                  type="number"
                  required
                  min={13}
                  max={120}
                  value={form.age}
                  onChange={set("age")}
                  placeholder="25"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select
                  required
                  value={form.gender}
                  onChange={set("gender")}
                  className={inputClass + " appearance-none"}
                >
                  <option value="" disabled>Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                type="tel"
                required
                autoComplete="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set("password")}
                  placeholder="••••••••"
                  className={inputClass + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-1 mb-2">
                    {RULES.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i < passedCount ? strengthColor : "bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">{strengthText}</p>

                  {/* Rule checklist */}
                  <div className="space-y-1.5">
                    {RULES.map((rule, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {ruleResults[i] ? (
                          <CheckCircle2 size={13} className="text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle size={13} className="text-slate-600 flex-shrink-0" />
                        )}
                        <span className={`text-[11px] ${ruleResults[i] ? "text-slate-300" : "text-slate-500"}`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className={labelClass}>Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  placeholder="••••••••"
                  className={
                    inputClass +
                    " pr-12 " +
                    (form.confirmPassword && form.confirmPassword !== form.password
                      ? "border-red-500/50 focus:ring-red-500/40"
                      : "")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <p className="text-red-400 text-[11px] mt-1.5">Passwords do not match</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isPasswordStrong}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-600/20 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
