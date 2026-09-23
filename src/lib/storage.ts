import { Assessment, ExamVersion, Candidate, Session } from '@/types';
import { SEED_ASSESSMENT, SEED_EXAM_VERSIONS, SEED_CANDIDATES, SEED_SESSIONS } from './seed-data';

const STORAGE_KEYS = {
  ASSESSMENT: 'clubselect_assessment',
  ASSESSMENTS: 'clubselect_assessments',
  EXAM_VERSIONS: 'clubselect_exam_versions',
  CANDIDATES: 'clubselect_candidates',
  SESSIONS: 'clubselect_sessions',
};

export const fetchServerData = async (): Promise<{ assessment: Assessment; assessments?: Assessment[]; examVersions: ExamVersion[]; candidates: Candidate[]; sessions: Session[] } | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.assessment) {
        localStorage.setItem(STORAGE_KEYS.ASSESSMENT, JSON.stringify(data.assessment));
      }
      if (data.assessments && Array.isArray(data.assessments)) {
        localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(data.assessments));
      }
      if (data.examVersions && Array.isArray(data.examVersions)) {
        localStorage.setItem(STORAGE_KEYS.EXAM_VERSIONS, JSON.stringify(data.examVersions));
      }
      if (data.candidates) {
        localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(data.candidates));
      }
      if (data.sessions) {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
      }
      return data;
    }
  } catch (e) {
    // Network fallback
  }
  return null;
};

export const getAllAssessments = (): Assessment[] => {
  if (typeof window === 'undefined') return [SEED_ASSESSMENT];
  const stored = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
  if (!stored) {
    const defaultAsmnt = getAssessment();
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify([defaultAsmnt]));
    return [defaultAsmnt];
  }
  try {
    const list = JSON.parse(stored);
    return Array.isArray(list) && list.length > 0 ? list : [SEED_ASSESSMENT];
  } catch {
    return [SEED_ASSESSMENT];
  }
};

export const getAssessment = (adminEmail?: string): Assessment => {
  if (typeof window === 'undefined') return SEED_ASSESSMENT;

  let targetEmail = adminEmail;
  if (!targetEmail) {
    // If no email provided, fall back to currently logged in admin if available
    const activeStored = localStorage.getItem('clubselect_current_admin');
    if (activeStored) {
      try {
        const parsed = JSON.parse(activeStored);
        if (parsed?.email) targetEmail = parsed.email;
      } catch {}
    }
  }

  if (targetEmail) {
    const normEmail = targetEmail.trim().toLowerCase();
    const all = getAllAssessments();
    let matched = all.find((a) => a.adminEmail && a.adminEmail.toLowerCase() === normEmail);

    const asmntId = matched?.id || `asmnt-${normEmail.replace(/[^a-z0-9]/g, '-')}`;
    const initialVersionId = `version-1-${normEmail.replace(/[^a-z0-9]/g, '-')}`;

    if (!matched) {
      matched = {
        ...SEED_ASSESSMENT,
        id: asmntId,
        adminEmail: normEmail,
        title: `${normEmail.split('@')[0]}'s Recruitment Assessment`,
        sharableToken: `link-${normEmail.replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`,
        currentVersionId: initialVersionId,
      };
      saveAssessment(matched);
    }

    // Ensure dedicated ExamVersion exists for this admin's assessment
    const allVersions = getExamVersions();
    const adminVersions = allVersions.filter((v) => v.examId === matched!.id);

    if (adminVersions.length === 0 || matched.currentVersionId === 'v1-0-0' || !matched.currentVersionId) {
      const initialExamVersion: ExamVersion = {
        id: initialVersionId,
        examId: matched.id,
        versionNumber: 1,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        questions: SEED_EXAM_VERSIONS[0]?.questions.map((q, idx) => ({
          ...q,
          id: `q-${matched!.id}-${idx + 1}`,
          examVersionId: initialVersionId,
        })) || [],
      };
      saveExamVersion(initialExamVersion);

      if (matched.currentVersionId !== initialVersionId) {
        matched.currentVersionId = initialVersionId;
        saveAssessment(matched);
      }
    }

    return matched;
  }

  const stored = localStorage.getItem(STORAGE_KEYS.ASSESSMENT);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.ASSESSMENT, JSON.stringify(SEED_ASSESSMENT));
    return SEED_ASSESSMENT;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_ASSESSMENT;
  }
};

export const saveAssessment = (assessment: Assessment): void => {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEYS.ASSESSMENT, JSON.stringify(assessment));

  const all = getAllAssessments();
  const adminEmail = assessment.adminEmail || 'admin@testora.com';
  const idx = all.findIndex(
    (a) => (a.adminEmail && a.adminEmail.toLowerCase() === adminEmail.toLowerCase()) || a.id === assessment.id
  );

  if (idx >= 0) {
    all[idx] = assessment;
  } else {
    all.push(assessment);
  }

  localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(all));

  fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'saveAssessment', assessment }),
  }).catch(() => {});
};

