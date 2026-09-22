'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  AlertTriangle,
  Download,
  Share2,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Plus,
  ExternalLink,
  Unlock,
  FileDown,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  User
} from 'lucide-react';
import { fetchServerData, getAssessment, getCandidates, getSessions, saveCandidate, saveSession } from '@/lib/storage';
import { getAssessmentUrl } from '@/lib/url';
import { getCurrentAdmin, getAdminUsers, updateAdminStatus, logoutAdmin } from '@/lib/auth';
import { AdminUser, Assessment, Candidate, Session } from '@/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [adminUsers, setAdminUsersState] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdminState] = useState<AdminUser | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [newSuperAdminName, setNewSuperAdminName] = useState('');
  const [newSuperAdminEmail, setNewSuperAdminEmail] = useState('');
  const [newSuperAdminPassword, setNewSuperAdminPassword] = useState('');
  const [createSuperAdminStatus, setCreateSuperAdminStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSuperAdminStatus(null);
    if (!newSuperAdminName || !newSuperAdminEmail || !newSuperAdminPassword) {
      setCreateSuperAdminStatus({ type: 'error', msg: 'All fields are required.' });
      return;
    }
    const { createSuperAdmin } = await import('@/lib/auth');
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

  const refreshData = async () => {
    await fetchServerData();

    const active = getCurrentAdmin();
    if (!active) {
      router.push('/admin/login');
      return;
    }

    if ((active.status === 'PENDING_APPROVAL' && active.role !== 'SUPER_ADMIN') || active.status === 'REJECTED') {
      router.push('/admin/login');
      return;
    }

    setCurrentAdminState(active);
    setAdminUsersState(getAdminUsers());

    // Super Admin sees ALL data; regular admins only see their own
    const isSuperAdmin = active.role === 'SUPER_ADMIN';
    setAssessment(getAssessment(isSuperAdmin ? undefined : active.email));
    setCandidates(getCandidates(isSuperAdmin ? undefined : active.email));
    setSessions(getSessions(isSuperAdmin ? undefined : active.email));
  };

  useEffect(() => {
    let isRefreshing = false;
    const safeRefresh = async () => {
      if (isRefreshing) return;
      isRefreshing = true;
      try {
        await refreshData();
      } finally {
        isRefreshing = false;
      }
    };

    safeRefresh();

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', safeRefresh);
      window.addEventListener('storage', safeRefresh);
      const timer = setInterval(safeRefresh, 15000);

      return () => {
        window.removeEventListener('focus', safeRefresh);
        window.removeEventListener('storage', safeRefresh);
        clearInterval(timer);
      };
    }
  }, []);

  if (!assessment) return null;

  // Merge sessions & registered candidates so EVERY attempt is visible in admin
  const completedSessions = (() => {
    const sMap = new Map<string, Session>();
    sessions.forEach((s) => sMap.set(s.candidateId, s));

    const result: Session[] = [...sessions];
    candidates.forEach((c) => {
      if (!sMap.has(c.id)) {
        result.push({
          id: `sess-${c.id}`,
          candidateId: c.id,
          candidateName: c.name,
          candidateEmail: c.email,
          assessmentId: c.assessmentId,
          startedAt: c.invitedAt,
          expiresAt: c.invitedAt,
          answers: {},
          integrityEvents: [],
          reviewStatus: c.status === 'BLOCKED' ? 'BLOCKED_DISQUALIFIED' : 'CLEAN',
          isBlocked: c.status === 'BLOCKED',
          submittedAt: c.status === 'SUBMITTED' ? c.invitedAt : undefined,
        });
      }
    });
    return result;
  })();

  const cleanSessions = completedSessions.filter((s) => (s.reviewStatus === 'CLEAN' || !s.reviewStatus) && !s.isBlocked);
  const blockedSessions = completedSessions.filter((s) => s.isBlocked || s.reviewStatus === 'BLOCKED_DISQUALIFIED');
  const needsReviewSessions = completedSessions.filter((s) => (s.reviewStatus === 'NEEDS_REVIEW' || s.reviewStatus === 'HIGH_RISK_REVIEW') && !s.isBlocked);

  const sharableToken = assessment.sharableToken || 'live-test-link';
  const mainSharableUrl = getAssessmentUrl(sharableToken);
  const openTestUrl = getAssessmentUrl(sharableToken, { isNew: true });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mainSharableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleUnblockCandidate = (session: Session) => {
    if (confirm('Unblock this candidate and allow re-testing?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('clubselect_blocked_tokens');
        localStorage.removeItem('clubselect_blocked_emails');
        localStorage.removeItem('clubselect_blocked_names');
      }

      const updatedS: Session = {
        ...session,
        isBlocked: false,
        reviewStatus: 'NEEDS_REVIEW',
        finalDecision: 'PENDING',
      };
      saveSession(updatedS);

      const c = candidates.find((cand) => cand.id === session.candidateId);
      if (c) {
        saveCandidate({ ...c, status: 'INVITED' });
      }

      setSessions(getSessions());
      setCandidates(getCandidates());
      alert('Candidate unblocked successfully.');
    }
  };

  const downloadCandidateAnswers = (session: Session) => {
    if (!assessment) return;

    const candidate = candidates.find((c) => c.id === session.candidateId);
    const candName = candidate?.name || session.candidateName || 'Candidate';
    const candEmail = candidate?.email || session.candidateEmail || 'N/A';

    let content = `====================================================\n`;
    content += `CANDIDATE ASSESSMENT ANSWERS REPORT\n`;
    content += `====================================================\n\n`;
    content += `Candidate Name : ${candName}\n`;
    content += `Email Address  : ${candEmail}\n`;
    content += `Assessment     : ${assessment.title}\n`;
    content += `Submitted At   : ${session.submittedAt ? new Date(session.submittedAt).toLocaleString() : 'N/A'}\n`;
    content += `Total Score    : ${session.totalScore} / ${session.maxScore || 50} Marks\n`;
    content += `Status         : ${session.isBlocked ? 'AUTO-BLOCKED (Tab Switch)' : session.reviewStatus}\n\n`;
    content += `----------------------------------------------------\n`;
    content += `SUBMITTED ANSWERS BREAKDOWN:\n`;
    content += `----------------------------------------------------\n\n`;

    assessment.questions.forEach((q, idx) => {
      const ans = session.answers[q.id];
      const evalRes = session.evaluations?.[q.id];
      const respStr = Array.isArray(ans?.candidateResponse) ? ans.candidateResponse.join(', ') : ans?.candidateResponse || 'No response submitted';

      content += `[Q${idx + 1}] (${q.type.toUpperCase()}) ${q.prompt}\n`;
      content += `Marks: ${evalRes ? evalRes.score : 0} / ${q.marks}\n`;
      content += `Candidate Answer:\n${respStr}\n`;
      if (evalRes?.rubricFeedback) {
        content += `AI Rubric Evaluation: ${evalRes.rubricFeedback}\n`;
      }
      content += `\n----------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${candName.replace(/[^a-z0-9]/gi, '_')}_Answers.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredSessions = completedSessions.filter((s) => {
    const candidate = candidates.find((c) => c.id === s.candidateId);
    const nameStr = (candidate?.name || s.candidateName || 'Candidate').toLowerCase();
    const emailStr = (candidate?.email || s.candidateEmail || '').toLowerCase();
    const qStr = searchQuery.toLowerCase();

    const matchesSearch = nameStr.includes(qStr) || emailStr.includes(qStr) || s.id.toLowerCase().includes(qStr);

    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'BLOCKED') return s.isBlocked || s.reviewStatus === 'BLOCKED_DISQUALIFIED';
    if (filterStatus === 'CLEAN') return (s.reviewStatus === 'CLEAN' || !s.reviewStatus) && !s.isBlocked;
    if (filterStatus === 'NEEDS_REVIEW') return (s.reviewStatus === 'NEEDS_REVIEW' || s.reviewStatus === 'HIGH_RISK_REVIEW') && !s.isBlocked;
    return true;
  });

  const exportCSV = () => {
    const headers = ['Session ID', 'Candidate Name', 'Email', 'Objective Score', 'Subjective Score', 'Total Score', 'Max Marks', 'Review Status', 'Final Decision', 'Is Blocked'];
    const rows = completedSessions.map((s) => {
      const candidate = candidates.find((c) => c.id === s.candidateId);
      const candName = candidate?.name || s.candidateName || 'Candidate';
      const candEmail = candidate?.email || s.candidateEmail || 'N/A';
      return [
        s.id,
        `"${candName}"`,
        `"${candEmail}"`,
        s.objectiveScore || 0,
        s.subjectiveScore || 0,
        s.totalScore || 0,
        s.maxScore || 50,
        s.reviewStatus,
        s.finalDecision || 'PENDING',
        s.isBlocked ? 'YES' : 'NO',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ClubSelect_All_Submissions_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  const pendingAdminUsers = adminUsers.filter((u) => u.status === 'PENDING_APPROVAL' && u.role !== 'SUPER_ADMIN');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{assessment.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {assessment.clubName} • {assessment.questions.length} Questions ({assessment.questions.reduce((a, b) => a + b.marks, 0)} Marks) • Test Timer: {assessment.durationMinutes} Mins
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
          >
            {copiedLink ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copiedLink ? 'Copied Test Link!' : 'Copy Sharable Link'}
          </button>

          <Link
            href={openTestUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition"
          >
            Open Test <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <Link
            href="/admin/builder"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition"
          >
            <Plus className="h-4 w-4" />
            Edit Questions ({assessment.questions.length})
          </Link>
        </div>
      </div>

      {/* SUPER ADMIN VERIFICATION PANEL (Visible to Super Admin) */}
      {currentAdmin?.role === 'SUPER_ADMIN' && (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm space-y-4 bg-gradient-to-r from-amber-50/50 to-orange-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Admin Sign-Up Verifications
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold border border-amber-300">
                    {pendingAdminUsers.length} Pending
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Super Admin Approval Portal: Verify and grant admin access to new sign-ups.</p>
              </div>
            </div>
          </div>

          {/* Create Super Admin Form */}
          <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Add New Super Admin
            </h4>
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
              <div className={`mt-3 p-2 rounded-lg text-xs font-semibold ${createSuperAdminStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {createSuperAdminStatus.msg}
              </div>
            )}
          </div>

          {pendingAdminUsers.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 inline mr-1.5" />
              No pending admin sign-up requests. All admin accounts verified.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 bg-white rounded-xl border border-slate-200 overflow-hidden">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Applicant Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Request Date</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4 text-right">Super Admin Action</th>
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
                          Approve Admin
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
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Submissions</span>
            <FileText className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{completedSessions.length}</div>
          <p className="text-[11px] text-slate-500">Total candidate attempts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Clean Passed</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{cleanSessions.length}</div>
          <p className="text-[11px] text-emerald-700">Zero tab switches</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Auto-Blocked</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">{blockedSessions.length}</div>
          <p className="text-[11px] text-rose-700">Caught & Disqualified</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Needs Review</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{needsReviewSessions.length}</div>
          <p className="text-[11px] text-amber-700">Minor events</p>
        </div>
      </div>

      {/* Candidate Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Student Submissions & Downloadable Answers</h3>
            <p className="text-xs text-slate-500">View candidate scores and download their submitted answer files.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <Download className="h-4 w-4" />
              Export All CSV
            </button>

            <div className="relative flex-1 sm:w-56">
              <input
                type="text"
                placeholder="Search candidate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium">
              {['ALL', 'CLEAN', 'BLOCKED', 'NEEDS_REVIEW'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterStatus === status ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-y border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Scores</th>
                <th className="py-3.5 px-4">Anti-Cheat Status</th>
                <th className="py-3.5 px-4">Decision</th>
                <th className="py-3.5 px-4 text-right">Actions & Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No submissions found.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const candidate = candidates.find((c) => c.id === session.candidateId);

                  const candName = candidate?.name || session.candidateName || 'Candidate';
                  const candEmail = candidate?.email || session.candidateEmail || 'N/A';
                  const candToken = candidate?.invitationToken || session.candidateId;

                  return (
                    <tr key={session.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{candName}</div>
                        <div className="text-slate-500 text-[11px]">{candEmail}</div>
                        <div className="text-slate-400 text-[10px] font-mono mt-0.5">ID: {candToken}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-slate-900">{session.totalScore}</span>
                          <span className="text-slate-400 font-medium">/ {session.maxScore || 50} pts</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {session.isBlocked || session.reviewStatus === 'BLOCKED_DISQUALIFIED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                            AUTO-BLOCKED (Tab Switch)
                          </span>
                        ) : session.reviewStatus === 'CLEAN' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            CLEAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            NEEDS REVIEW
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {session.finalDecision === 'ACCEPTED' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            ACCEPTED
                          </span>
                        )}
                        {session.finalDecision === 'REJECTED' && (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                            REJECTED
                          </span>
                        )}
                        {session.finalDecision === 'BLOCKED' && (
                          <span className="px-2 py-0.5 rounded bg-rose-900 text-rose-100 text-[11px] font-bold">
                            DISQUALIFIED
                          </span>
                        )}
                        {(!session.finalDecision || session.finalDecision === 'PENDING') && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">
                            PENDING
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => downloadCandidateAnswers(session)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold transition border border-emerald-200"
                          title="Download candidate answers text file"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          Download Answers
                        </button>
                        {session.isBlocked && (
                          <button
                            onClick={() => handleUnblockCandidate(session)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 text-[11px] font-bold transition"
                            title="Unblock candidate for re-testing"
                          >
                            <Unlock className="h-3 w-3" />
                            Unblock
                          </button>
                        )}
                        <Link
                          href={`/admin/report/${session.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold transition"
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
