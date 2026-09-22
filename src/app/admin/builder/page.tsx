'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Save,
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Timer,
  Calendar,
  Share2,
  Check,
  Copy,
  ExternalLink,
  LayoutDashboard,
  X
} from 'lucide-react';
import { getAssessment, saveAssessment } from '@/lib/storage';
import { Assessment, Question, QuestionType } from '@/types';

export default function AssessmentBuilderPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDoneModal, setShowDoneModal] = useState(false);
  const [copiedModalLink, setCopiedModalLink] = useState(false);
  const [hostIp, setHostIp] = useState('192.168.29.154');

  useEffect(() => {
    setAssessment(getAssessment());
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        setHostIp(hostname);
      }
    }
  }, []);

  if (!assessment) return null;

  const handleAssessmentMetaChange = (field: keyof Assessment, value: any) => {
    setAssessment({ ...assessment, [field]: value });
  };

  const setLinkExpiryHours = (hours: number) => {
    const expiryDate = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    setAssessment({ ...assessment, linkExpiresAt: expiryDate });
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...assessment.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setAssessment({ ...assessment, questions: updatedQuestions });
  };

  const handleRubricChange = (index: number, field: string, value: any) => {
    const updatedQuestions = [...assessment.questions];
    const q = updatedQuestions[index];
    const rubric = q.rubric || { criteria: '', maxMarks: q.marks, keywords: [] };

    if (field === 'keywords') {
      const kwArray = typeof value === 'string' ? value.split(',').map((s) => s.trim()) : value;
      updatedQuestions[index] = {
        ...q,
        rubric: { ...rubric, keywords: kwArray },
      };
    } else {
      updatedQuestions[index] = {
        ...q,
        rubric: { ...rubric, [field]: value },
      };
    }
    setAssessment({ ...assessment, questions: updatedQuestions });
  };

  const addQuestion = () => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      prompt: 'New Technical Question Prompt',
      type: 'mcq',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswers: ['Option A'],
      marks: 5,
      difficulty: 'Medium',
      skillTag: 'General Systems',
    };
    setAssessment({ ...assessment, questions: [...assessment.questions, newQ] });
  };

  const removeQuestion = (index: number) => {
    if (assessment.questions.length <= 1) {
      alert('Assessment must contain at least one question.');
      return;
    }
    const updated = assessment.questions.filter((_, i) => i !== index);
    setAssessment({ ...assessment, questions: updated });
  };

  const handleSave = () => {
    saveAssessment(assessment);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDone = () => {
    saveAssessment(assessment);
    setSaveSuccess(true);
    setShowDoneModal(true);
  };

  const sharableToken = assessment.sharableToken || 'live-test-link';
  const port = typeof window !== 'undefined' ? window.location.port || '3000' : '3000';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const sharableUrl = `${protocol}//${hostIp}:${port}/assessment/${sharableToken}`;

  const handleCopyModalLink = () => {
    navigator.clipboard.writeText(sharableUrl);
    setCopiedModalLink(true);
    setTimeout(() => setCopiedModalLink(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question & Timer Setup</h1>
            <p className="text-xs sm:text-sm text-slate-500">Configure test duration, link expiration validity, questions, and answers.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Saved & Link Live!
            </span>
          )}

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition"
          >
            <Save className="h-4 w-4 text-slate-500" />
            Save Draft
          </button>

          <button
            onClick={handleDone}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Done (Get Test Link)
          </button>
        </div>
      </div>

      {/* Admin Timers Card: Test Duration & Link Expiration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">
          <Timer className="h-5 w-5 text-sky-600" />
          Assessment Duration & Link Validity Expiration
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Assessment Title</label>
            <input
              type="text"
              value={assessment.title}
              onChange={(e) => handleAssessmentMetaChange('title', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          {/* Test Timer Duration */}
          <div className="space-y-2 bg-sky-50/80 p-4 rounded-xl border border-sky-200">
            <label className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-sky-600" />
              Candidate Test Duration Timer
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={180}
                value={assessment.durationMinutes}
                onChange={(e) => handleAssessmentMetaChange('durationMinutes', Math.max(1, Number(e.target.value)))}
                className="w-20 px-3 py-1 rounded-lg border border-sky-300 text-base font-bold text-sky-900 focus:ring-2 focus:ring-sky-500 outline-none bg-white text-center"
              />
              <span className="text-xs font-semibold text-sky-800">Minutes per attempt</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-700">
              <span className="text-[10px] text-slate-500">Presets:</span>
              {[5, 10, 15, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleAssessmentMetaChange('durationMinutes', m)}
                  className={`px-2 py-0.5 rounded border transition ${
                    assessment.durationMinutes === m
                      ? 'bg-sky-600 text-white border-sky-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* Sharable Link Expiration Timer */}
          <div className="space-y-2 bg-purple-50/80 p-4 rounded-xl border border-purple-200">
            <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-purple-600" />
              Sharable Link Expiration Validity
            </label>
            <div className="text-xs text-purple-800 font-medium">
              Expires: <span className="font-bold text-purple-950">{new Date(assessment.linkExpiresAt || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 pt-1">
              <span className="text-[10px] text-slate-500">Set Validity:</span>
              {[1, 6, 12, 24, 48].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setLinkExpiryHours(h)}
                  className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-300 hover:bg-purple-100 hover:border-purple-300 transition font-bold"
                >
                  +{h}h
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Assessment Questions ({assessment.questions.length})</h2>
            <p className="text-xs text-slate-500">Add objective MCQs or short-answer questions for the shared test link.</p>
          </div>
          <button
            onClick={addQuestion}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </button>
        </div>

        {assessment.questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-sky-100 text-sky-800 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-semibold text-slate-800 text-sm">Question {idx + 1}</span>
              </div>
              <button
                onClick={() => removeQuestion(idx)}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Question Prompt</label>
                <textarea
                  rows={2}
                  value={q.prompt}
                  onChange={(e) => handleQuestionChange(idx, 'prompt', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Question Type</label>
                  <select
                    value={q.type}
                    onChange={(e) => handleQuestionChange(idx, 'type', e.target.value as QuestionType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none mt-1"
                  >
                    <option value="mcq">Single Choice (MCQ)</option>
                    <option value="multiple_select">Multiple Select</option>
                    <option value="true_false">True / False</option>
                    <option value="short_answer">Short Answer (AI Rubric)</option>
                    <option value="scenario">Scenario Architecture (AI Rubric)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Marks</label>
                    <input
                      type="number"
                      value={q.marks}
                      onChange={(e) => handleQuestionChange(idx, 'marks', Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Difficulty</label>
                    <select
                      value={q.difficulty}
                      onChange={(e) => handleQuestionChange(idx, 'difficulty', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Objective options editor */}
            {(q.type === 'mcq' || q.type === 'multiple_select' || q.type === 'true_false') && (
              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200 text-xs">
                <div className="font-bold text-slate-800">Options & Correct Answer</div>
                {q.type === 'true_false' ? (
                  <div className="flex gap-4">
                    {['True', 'False'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name={`tf-${q.id}`}
                          checked={q.correctAnswers?.[0] === opt}
                          onChange={() => handleQuestionChange(idx, 'correctAnswers', [opt])}
                          className="h-4 w-4 text-sky-600"
                        />
                        {opt} (Correct Answer)
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {q.options?.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type={q.type === 'mcq' ? 'radio' : 'checkbox'}
                          name={`opt-${q.id}`}
                          checked={q.correctAnswers?.includes(opt)}
                          onChange={(e) => {
                            if (q.type === 'mcq') {
                              handleQuestionChange(idx, 'correctAnswers', [opt]);
                            } else {
                              const current = q.correctAnswers || [];
                              const updated = e.target.checked
                                ? [...current, opt]
                                : current.filter((item) => item !== opt);
                              handleQuestionChange(idx, 'correctAnswers', updated);
                            }
                          }}
                          className="h-4 w-4 text-sky-600"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(q.options || [])];
                            newOpts[oIdx] = e.target.value;
                            handleQuestionChange(idx, 'options', newOpts);
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subjective Rubric editor */}
            {(q.type === 'short_answer' || q.type === 'scenario') && (
              <div className="bg-amber-50/50 p-4 rounded-xl space-y-3 border border-amber-200 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  AI Rubric Evaluation Settings
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Evaluation Criteria</label>
                    <textarea
                      rows={2}
                      value={q.rubric?.criteria || ''}
                      onChange={(e) => handleRubricChange(idx, 'criteria', e.target.value)}
                      placeholder="What should the AI check in candidate answer?"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Required Key Concepts (Comma separated)</label>
                    <input
                      type="text"
                      value={q.rubric?.keywords?.join(', ') || ''}
                      onChange={(e) => handleRubricChange(idx, 'keywords', e.target.value)}
                      placeholder="e.g. process, memory space, isolation, threads"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="text-xs text-slate-500 font-medium">
          Total Questions: <strong className="text-slate-900">{assessment.questions.length}</strong> • Test Duration: <strong className="text-slate-900">{assessment.durationMinutes} mins</strong>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addQuestion}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            <Plus className="h-4 w-4" />
            Add Another Question
          </button>

          <button
            onClick={handleDone}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg transition cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Done (Save & Generate Link)
          </button>
        </div>
      </div>

      {/* DONE / SHARABLE LINK GENERATED MODAL */}
      {showDoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <button
              onClick={() => setShowDoneModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Test Link Published!</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                All {assessment.questions.length} questions & {assessment.durationMinutes}-minute timer are live. Share this link with candidates:
              </p>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 block">Sharable Candidate Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={sharableUrl}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-semibold text-slate-900 outline-none select-all"
                />
                <button
                  onClick={handleCopyModalLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition shadow-md"
                >
                  {copiedModalLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedModalLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 space-y-1">
              <strong className="block text-sky-900">Admin Editing Note:</strong>
              <p className="text-[11px] leading-relaxed">
                You can return to the Question Builder anytime to add or update questions. Every change will automatically update live on this exact same link!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href={`${sharableUrl}?new=1`}
                target="_blank"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
              >
                Open Test (Preview)
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-md"
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
