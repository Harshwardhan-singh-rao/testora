'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Mail,
  Play,
  ArrowLeft,
  Search,
  Unlock,
  RotateCcw
} from 'lucide-react';
import { getCandidates, saveCandidate, getSessions } from '@/lib/storage';
import { getAssessmentUrl } from '@/lib/url';
import { Candidate } from '@/types';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCandidates(getCandidates());
  }, []);

  const clearLocalBlockCacheForEmail = (email: string) => {
    if (typeof window === 'undefined') return;
    try {
      const blockedEmails = JSON.parse(localStorage.getItem('clubselect_blocked_emails') || '[]');
      const updated = blockedEmails.filter((e: string) => e.toLowerCase() !== email.toLowerCase());
      localStorage.setItem('clubselect_blocked_emails', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    // Clear previous block lock for this email so admin can test cleanly
    clearLocalBlockCacheForEmail(newEmail.trim());

    const token = `token-${newName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newCand: Candidate = {
      id: `cand-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      invitationToken: token,
      assessmentId: 'asmnt-tech-club-2026',
      status: 'INVITED',
      invitedAt: new Date().toISOString(),
    };

    saveCandidate(newCand);
    setCandidates(getCandidates());
    setNewName('');
    setNewEmail('');
  };

  const handleClearAllBlockLocks = () => {
    if (confirm('Clear all local browser block locks so you can test candidate links freely?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('clubselect_blocked_tokens');
        localStorage.removeItem('clubselect_blocked_emails');
        localStorage.removeItem('clubselect_blocked_names');
      }
      alert('Local block cache cleared. Candidate links can now be launched for testing!');
    }
  };

  const copyToClipboard = (token: string) => {
    const fullUrl = getAssessmentUrl(token);
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.invitationToken.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Invitations & Test Launcher</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Generate unique invitation links and launch test sessions.
            </p>
          </div>
        </div>

        <button
          onClick={handleClearAllBlockLocks}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition"
        >
          <Unlock className="h-4 w-4" />
          Clear Testing Block Lock Cache
        </button>
      </div>

      {/* Add candidate form card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Plus className="h-5 w-5 text-sky-600" />
          Invite New Candidate
        </h2>

        <form onSubmit={handleAddCandidate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Candidate Full Name</label>
            <input
              type="text"
              placeholder="e.g. Maya Lin"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none mt-1"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              placeholder="e.g. maya@university.edu"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none mt-1"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition"
            >
              Generate Unique Invitation
            </button>
          </div>
        </form>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">Invited Candidates ({candidates.length})</h2>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Invitation Link</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No candidates found.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" />
                        {c.email}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-semibold select-all">
                          {c.invitationToken}
                        </span>
                        <button
                          onClick={() => copyToClipboard(c.invitationToken)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="Copy Full Assessment Link"
                        >
                          {copiedToken === c.invitationToken ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {c.status === 'SUBMITTED' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                          SUBMITTED
                        </span>
                      )}
                      {c.status === 'BLOCKED' && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                          BLOCKED
                        </span>
                      )}
                      {c.status === 'INVITED' && (
                        <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 text-[11px] font-semibold">
                          INVITED
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/assessment/${c.invitationToken}`}
                        onClick={() => clearLocalBlockCacheForEmail(c.email)}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Launch Test
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
