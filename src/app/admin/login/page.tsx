'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, UserCheck, Lock, Mail, User, Clock, ArrowRight, ShieldAlert, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { getCurrentAdmin, loginAdmin, signUpAdmin, logoutAdmin } from '@/lib/auth';
import { fetchServerData } from '@/lib/storage';
import { AdminUser } from '@/types';

export default function AdminLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'LOGIN' | 'SUPER_ADMIN' | 'SIGNUP'>('LOGIN');
  const [currentAdmin, setCurrentAdminState] = useState<AdminUser | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'register' || params.get('tab') === 'signup') {
        setTab('SIGNUP');
      } else if (params.get('mode') === 'superadmin' || params.get('role') === 'superadmin') {
        setTab('SUPER_ADMIN');
      }
    }

    fetchServerData().then(() => {
      const active = getCurrentAdmin();
      if (active) {
        setCurrentAdminState(active);
        if (active.status === 'APPROVED' || active.role === 'SUPER_ADMIN') {
          router.push('/admin');
        }
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await loginAdmin(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to login');
      return;
    }

    if (res.user) {
      setCurrentAdminState(res.user);
      if (res.user.status === 'APPROVED' || res.user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      }
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    const res = signUpAdmin(name, email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to create account.');
      return;
    }

    if (res.user) {
      setCurrentAdminState(res.user);
      setSuccessMsg('Account registered! Awaiting Super Admin verification.');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setCurrentAdminState(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <img 
          src="/testora-logo.jpg" 
          alt="Testora Logo" 
          className="inline-block h-16 w-16 rounded-2xl shadow-lg border border-slate-700 object-cover" 
        />
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Testora Admin Portal</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Super-Admin Verified Assessment & Examination System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 backdrop-blur rounded-3xl border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* PENDING APPROVAL NOTICE FOR LOGGED IN ADMIN */}
          {currentAdmin && currentAdmin.status === 'PENDING_APPROVAL' && currentAdmin.role !== 'SUPER_ADMIN' ? (
            <div className="text-center space-y-6 py-4">
              <div className="h-16 w-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 animate-pulse">
                <Clock className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  <UserCheck className="h-3.5 w-3.5" />
                  Awaiting Super Admin Verification
                </span>
                <h2 className="text-xl font-bold text-white">Account Under Verification</h2>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-700">
                  Welcome, <strong className="text-white">{currentAdmin.name}</strong> ({currentAdmin.email}).
                  Your admin sign-up request has been submitted to the Super Admin. You will be able to access the dashboard as soon as your account is verified.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition"
                >
                  Check Verification Status
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition"
                >
                  Sign Out / Change Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* TAB SWITCHER */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setTab('LOGIN');
                    setErrorMsg(null);
                  }}
                  className={`py-2 rounded-lg transition text-[11px] ${
                    tab === 'LOGIN' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Admin Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('SUPER_ADMIN');
                    setErrorMsg(null);
                  }}
                  className={`py-2 rounded-lg transition text-[11px] flex items-center justify-center gap-1 ${
                    tab === 'SUPER_ADMIN' ? 'bg-amber-600 text-white shadow' : 'text-amber-400/80 hover:text-amber-300'
                  }`}
                >
                  <ShieldCheck className="h-3 w-3" />
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('SIGNUP');
                    setErrorMsg(null);
                  }}
                  className={`py-2 rounded-lg transition text-[11px] ${
                    tab === 'SIGNUP' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* MESSAGES */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* ADMIN LOGIN FORM */}
              {tab === 'LOGIN' && (
                <form onSubmit={handleLogin} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-sky-400" />
                      Admin Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. admin@institution.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-sky-400" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
                  >
                    Log In to Admin Portal
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* SUPER ADMIN LOGIN FORM */}
              {tab === 'SUPER_ADMIN' && (
                <form onSubmit={handleLogin} className="space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Super Admin Master Access & Verification Portal</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-amber-400" />
                      Super Admin Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter super admin email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      Super Admin Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter super admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-amber-500/40 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Log In as Super Admin
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* SIGN UP FORM */}
              {tab === 'SIGNUP' && (
                <form onSubmit={handleSignUp} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-sky-400" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maya Lin"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-sky-400" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. maya@institution.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-sky-400" />
                      Create Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Choose a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700 text-[11px] text-slate-400 space-y-1">
                    <strong className="text-slate-300 block font-semibold">Super Admin Verification Rule:</strong>
                    <p>
                      Your sign-up request will be submitted to the Super Admin for approval. You will receive access upon verification.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition"
                  >
                    Submit Admin Sign-Up Request
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
