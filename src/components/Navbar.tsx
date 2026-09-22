'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, FilePlus, RotateCcw, Menu, X } from 'lucide-react';
import { resetToSeedData } from '@/lib/storage';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide top navigation completely when taking assessment
  if (pathname.startsWith('/assessment')) {
    return null;
  }

  const handleResetData = () => {
    if (confirm('Reset all assessments, questions, candidates, and blocked sessions to default initial state?')) {
      resetToSeedData();
      window.location.reload();
    }
  };

  const navLinks = [
    { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { href: '/admin/builder', label: 'Question Builder', icon: FilePlus },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand */}
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white shadow-md group-hover:bg-sky-700 transition">
            <ShieldCheck className="h-5 w-5" />
          </div>
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

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={handleResetData}
            title="Reset storage to initial seed data"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Data
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
          <div className="pt-2 border-t border-slate-100">
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
