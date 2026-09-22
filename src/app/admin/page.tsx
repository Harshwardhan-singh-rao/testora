'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  FileDown
} from 'lucide-react';
import { fetchServerData, getAssessment, getCandidates, getSessions, saveCandidate, saveSession } from '@/lib/storage';
import { Assessment, Candidate, Session } from '@/types';

export default function AdminDashboardPage() {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [hostIp, setHostIp] = useState<string>('192.168.29.154');

  const refreshData = async () => {
    await fetchServerData();
    setAssessment(getAssessment());
    setCandidates(getCandidates());
    setSessions(getSessions());
  };

  useEffect(() => {
    refreshData();

    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        setHostIp(hostname);
      }

      window.addEventListener('focus', refreshData);
      window.addEventListener('storage', refreshData);
      const timer = setInterval(refreshData, 2000);

      return () => {
        window.removeEventListener('focus', refreshData);
        window.removeEventListener('storage', refreshData);
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
  const port = typeof window !== 'undefined' ? window.location.port || '3000' : '3000';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

  const mainSharableUrl = `${protocol}//${hostIp}:${port}/assessment/${sharableToken}`;

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
  };

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
            href={`${mainSharableUrl}?new=1`}
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
