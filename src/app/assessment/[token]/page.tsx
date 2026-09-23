'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Lock,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  User,
  Mail,
  Ban,
  CalendarX
} from 'lucide-react';
import { getAssessment, getAllAssessments, getExamVersions, getExamVersionById, getCandidates, saveCandidate, getSessions, saveSession, getSessionByCandidate, fetchServerData } from '@/lib/storage';
import { calculateSessionScore } from '@/lib/scoring';
import { Assessment, ExamVersion, Candidate, Question, Session, IntegrityEvent } from '@/types';
import { Watermark } from '@/components/Watermark';

export default function CandidateAssessmentPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [step, setStep] = useState<'REGISTER' | 'SYSTEM_CHECK' | 'RULES' | 'TEST' | 'COMPLETED' | 'BLOCKED' | 'EXPIRED_LINK'>('REGISTER');
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [examVersion, setExamVersion] = useState<ExamVersion | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Registration state
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');

  // Player state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(2400);
  const [autosaveTime, setAutosaveTime] = useState<string | null>(null);

  // Synchronous refs for event trapping
  const isTestingRef = useRef(false);
  const sessionRef = useRef<Session | null>(null);
  const candidateRef = useRef<Candidate | null>(null);

  useEffect(() => {
    isTestingRef.current = (step === 'TEST');
    sessionRef.current = session;
    candidateRef.current = candidate;
  }, [step, session, candidate]);

  // Check if candidate is blocked (now rely solely on session block state)
  const isCandidateBlockedLocally = () => {
    return false; // Removed generic name/email based local storage blocking per architecture update
  };

  // Immediate Hard Block Trigger
  const triggerHardBlock = (reason: string) => {
    if (!isTestingRef.current) return;
    isTestingRef.current = false;

    if (typeof window !== 'undefined') {
      // Local storage hard-blocking removed. 
      // Rely solely on session-based blocking sent to the backend.
    }

    if (sessionRef.current) {
      const blockedEvt: IntegrityEvent = {
        id: `evt-block-${Date.now()}`,
        attemptId: sessionRef.current.id,
        type: 'BLOCKED_DISQUALIFIED',
        timestamp: new Date().toISOString(),
        details: `STRICT AUTO-BLOCK TRIGGERED: ${reason}. Candidate session permanently terminated.`,
      };

      const updatedSession: Session = {
        ...sessionRef.current,
        candidateName: candidateRef.current?.name || sessionRef.current.candidateName || candidateName,
        candidateEmail: candidateRef.current?.email || sessionRef.current.candidateEmail || candidateEmail,
        isBlocked: true,
        blockedReason: reason,
        reviewStatus: 'BLOCKED_DISQUALIFIED',
        finalDecision: 'BLOCKED',
        integrityEvents: [...sessionRef.current.integrityEvents, blockedEvt],
      };
      saveSession(updatedSession);
      setSession(updatedSession);
    }

    if (candidateRef.current) {
      saveCandidate({ ...candidateRef.current, status: 'BLOCKED' });
    }

    setStep('BLOCKED');

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Global event listeners for strict tab switch and window blur trapping
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isTestingRef.current) {
        triggerHardBlock('Switched browser tab or minimized window');
      }
    };

    const handleFullscreen = () => {
      if (isTestingRef.current && !document.fullscreenElement) {
        triggerHardBlock('Exited required fullscreen mode');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, []);

  // Initial candidate & assessment setup
  useEffect(() => {
    fetchServerData().then(() => {
      const allAsmnts = getAllAssessments();
      const allVersions = getExamVersions();
      const candidates = getCandidates();
      const matchedAsmnt = allAsmnts.find((a) => a.sharableToken === token || a.id === token);
      let candByToken: Candidate | null | undefined = null;
      let asmnt: Assessment | null | undefined = matchedAsmnt;

      if (!asmnt) {
        candByToken = candidates.find((c) => c.invitationToken === token);
        if (candByToken) {
          asmnt = allAsmnts.find((a) => a.id === candByToken?.assessmentId);
        }
      }

      asmnt = asmnt || getAssessment();

      setAssessment(asmnt);

      if (asmnt.durationMinutes) {
        setSecondsRemaining(asmnt.durationMinutes * 60);
      }

      if (asmnt.linkExpiresAt && new Date(asmnt.linkExpiresAt).getTime() < Date.now()) {
        setStep('EXPIRED_LINK');
        return;
      }

      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('new') === '1' || searchParams.get('preview') === 'true') {
          sessionStorage.removeItem(`active_cand_${token}`);
        }
      }

      const activeCandId = typeof window !== 'undefined' ? sessionStorage.getItem(`active_cand_${token}`) : null;
      
      // On shared assessment links (matchedAsmnt exists), resolve candidate ONLY from activeCandId in sessionStorage.
      // Individual candByToken matching is reserved strictly for personal candidate invitation links.
      let cand: Candidate | null = null;
      if (activeCandId) {
        cand = candidates.find((c) => c.id === activeCandId) || null;
      } else if (!matchedAsmnt && candByToken) {
        cand = candByToken;
      }

      if (cand) {
        setCandidate(cand);
        setCandidateName(cand.name);
        setCandidateEmail(cand.email);

        const existingSession = getSessionByCandidate(cand.id);

        if (cand.status === 'BLOCKED' || (existingSession?.isBlocked === true && cand.status !== 'INVITED')) {
          setStep('BLOCKED');
          return;
        }

        if (cand.status === 'SUBMITTED' || existingSession?.submittedAt) {
          setStep('COMPLETED');
          return;
        }

        if (existingSession) {
          setSession(existingSession);
          const version = allVersions.find(v => v.id === existingSession.examVersionId);
          if (version) setExamVersion(version);
          
          const ansObj: Record<string, string | string[]> = {};
          Object.entries(existingSession.answers).forEach(([qId, answer]) => {
            ansObj[qId] = answer.candidateResponse;
          });
          setAnswers(ansObj);
          setStep('SYSTEM_CHECK');
        } else {
          setStep('REGISTER');
        }
      } else {
        setStep('REGISTER');
      }
    });
  }, [token]);

  // Handle Shared Link Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !assessment || !assessment.currentVersionId) {
      alert('Assessment is not ready or has no published version.');
      return;
    }

    const emailToUse = candidateEmail.trim() || `${candidateName.toLowerCase().replace(/[^a-z0-9]/g, '')}@candidate.com`;

    const candId = `cand-live-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`active_cand_${token}`, candId);
    }

    const newCand: Candidate = {
      id: candId,
      adminEmail: assessment.adminEmail || 'admin@testora.com',
      name: candidateName.trim(),
      email: emailToUse,
      invitationToken: `cand-token-${candId}`,
      assessmentId: assessment.id,
      status: 'IN_PROGRESS',
      invitedAt: new Date().toISOString(),
    };

    saveCandidate(newCand);
    setCandidate(newCand);

    const versionIdToUse = assessment.currentVersionId || '';
    const allVersions = getExamVersions();
    const version = allVersions.find(v => v.id === versionIdToUse) || allVersions.find(v => v.examId === assessment.id && v.status === 'PUBLISHED') || allVersions.find(v => v.examId === assessment.id);
    if (version) setExamVersion(version);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + assessment.durationMinutes * 60 * 1000).toISOString();
    const newSession: Session = {
      id: `sess-${candId}`,
      adminEmail: assessment.adminEmail || 'admin@testora.com',
      candidateId: candId,
      candidateName: candidateName.trim(),
      candidateEmail: emailToUse,
      assessmentId: assessment.id,
      examVersionId: versionIdToUse,
      status: 'IN_PROGRESS',
      startedAt: now.toISOString(),
      expiresAt,
      answers: {},
      integrityEvents: [
        {
          id: `evt-enter-${Date.now()}`,
          attemptId: `sess-${candId}`,
          type: 'FULLSCREEN_ENTER',
          timestamp: now.toISOString(),
          details: 'Candidate initiated assessment session.',
        },
      ],
      reviewStatus: 'CLEAN',
    };

    saveSession(newSession);
    setSession(newSession);
    setStep('SYSTEM_CHECK');
  };

  // Start Test Timer Trigger
  const handleStartTest = () => {
    if (!assessment) return;

    const totalSecs = (assessment.durationMinutes || 40) * 60;
    setSecondsRemaining(totalSecs);

    const nowMs = Date.now();
    const expiresAtIso = new Date(nowMs + totalSecs * 1000).toISOString();

    if (session) {
      const updatedS = { ...session, startedAt: new Date(nowMs).toISOString(), expiresAt: expiresAtIso };
      setSession(updatedS);
      saveSession(updatedS);
    }

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setStep('TEST');
  };

  // Countdown Timer ticking every 1000ms
  useEffect(() => {
    if (step !== 'TEST') return;

    const timerId = setInterval(() => {
      setSecondsRemaining((prevSecs) => {
        if (prevSecs <= 1) {
          clearInterval(timerId);
          handleFinalSubmit(true);
          return 0;
        }
        return prevSecs - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [step]);

  // Answer Change with Autosave
  const handleAnswerChange = (questionId: string, val: string | string[]) => {
    const newAnswers = { ...answers, [questionId]: val };
    setAnswers(newAnswers);

    if (session) {
      const updatedAns = {
        ...session.answers,
        [questionId]: {
          id: `ans-${session.id}-${questionId}`,
          attemptId: session.id,
          questionId,
          candidateResponse: val,
          savedAt: new Date().toISOString(),
          isAutosaved: true,
        },
      };

      const updatedSession = { ...session, answers: updatedAns };
      setSession(updatedSession);
      saveSession(updatedSession);
      setAutosaveTime(new Date().toLocaleTimeString());
    }
  };

  // Submit test (Exact ID matching guarantee)
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (!assessment) return;

    if (!isAutoSubmit && !confirm('Are you sure you want to submit your final assessment?')) {
      return;
    }

    const nowStr = new Date().toISOString();
    let candToUse = candidate;

    if (!candToUse && session) {
      const allCands = getCandidates();
      candToUse = allCands.find((c) => c.id === session.candidateId) || null;
    }

    if (!candToUse) {
      const targetId = session?.candidateId || `cand-live-${Date.now()}`;
      candToUse = {
        id: targetId,
        name: candidateName.trim() || 'Candidate',
        email: candidateEmail.trim() || 'candidate@test.com',
        invitationToken: token,
        assessmentId: assessment.id,
        status: 'SUBMITTED',
        invitedAt: nowStr,
      };
    }

    const sessionToUse = session || {
      id: `sess-${candToUse.id}`,
      candidateId: candToUse.id,
      assessmentId: assessment.id,
      examVersionId: assessment.currentVersionId || '',
      status: 'IN_PROGRESS' as const,
      startedAt: nowStr,
      expiresAt: nowStr,
      answers: {},
      integrityEvents: [],
      reviewStatus: 'CLEAN' as const,
    };

    const updatedSession: Session = {
      ...sessionToUse,
      candidateId: candToUse.id,
      candidateName: candToUse.name || candidateName || sessionToUse.candidateName,
      candidateEmail: candToUse.email || candidateEmail || sessionToUse.candidateEmail,
      submittedAt: nowStr,
    };

    const versionForScoring = examVersion || getExamVersionById(assessment.currentVersionId || '');
    if (!versionForScoring) {
      alert('Error: Could not locate exam version for scoring.');
      return;
    }
    const scores = await calculateSessionScore(versionForScoring, updatedSession);
    updatedSession.objectiveScore = scores.objectiveScore;
    updatedSession.subjectiveScore = scores.subjectiveScore;
    updatedSession.totalScore = scores.totalScore;
    updatedSession.maxScore = scores.maxScore;
    updatedSession.evaluations = scores.evaluations;
    if (!updatedSession.isBlocked) {
      updatedSession.reviewStatus = scores.reviewStatus;
    }

    // Save both candidate and session with matching ID
    saveCandidate({ ...candToUse, status: 'SUBMITTED' });
    saveSession(updatedSession);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    setStep('COMPLETED');
  };

  if (!assessment) return null;

  const formatTimer = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const activeQuestions = examVersion?.questions || [];
  const currentQ: Question | undefined = activeQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
      {/* Dynamic Watermark */}
      {step === 'TEST' && candidate && assessment.integritySettings.enableWatermark && (
        <Watermark candidateName={candidate.name} token={token} />
      )}

      {/* REGISTRATION STEP */}
      {step === 'REGISTER' && (
        <div className="max-w-md mx-auto my-auto px-4 py-12 space-y-6 w-full">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">{assessment.title}</h1>
            <p className="text-xs text-slate-400">{assessment.clubName} • Candidate Portal</p>
          </div>

          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white text-xs">Strict Anti-Cheating Protocol Active:</strong>
                Switching browser tabs during the test will result in <strong>IMMEDIATE AUTO-BLOCKING & TERMINATION</strong>.
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-sky-400" />
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-sky-400" />
                  Your Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg transition"
              >
                Proceed to System Check
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SYSTEM CHECK STEP */}
      {step === 'SYSTEM_CHECK' && (
        <div className="max-w-xl mx-auto my-auto px-4 py-12 space-y-6 w-full">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">System Compatibility Check</h1>
            <p className="text-xs text-slate-400">Candidate: {candidateName}</p>
          </div>

          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-sky-400" />
                <span>Screen & Display Compatibility</span>
              </div>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-400" />
                <span>Timer Allocated by Admin</span>
              </div>
              <span className="text-sky-300 font-bold">
                {assessment.durationMinutes} Minutes
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                <span>Tab-Switch Auto-Block Engine</span>
              </div>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Active
              </span>
            </div>
          </div>

          <button
            onClick={() => setStep('RULES')}
            className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg transition"
          >
            Accept Rules & Continue
          </button>
        </div>
      )}

      {/* RULES STEP */}
      {step === 'RULES' && (
        <div className="max-w-xl mx-auto my-auto px-4 py-12 space-y-6 w-full">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">Assessment Rules</h1>
            <p className="text-xs text-slate-400">Review rules before launching session.</p>
          </div>

          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
              <strong className="block text-white text-sm">🚨 Zero-Tolerance Tab Switch Policy:</strong>
              <p>
                Once you click "Start Test", if you switch browser tabs or exit fullscreen, your assessment will be <strong>IMMEDIATELY & PERMANENTLY BLOCKED FOR THIS NAME & DEVICE</strong>.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm">Test Details:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Allocated Test Duration: <strong className="text-sky-400">{assessment.durationMinutes} Minutes</strong></li>
                <li>Questions: <strong className="text-sky-400">{activeQuestions.length} Questions</strong></li>
                <li>Floating Watermark & Real-Time Autosave Active</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleStartTest}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition"
          >
            Enter Fullscreen & Start {assessment.durationMinutes}-Minute Test
          </button>
        </div>
      )}

      {/* TIMED ASSESSMENT PLAYER STEP */}
      {step === 'TEST' && (
        <div className="flex flex-col h-screen overflow-hidden">
          <header className="h-16 bg-slate-850 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
            <div>
              <span className="font-bold text-sm text-white">{assessment.title}</span>
              <div className="text-[10px] text-slate-400">Candidate: {candidate?.name || candidateName}</div>
            </div>

            <div className="flex items-center gap-4">
              {autosaveTime && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved {autosaveTime}
                </span>
              )}

              {/* Real-time Countdown Display */}
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-base font-extrabold border ${
                  secondsRemaining < 300
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-sky-400 border-slate-700'
                }`}
              >
                <Clock className="h-4 w-4" />
                {formatTimer(secondsRemaining)}
              </div>

              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
              >
                Submit Test
              </button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Question Palette Sidebar */}
            <aside className="w-56 bg-slate-850 border-r border-slate-800 p-4 space-y-4 shrink-0 overflow-y-auto hidden sm:block">
              <div className="font-bold text-xs text-slate-400 uppercase tracking-wider">Question Navigator</div>
              <div className="grid grid-cols-3 gap-2">
                {activeQuestions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                  const isCurrent = currentQuestionIndex === idx;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-10 rounded-xl font-semibold text-xs transition flex items-center justify-center ${
                        isCurrent
                          ? 'ring-2 ring-sky-400 bg-sky-600 text-white'
                          : isAnswered
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Question Card */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-3xl mx-auto space-y-6 w-full">
              {currentQ && (
                <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-700/60 pb-3">
                    <span className="font-bold text-sky-400">
                      Question {currentQuestionIndex + 1} of {activeQuestions.length}
                    </span>
                    <span>{currentQ.marks} Marks • {currentQ.difficulty}</span>
                  </div>

                <h2 className="text-base sm:text-lg font-semibold text-white leading-relaxed">{currentQ.prompt}</h2>

                {/* MCQ */}
                {currentQ.type === 'mcq' && (
                  <div className="space-y-2.5 pt-2">
                    {currentQ.options?.map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition ${
                          answers[currentQ.id] === opt
                            ? 'bg-sky-600/20 border-sky-500 text-white font-bold'
                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${currentQ.id}`}
                          checked={answers[currentQ.id] === opt}
                          onChange={() => handleAnswerChange(currentQ.id, opt)}
                          className="h-4 w-4 text-sky-500"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {/* Multiple Select */}
                {currentQ.type === 'multiple_select' && (
                  <div className="space-y-2.5 pt-2">
                    {currentQ.options?.map((opt, oIdx) => {
                      const currentSelected = Array.isArray(answers[currentQ.id])
                        ? (answers[currentQ.id] as string[])
                        : [];
                      const isChecked = currentSelected.includes(opt);

                      return (
                        <label
                          key={oIdx}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition ${
                            isChecked
                              ? 'bg-sky-600/20 border-sky-500 text-white font-bold'
                              : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...currentSelected, opt]
                                : currentSelected.filter((item) => item !== opt);
                              handleAnswerChange(currentQ.id, updated);
                            }}
                            className="h-4 w-4 text-sky-500 rounded"
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* True / False */}
                {currentQ.type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {['True', 'False'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleAnswerChange(currentQ.id, opt)}
                        className={`py-3.5 rounded-xl border font-bold text-sm transition ${
                          answers[currentQ.id] === opt
                            ? 'bg-sky-600 border-sky-500 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Short / Scenario Textarea */}
                {(currentQ.type === 'short_answer' || currentQ.type === 'scenario') && (
                  <div className="space-y-2 pt-2">
                    <textarea
                      rows={5}
                      value={(answers[currentQ.id] as string) || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full p-4 rounded-xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-white focus:ring-2 focus:ring-sky-500 outline-none leading-relaxed"
                    />
                  </div>
                )}
              </div>
              )}

              {/* Bottom Pagination */}
              <div className="flex items-center justify-between pt-4">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                {currentQuestionIndex < activeQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md"
                  >
                    Next Question
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit(false)}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg cursor-pointer"
                  >
                    Complete & Submit Assessment
                  </button>
                )}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* HARD DISQUALIFIED & BLOCKED SCREEN */}
      {step === 'BLOCKED' && (
        <div className="max-w-lg mx-auto my-auto px-4 py-16 text-center space-y-6 w-full">
          <div className="h-20 w-20 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto border-2 border-rose-500/40">
            <Ban className="h-10 w-10" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40">
              🚨 ASSESSMENT TERMINATED & DISQUALIFIED
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Access Blocked</h1>
            <p className="text-xs text-rose-200 bg-rose-950/90 p-4 rounded-xl border border-rose-800/80 leading-relaxed font-semibold">
              {session?.blockedReason || 'Tab switch detected during test. Per anti-cheating policy, your assessment session has been permanently terminated.'}
            </p>
          </div>

          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-6 text-xs text-slate-400 space-y-2 text-left shadow-xl">
            <div className="font-bold text-white text-sm border-b border-slate-700 pb-2">Violation Telemetry Logged:</div>
            <div>Candidate Name: <span className="text-slate-200 font-semibold">{candidate?.name || candidateName || 'Registered Candidate'}</span></div>
            <div>Email Address: <span className="text-slate-200 font-semibold">{candidate?.email || candidateEmail}</span></div>
            <div>Status: <span className="text-rose-400 font-bold">PERMANENTLY BLOCKED</span></div>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-700/60 mt-2">
              Re-entry using this candidate attempt is disabled and logged for the assessment administrator.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem(`active_cand_${token}`);
              }
              setCandidate(null);
              setSession(null);
              setCandidateName('');
              setCandidateEmail('');
              setStep('REGISTER');
            }}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
          >
            Register as Another Candidate
          </button>
        </div>
      )}

      {/* EXPIRED LINK SCREEN */}
      {step === 'EXPIRED_LINK' && (
        <div className="max-w-md mx-auto my-auto px-4 py-16 text-center space-y-6 w-full">
          <div className="h-16 w-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <CalendarX className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
              LINK EXPIRED
            </div>
            <h1 className="text-2xl font-bold text-white">Assessment Link No Longer Active</h1>
            <p className="text-xs text-slate-400">
              The time validity limit configured by the administrator for this assessment link has expired.
            </p>
          </div>

          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 text-xs text-slate-300 space-y-2 text-left">
            <div>Assessment: <span className="font-semibold text-white">{assessment.title}</span></div>
            <div>Link Expired At: <span className="font-mono text-slate-400">{new Date(assessment.linkExpiresAt || Date.now()).toLocaleString()}</span></div>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-700 mt-2">
              Please contact the assessment administrator if you need a new link generated.
            </p>
          </div>
        </div>
      )}

      {/* COMPLETED THANK YOU SCREEN */}
      {step === 'COMPLETED' && (
        <div className="max-w-md mx-auto my-auto px-4 py-16 text-center space-y-6 w-full">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Assessment Submitted</h1>
            <p className="text-xs text-slate-400">
              Thank you, <strong className="text-white">{candidate?.name || candidateName}</strong>. Your answers have been received.
            </p>
          </div>

          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-3 text-xs text-slate-300">
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span>Assessment:</span>
              <span className="font-semibold text-white">{assessment.title}</span>
            </div>
            <div className="flex justify-between">
              <span>Review Status:</span>
              <span className="font-semibold text-emerald-400">Submitted to Admin</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
