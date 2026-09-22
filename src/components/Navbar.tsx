'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, FilePlus, RotateCcw, Menu, X, LogOut, UserCheck, Users } from 'lucide-react';
import { resetToSeedData } from '@/lib/storage';
import { getCurrentAdmin, logoutAdmin } from '@/lib/auth';
import { AdminUser } from '@/types';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    setCurrentAdmin(getCurrentAdmin());
  }, [pathname]);

  // Hide top navigation completely when taking assessment or on login page
  if (pathname.startsWith('/assessment') || pathname === '/admin/login') {
    return null;
  }

  const handleLogout = () => {
    logoutAdmin();
    setCurrentAdmin(null);
    router.push('/admin/login');
  };

  const handleResetData = () => {
    if (confirm('Reset all assessments, questions, candidates, and blocked sessions to default initial state?')) {
      resetToSeedData();
      window.location.reload();
    }
  };

  const navLinks = [
    { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { href: '/admin/builder', label: 'Question Builder', icon: FilePlus },
    ...(currentAdmin?.role === 'SUPER_ADMIN' ? [{ href: '/admin/manage', label: 'Manage Admins', icon: Users }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand */}
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <img 
            src="/testora-logo.jpg" 
            alt="Testora Logo" 
            className="h-9 w-9 rounded-lg shadow-sm object-cover border border-slate-200 group-hover:shadow-md transition" 
          />
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Testora Admin</span>
            <span className="hidden sm:inline-block ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
              Strict Anti-Cheat Mode Active
            </span>
          </div>
        </Link>

        {/* Desktop Nav (Only Admin Dashboard & Question Builder) */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions & Admin User Info */}
        <div className="hidden md:flex items-center gap-3">
          {currentAdmin && (
            <Link 
              href="/admin/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-xs text-slate-700 font-medium"
              title="View My Profile"
            >
              <span className="font-bold text-slate-900">{currentAdmin.name}</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                currentAdmin.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-sky-100 text-sky-800 border border-sky-300'
              }`}>
                {currentAdmin.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'ADMIN'}
              </span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            title="Sign Out of Admin Portal"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 hover:bg-rose-50 border border-rose-200 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <Link
              href="/admin/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <UserCheck className="h-5 w-5" />
              My Profile
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleResetData();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg text-slate-700 border border-slate-200 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Demo Data
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
