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

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (!admin) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ type: 'error', msg: 'All fields are required.' });
      return;
    }
    if (currentPassword !== admin.password) {
      setPasswordStatus({ type: 'error', msg: 'Current password is incorrect.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', msg: 'New password must be at least 6 characters.' });
      return;
    }

    const { updateAdminPassword } = await import('@/lib/auth');
    updateAdminPassword(admin.id, newPassword);
    
    // Update local state to reflect the new password internally
    setAdmin({ ...admin, password: newPassword });
    setPasswordStatus({ type: 'success', msg: 'Password updated successfully!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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

            {/* Change Password Section */}
            <div className="pt-8 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-sky-600" />
                Change Password
              </h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                    placeholder="Enter current password"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                      placeholder="New password"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl transition shadow-sm"
                  >
                    Update Password
                  </button>
                  {passwordStatus && (
                    <span className={`text-xs font-semibold ${passwordStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {passwordStatus.msg}
                    </span>
                  )}
                </div>
              </form>
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
