import { Assessment, Candidate, Session } from '@/types';
import { SEED_ASSESSMENT, SEED_CANDIDATES, SEED_SESSIONS } from './seed-data';

const STORAGE_KEYS = {
  ASSESSMENT: 'clubselect_assessment',
  CANDIDATES: 'clubselect_candidates',
  SESSIONS: 'clubselect_sessions',
};

export const fetchServerData = async (): Promise<{ assessment: Assessment; candidates: Candidate[]; sessions: Session[] } | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.assessment) {
        localStorage.setItem(STORAGE_KEYS.ASSESSMENT, JSON.stringify(data.assessment));
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

export const getAssessment = (): Assessment => {
  if (typeof window === 'undefined') return SEED_ASSESSMENT;
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
  fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'saveAssessment', assessment }),
  }).catch(() => {});
};

export const getCandidates = (): Candidate[] => {
  if (typeof window === 'undefined') return SEED_CANDIDATES;
  const stored = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(SEED_CANDIDATES));
    return SEED_CANDIDATES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_CANDIDATES;
  }
};

export const saveCandidate = (candidate: Candidate): void => {
  if (typeof window === 'undefined') return;
  const candidates = getCandidates();
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

export const getSessions = (): Session[] => {
  if (typeof window === 'undefined') return SEED_SESSIONS;
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(SEED_SESSIONS));
    return SEED_SESSIONS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_SESSIONS;
  }
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
  const sessions = getSessions();
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

export const resetToSeedData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ASSESSMENT, JSON.stringify(SEED_ASSESSMENT));
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(SEED_CANDIDATES));
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(SEED_SESSIONS));
  fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset' }),
  }).catch(() => {});
};