export const getExamVersions = (): ExamVersion[] => {
  if (typeof window === 'undefined') return SEED_EXAM_VERSIONS;
  const stored = localStorage.getItem(STORAGE_KEYS.EXAM_VERSIONS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.EXAM_VERSIONS, JSON.stringify(SEED_EXAM_VERSIONS));
    return SEED_EXAM_VERSIONS;
  }
  try {
    const list = JSON.parse(stored);
    return Array.isArray(list) ? list : SEED_EXAM_VERSIONS;
  } catch {
    return SEED_EXAM_VERSIONS;
  }
};

export const getExamVersionById = (id: string): ExamVersion | undefined => {
  return getExamVersions().find(v => v.id === id);
};

export const saveExamVersion = (examVersion: ExamVersion): void => {
  if (typeof window === 'undefined') return;

  const all = getExamVersions();
  const idx = all.findIndex(v => v.id === examVersion.id);

  if (idx >= 0) {
    all[idx] = examVersion;
  } else {
    all.push(examVersion);
  }

  localStorage.setItem(STORAGE_KEYS.EXAM_VERSIONS, JSON.stringify(all));

  fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'saveExamVersion', examVersion }),
  }).catch(() => {});
};

export const getCandidates = (adminEmail?: string): Candidate[] => {
  if (typeof window === 'undefined') return SEED_CANDIDATES;
  const stored = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
  let list: Candidate[] = [];
  if (!stored) {
    list = SEED_CANDIDATES;
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(SEED_CANDIDATES));
  } else {
    try {
      list = JSON.parse(stored);
    } catch {
      list = SEED_CANDIDATES;
    }
  }

  if (adminEmail) {
    const norm = adminEmail.trim().toLowerCase();
    const adminAsmnt = getAssessment(adminEmail);
    return list.filter(
      (c) =>
        (c.adminEmail && c.adminEmail.toLowerCase() === norm) ||
        c.assessmentId === adminAsmnt.id
    );
  }
  return list;
};

export const saveCandidate = (candidate: Candidate): void => {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
  let candidates: Candidate[] = [];
  try {
    candidates = stored ? JSON.parse(stored) : [...SEED_CANDIDATES];
  } catch {
    candidates = [...SEED_CANDIDATES];
  }

  const index = candidates.findIndex((c) => c.id === candidate.id);
  if (index >= 0) {
    candidates[index] = candidate;
  } else {
    candidates.push(candidate);
  }
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));
  fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'saveCandidate', candidate }),
  }).catch(() => {});
};

export const getSessions = (adminEmail?: string): Session[] => {
  if (typeof window === 'undefined') return SEED_SESSIONS;
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  let list: Session[] = [];
  if (!stored) {
    list = SEED_SESSIONS;
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(SEED_SESSIONS));
  } else {
    try {
      list = JSON.parse(stored);
    } catch {
      list = SEED_SESSIONS;
    }
  }

  if (adminEmail) {
    const norm = adminEmail.trim().toLowerCase();
    const adminAsmnt = getAssessment(adminEmail);
    return list.filter(
      (s) =>
        (s.adminEmail && s.adminEmail.toLowerCase() === norm) ||
        s.assessmentId === adminAsmnt.id
    );
  }
  return list;
};

export const getSessionById = (id: string): Session | undefined => {
  const sessions = getSessions();
  return sessions.find((s) => s.id === id);
};

export const getSessionByCandidate = (candidateId: string): Session | undefined => {
  const sessions = getSessions();
  return sessions.find((s) => s.candidateId === candidateId);
};

export const saveSession = (session: Session): void => {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  let sessions: Session[] = [];
  try {
    sessions = stored ? JSON.parse(stored) : [...SEED_SESSIONS];
  } catch {
    sessions = [...SEED_SESSIONS];
  }

  const index = sessions.findIndex((s) => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'saveSession', session }),
  }).catch(() => {});
};

export const grantReattempt = (candidate: Candidate): void => {
  if (typeof window === 'undefined') return;
  const updatedCandidate = { ...candidate, status: 'INVITED' as const };
  saveCandidate(updatedCandidate);

  // Remove their session from local storage
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  let sessions: Session[] = [];
  try {
    sessions = stored ? JSON.parse(stored) : [];
  } catch {
    sessions = [];
  }
  sessions = sessions.filter(s => s.candidateId !== candidate.id);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

  fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'grantReattempt', candidate }),
  }).catch(() => {});
};

export const resetToSeedData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ASSESSMENT, JSON.stringify(SEED_ASSESSMENT));
  localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify([SEED_ASSESSMENT]));
  localStorage.setItem(STORAGE_KEYS.EXAM_VERSIONS, JSON.stringify(SEED_EXAM_VERSIONS));
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(SEED_CANDIDATES));
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(SEED_SESSIONS));
  fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset' }),
  }).catch(() => {});
};
