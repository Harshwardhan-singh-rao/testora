import { Assessment, Question, Session, SubjectiveEvaluation } from '@/types';
import { evaluateSubjectiveAnswer } from './ai-service';

export interface ScoreBreakdown {
  objectiveScore: number;
  subjectiveScore: number;
  totalScore: number;
  maxScore: number;
  evaluations: Record<string, SubjectiveEvaluation>;
  reviewStatus: 'CLEAN' | 'NEEDS_REVIEW' | 'HIGH_RISK_REVIEW';
}

export const scoreObjectiveQuestion = (question: Question, response: string | string[] | undefined): number => {
  if (!response || !question.correctAnswers) return 0;

  if (question.type === 'mcq' || question.type === 'true_false') {
    const singleAns = Array.isArray(response) ? response[0] : response;
    return singleAns.trim().toLowerCase() === question.correctAnswers[0].trim().toLowerCase()
      ? question.marks
      : 0;
  }

  if (question.type === 'multiple_select') {
    if (!Array.isArray(response)) return 0;
    const expected = [...question.correctAnswers].sort();
    const actual = [...response].sort();

    if (expected.length !== actual.length) return 0;
    const isMatch = expected.every((val, idx) => val === actual[idx]);
    return isMatch ? question.marks : 0;
  }

  return 0;
};

export const calculateSessionScore = async (
  assessment: Assessment,
  session: Session
): Promise<ScoreBreakdown> => {
  let objectiveScore = 0;
  let subjectiveScore = 0;
  let maxScore = 0;
  const evaluations: Record<string, SubjectiveEvaluation> = {};

  for (const q of assessment.questions) {
    maxScore += q.marks;
    const answer = session.answers[q.id];

    if (q.type === 'mcq' || q.type === 'true_false' || q.type === 'multiple_select') {
      const mark = scoreObjectiveQuestion(q, answer?.candidateResponse);
      objectiveScore += mark;
    } else if (q.type === 'short_answer' || q.type === 'scenario') {
      const respText = typeof answer?.candidateResponse === 'string' ? answer.candidateResponse : '';
      const evalResult = await evaluateSubjectiveAnswer(q, respText);
      evaluations[q.id] = evalResult;
      subjectiveScore += evalResult.score;
    }
  }

  // Assess integrity risk level
  const totalFocusLost = session.integrityEvents.filter((e) => e.type === 'FOCUS_LOST').length;
  const totalPasteAttempts = session.integrityEvents.filter((e) => e.type === 'CLIPBOARD_PASTE').length;
  const totalFullscreenExits = session.integrityEvents.filter((e) => e.type === 'FULLSCREEN_EXIT').length;

  let reviewStatus: 'CLEAN' | 'NEEDS_REVIEW' | 'HIGH_RISK_REVIEW' = 'CLEAN';

  if (totalPasteAttempts > 1 || totalFocusLost > 4 || totalFullscreenExits > 2) {
    reviewStatus = 'HIGH_RISK_REVIEW';
  } else if (totalFocusLost > 0 || totalPasteAttempts > 0 || totalFullscreenExits > 0) {
    reviewStatus = 'NEEDS_REVIEW';
  }

  return {
    objectiveScore,
    subjectiveScore,
    totalScore: objectiveScore + subjectiveScore,
    maxScore,
    evaluations,
    reviewStatus,
  };
};
