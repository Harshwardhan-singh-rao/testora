export type QuestionType = 'mcq' | 'multiple_select' | 'true_false' | 'short_answer' | 'scenario';

export interface Rubric {
  criteria: string;
  maxMarks: number;
  keywords?: string[];
}

export interface Question {
  id: string;
  prompt: string;
  type: QuestionType;
  options?: string[];
  correctAnswers?: string[];
  rubric?: Rubric;
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  skillTag: string;
  explanation?: string;
}

export interface IntegritySettings {
  strictBlockMode: boolean;
  trackFocus: boolean;
  trackFullscreen: boolean;
  trackClipboard: boolean;
  enableWatermark: boolean;
  allowCopyPaste: boolean;
}

export interface Assessment {
  id: string;
  title: string;
  clubName: string;
  description: string;
  durationMinutes: number; // Candidate timer in minutes
  linkExpiresAt?: string; // ISO date string for when the link expires
  passingPercentage: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  questions: Question[];
  isRandomized: boolean;
  integritySettings: IntegritySettings;
  createdAt: string;
  sharableToken: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  invitationToken: string;
  assessmentId: string;
  status: 'INVITED' | 'SYSTEM_CHECK_PASSED' | 'IN_PROGRESS' | 'SUBMITTED' | 'BLOCKED' | 'EXPIRED';
  invitedAt: string;
}

export type EventType =
  | 'FOCUS_LOST'
  | 'FOCUS_GAINED'
  | 'FULLSCREEN_EXIT'
  | 'FULLSCREEN_ENTER'
  | 'CLIPBOARD_COPY'
  | 'CLIPBOARD_PASTE'
  | 'RECONNECT'
  | 'WINDOW_RESIZE'
  | 'BLOCKED_DISQUALIFIED';

export interface IntegrityEvent {
  id: string;
  type: EventType;
  timestamp: string;
  details: string;
}

export interface Answer {
  questionId: string;
  candidateResponse: string | string[];
  savedAt: string;
  isAutosaved: boolean;
}

export interface SubjectiveEvaluation {
  questionId: string;
  score: number;
  maxScore: number;
  rubricFeedback: string;
  confidence: 'High' | 'Medium' | 'Low';
  evaluator: string;
}

export interface Session {
  id: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  assessmentId: string;
  startedAt: string;
  submittedAt?: string;
  expiresAt: string;
  answers: Record<string, Answer>;
  integrityEvents: IntegrityEvent[];
  objectiveScore?: number;
  subjectiveScore?: number;
  maxScore?: number;
  totalScore?: number;
  evaluations?: Record<string, SubjectiveEvaluation>;
  reviewStatus: 'CLEAN' | 'NEEDS_REVIEW' | 'HIGH_RISK_REVIEW' | 'BLOCKED_DISQUALIFIED';
  reviewerNotes?: string;
  finalDecision?: 'ACCEPTED' | 'REJECTED' | 'PENDING' | 'BLOCKED';
  isBlocked?: boolean;
  blockedReason?: string;
}
