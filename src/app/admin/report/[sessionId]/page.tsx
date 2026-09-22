'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  User,
  Save,
  MessageSquare,
  Activity,
  Download,
  FileDown
} from 'lucide-react';
import { fetchServerData, getAssessment, getCandidates, getSessionById, saveSession } from '@/lib/storage';
import { Assessment, Candidate, Session } from '@/types';

export default function SessionReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadReportData = async () => {
      await fetchServerData();
      const s = getSessionById(resolvedParams.sessionId);
      if (s) {
        setSession(s);
        setNotes(s.reviewerNotes || '');
        const candidates = getCandidates();
        let c = candidates.find((item) => item.id === s.candidateId);
        if (!c) {
          c = {
            id: s.candidateId,
            name: s.candidateName || 'Candidate',
            email: s.candidateEmail || 'N/A',
            invitationToken: s.candidateId,
            assessmentId: s.assessmentId,
            status: 'SUBMITTED',
            invitedAt: s.startedAt,
          };
        }
        setCandidate(c);
        setAssessment(getAssessment());
      }
    };

    loadReportData();
  }, [resolvedParams.sessionId]);

  if (!session || !candidate || !assessment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Submission Report Not Found</h1>
        <p className="text-xs text-slate-500">Session ID {resolvedParams.sessionId} could not be located in local database.</p>
        <Link href="/admin" className="inline-block px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold">
          Back to Admin Dashboard
        </Link>
      </div>
    );
  }

  const handleDecisionChange = (decision: 'ACCEPTED' | 'REJECTED' | 'PENDING') => {
    const updated = { ...session, finalDecision: decision };
    setSession(updated);
    saveSession(updated);
  };

  const handleSaveNotes = () => {
    const updated = { ...session, reviewerNotes: notes };
    setSession(updated);
    saveSession(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Download Candidate Answers File
  const handleDownloadAnswersFile = () => {
    let content = `====================================================\n`;
    content += `CANDIDATE ASSESSMENT ANSWERS REPORT\n`;
    content += `====================================================\n\n`;
    content += `Candidate Name : ${candidate.name}\n`;
    content += `Email Address  : ${candidate.email}\n`;
    content += `Session Token  : ${candidate.invitationToken}\n`;
    content += `Assessment     : ${assessment.title}\n`;
    content += `Submitted At   : ${session.submittedAt ? new Date(session.submittedAt).toLocaleString() : 'N/A'}\n`;
    content += `Total Score    : ${session.totalScore} / ${session.maxScore || 50} Marks\n`;
    content += `Review Status  : ${session.reviewStatus}\n`;
    content += `Final Decision : ${session.finalDecision || 'PENDING'}\n\n`;
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
    link.download = `${candidate.name.replace(/[^a-z0-9]/gi, '_')}_Answers_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const focusLostEvents = session.integrityEvents.filter((e) => e.type === 'FOCUS_LOST');
  const pasteEvents = session.integrityEvents.filter((e) => e.type === 'CLIPBOARD_PASTE');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Submission & Answers</h1>
            <p className="text-xs text-slate-500 font-mono">Candidate: {candidate.name} ({candidate.email})</p>
          </div>
        </div>

        {/* Action Controls: Download File & Decision */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleDownloadAnswersFile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition"
          >
            <FileDown className="h-4 w-4" />
            Download Answers File (.txt)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDecisionChange('ACCEPTED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                session.finalDecision === 'ACCEPTED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              ACCEPT
            </button>
            <button
              onClick={() => handleDecisionChange('REJECTED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                session.finalDecision === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <XCircle className="h-3.5 w-3.5" />
              REJECT
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Candidate Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            <User className="h-4 w-4 text-sky-600" />
            Candidate Details
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-bold text-slate-900 text-base">{candidate.name}</p>
            <p className="text-slate-600">{candidate.email}</p>
            <p className="text-slate-400 font-mono text-[11px] pt-1">Token: {candidate.invitationToken}</p>
            <p className="text-slate-500 pt-1">Submitted: {new Date(session.submittedAt || '').toLocaleString()}</p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Score Breakdown
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Pass Target: {assessment.passingPercentage}%
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900">{session.totalScore}</span>
            <span className="text-slate-400 text-sm font-semibold">/ {session.maxScore || 50} Marks</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">Objective:</span> {session.objectiveScore || 0} pts
            </div>
            <div>
              <span className="font-semibold text-slate-800">AI Rubric:</span> {session.subjectiveScore || 0} pts
            </div>
          </div>
        </div>

        {/* Integrity Telemetry Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              Integrity Telemetry
            </span>
          </div>

          <div className="space-y-2">
            {session.isBlocked || session.reviewStatus === 'BLOCKED_DISQUALIFIED' ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                AUTO-BLOCKED & DISQUALIFIED
              </div>
            ) : session.reviewStatus === 'CLEAN' ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                CLEAN TELEMETRY RECORD
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                NEEDS REVIEW
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviewer Notes Editor */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-sky-600" />
            Admin Reviewer Notes
          </span>
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600">Saved Notes!</span>
          )}
        </div>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add comments on candidate performance..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSaveNotes}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
          >
            <Save className="h-3.5 w-3.5" />
            Save Notes
          </button>
        </div>
      </div>

      {/* Answer-by-Answer Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">
            Candidate Submitted Answers ({assessment.questions.length} Questions)
          </h2>
          <button
            onClick={handleDownloadAnswersFile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 font-semibold text-xs hover:bg-sky-100 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Download Answers
          </button>
        </div>

        <div className="space-y-6">
          {assessment.questions.map((q, idx) => {
            const answer = session.answers[q.id];
            const evaluation = session.evaluations?.[q.id];
            const candidateResp = answer?.candidateResponse;
            const respStr = Array.isArray(candidateResp) ? candidateResp.join(', ') : candidateResp || 'No response';

            return (
              <div key={q.id} className="p-4 rounded-xl border border-slate-200 space-y-3 text-xs bg-slate-50/50">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 pb-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Q{idx + 1}: {q.prompt}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                        {q.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">Skill: {q.skillTag} • Difficulty: {q.difficulty}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">
                      {evaluation ? evaluation.score : 0} / {q.marks} Marks
                    </span>
                  </div>
                </div>

                {/* Candidate response box */}
                <div className="space-y-1 bg-white p-3.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 text-[11px] block">Submitted Answer:</span>
                  <p className="text-slate-900 font-mono text-xs whitespace-pre-wrap">{respStr}</p>
                </div>

                {/* Rubric evaluation feedback */}
                {evaluation && (
                  <div className="bg-sky-50/70 p-3 rounded-lg border border-sky-200 space-y-1">
                    <div className="flex items-center justify-between text-sky-900 font-semibold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                        AI Rubric Feedback
                      </span>
                      <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">
                        Confidence: {evaluation.confidence}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs">{evaluation.rubricFeedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
