'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
} from 'lucide-react';
import { fetchServerData } from '@/lib/storage';
import { getCurrentAdmin, getAdminUsers, updateAdminStatus, createSuperAdmin } from '@/lib/auth';
import { AdminUser } from '@/types';

export default function AdminManagePage() {
  const router = useRouter();
  const [adminUsers, setAdminUsersState] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdminState] = useState<AdminUser | null>(null);

  const [newSuperAdminName, setNewSuperAdminName] = useState('');
  const [newSuperAdminEmail, setNewSuperAdminEmail] = useState('');
  const [newSuperAdminPassword, setNewSuperAdminPassword] = useState('');
  const [createSuperAdminStatus, setCreateSuperAdminStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const refreshData = async () => {
    await fetchServerData();
    const active = getCurrentAdmin();
    if (!active || active.role !== 'SUPER_ADMIN') {
      router.push('/admin');
      return;
    }
    setCurrentAdminState(active);
    setAdminUsersState(getAdminUsers());
  };

  useEffect(() => {
    refreshData();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', refreshData);
      const timer = setInterval(refreshData, 15000);
      return () => {
        window.removeEventListener('focus', refreshData);
        clearInterval(timer);
      };
    }
  }, []);

  const handleCreateSuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSuperAdminStatus(null);
    if (!newSuperAdminName || !newSuperAdminEmail || !newSuperAdminPassword) {
      setCreateSuperAdminStatus({ type: 'error', msg: 'All fields are required.' });
      return;
    }
    const res = createSuperAdmin(newSuperAdminName, newSuperAdminEmail, newSuperAdminPassword);
    if (res.success) {
      setCreateSuperAdminStatus({ type: 'success', msg: 'Super Admin created successfully.' });
      setNewSuperAdminName('');
      setNewSuperAdminEmail('');
      setNewSuperAdminPassword('');
      refreshData();
    } else {
      setCreateSuperAdminStatus({ type: 'error', msg: res.error || 'Failed to create.' });
    }
  };

  if (!currentAdmin || currentAdmin.role !== 'SUPER_ADMIN') return null;

  const pendingAdminUsers = adminUsers.filter((u) => u.status === 'PENDING_APPROVAL' && u.role !== 'SUPER_ADMIN');
  const allSuperAdmins = adminUsers.filter((u) => u.role === 'SUPER_ADMIN');
  const approvedAdmins = adminUsers.filter((u) => u.role === 'ADMIN' && u.status === 'APPROVED');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Users className="h-7 w-7 text-amber-600" />
          Admin Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage super admins, approve new admin sign-ups, and view all team members.
        </p>
      </div>

      {/* Create Super Admin Form */}
      <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm bg-gradient-to-r from-amber-50/50 to-orange-50/30 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Add New Super Admin
        </h3>
        <form onSubmit={handleCreateSuperAdmin} className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Name</label>
            <input type="text" value={newSuperAdminName} onChange={e => setNewSuperAdminName(e.target.value)} placeholder="e.g. Jane Doe" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <input type="email" value={newSuperAdminEmail} onChange={e => setNewSuperAdminEmail(e.target.value)} placeholder="admin@domain.com" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <input type="text" value={newSuperAdminPassword} onChange={e => setNewSuperAdminPassword(e.target.value)} placeholder="Secure password" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
          <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition whitespace-nowrap h-[34px] shadow-sm">
            Create Account
          </button>
        </form>
        {createSuperAdminStatus && (
          <div className={`mt-2 p-2 rounded-lg text-xs font-semibold ${createSuperAdminStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            {createSuperAdminStatus.msg}
          </div>
        )}
      </div>

      {/* All Super Admins */}
      <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          All Super Admins
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold border border-amber-300">
            {allSuperAdmins.length}
          </span>
        </h3>
        {allSuperAdmins.length === 0 ? (
          <p className="text-xs text-slate-500">No super admins found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 rounded-xl border border-slate-200 overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Date Added</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allSuperAdmins.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 inline-flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        Super Admin
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approved Admins */}
      <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-emerald-600" />
          Approved Admins
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-300">
            {approvedAdmins.length}
          </span>
        </h3>
        {approvedAdmins.length === 0 ? (
          <p className="text-xs text-slate-500">No approved admins yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 rounded-xl border border-slate-200 overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Date Joined</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedAdmins.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Admin Sign-Ups */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Pending Admin Sign-Ups
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold border border-amber-300">
            {pendingAdminUsers.length}
          </span>
        </h3>
        {pendingAdminUsers.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200/80">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 inline mr-1.5" />
            No pending admin sign-up requests. All admin accounts verified.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 rounded-xl border border-slate-200 overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Applicant Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingAdminUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Awaiting Approval
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          updateAdminStatus(u.id, 'APPROVED');
                          refreshData();
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          updateAdminStatus(u.id, 'REJECTED');
                          refreshData();
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-sm"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
