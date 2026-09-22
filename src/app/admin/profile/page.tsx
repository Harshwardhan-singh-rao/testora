'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentAdmin, logoutAdmin } from '@/lib/auth';
import { AdminUser } from '@/types';
import { UserCircle, ShieldCheck, Mail, Calendar, LogOut, ShieldAlert } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function AdminProfilePage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    const active = getCurrentAdmin();
    if (!active || (active.status === 'PENDING_APPROVAL' && active.role !== 'SUPER_ADMIN') || active.status === 'REJECTED') {
      router.push('/admin/login');
      return;
    }
    setAdmin(active);
  }, [router]);

  const handleLogout = () => {
    logoutAdmin();
    router.push('/admin/login');
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <UserCircle className="h-8 w-8 text-sky-600" />
            My Profile
          </h1>
          <p className="text-slate-500 mt-2">Manage your account details and view your access level.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-8">
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-3xl shadow-inner">
                  {admin.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{admin.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{admin.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 ${
                  admin.role === 'SUPER_ADMIN' 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-sky-100 text-sky-800 border border-sky-300'
                }`}>
                  {admin.role === 'SUPER_ADMIN' ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  {admin.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'ADMIN'}
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {admin.status}
                </span>
              </div>
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold">
                  {admin.name}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold">
                  {admin.email}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account ID</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-mono text-xs">
                  {admin.id}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Joined</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {new Date(admin.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 font-bold text-sm transition"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
