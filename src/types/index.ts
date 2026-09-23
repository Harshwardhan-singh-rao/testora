export type QuestionType = 'mcq' | 'multiple_select' | 'true_false' | 'short_answer' | 'scenario';

export interface Rubric {
  criteria: string;
  maxMarks: number;
  keywords?: string[];
}

export interface Question {
  id: string;
  examVersionId: string; // Hard boundary constraint
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

export interface ExamVersion {
  id: string;
  examId: string;
  versionNumber: number;
  questions: Question[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
}

export interface Assessment {
  id: string;
  adminEmail?: string;
  title: string;
  clubName: string;
  description: string;
  durationMinutes: number; // Candidate timer in minutes
  linkExpiresAt?: string; // ISO date string for when the link expires
  passingPercentage: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isRandomized: boolean;
  integritySettings: IntegritySettings;
  createdAt: string;
  sharableToken: string;
  currentVersionId?: string; // Points to the currently published version
  // Removed global questions array. Questions live in ExamVersion.
}

export interface Candidate {
  id: string;
  adminEmail?: string;
  name: string;
  email: string;
  invitationToken: string;
  assessmentId: string;
  status: 'INVITED' | 'IN_PROGRESS' | 'SUBMITTED' | 'BLOCKED' | 'EXPIRED';
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
  | 'BLOCKED_DISQUALIFIED'
  | 'AUTO_SUBMIT'
  | 'MANUAL_SUBMIT'
  | 'ATTEMPT_GRANTED';

export interface IntegrityEvent {
  id: string;
  attemptId: string;
  type: EventType;
  timestamp: string;
  details: string;
}

export interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  candidateResponse: string | string[];
  savedAt: string;
  isAutosaved: boolean;
}

export type AttemptStatus = 
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'SUBMITTED'
  | 'AUTO_SUBMITTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REVOKED'
  | 'REOPENED'
  | 'BLOCKED';

export interface Session { // Conceptually an "Attempt"
  id: string;
  adminEmail?: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  assessmentId: string;
  examVersionId: string; // The specific version locked to this attempt
  invitationToken?: string;
  status: AttemptStatus; // Strict state machine
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

export interface SubjectiveEvaluation {
  questionId: string;
  score: number;
  maxScore: number;
  rubricFeedback: string;
  confidence: 'High' | 'Medium' | 'Low';
  evaluator: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'REVIEWER';
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}
