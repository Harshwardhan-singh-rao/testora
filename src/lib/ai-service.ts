import { Question, SubjectiveEvaluation } from '@/types';

export const evaluateSubjectiveAnswer = async (
  question: Question,
  candidateAnswer: string
): Promise<SubjectiveEvaluation> => {
  const maxMarks = question.marks;
  const cleanAnswer = candidateAnswer.trim();

  if (!cleanAnswer) {
    return {
      questionId: question.id,
      score: 0,
      maxScore: maxMarks,
      rubricFeedback: 'No answer submitted for this question.',
      confidence: 'High',
      evaluator: 'AI Rubric Evaluator v1.2',
    };
  }

  const rubricKeywords = question.rubric?.keywords || [];
  const lowercaseAns = cleanAnswer.toLowerCase();

  // Match keyword hits
  const matchedKeywords = rubricKeywords.filter((kw) => lowercaseAns.includes(kw.toLowerCase()));
  const keywordRatio = rubricKeywords.length > 0 ? matchedKeywords.length / rubricKeywords.length : 0.5;

  // Length quality score heuristic
  const wordCount = cleanAnswer.split(/\s+/).length;
  let lengthScoreRatio = 1.0;
  if (wordCount < 10) lengthScoreRatio = 0.4;
  else if (wordCount < 25) lengthScoreRatio = 0.7;

  // Combined score
  const finalRatio = Math.min(1.0, keywordRatio * 0.7 + lengthScoreRatio * 0.3);
  let score = Math.round(finalRatio * maxMarks);
  if (score < 1 && wordCount >= 10) score = 1;

  let confidence: 'High' | 'Medium' | 'Low' = 'High';
  if (rubricKeywords.length === 0) confidence = 'Medium';
  if (wordCount < 5) confidence = 'Low';

  let feedback = '';
  if (matchedKeywords.length > 0) {
    feedback = `Answer covers key technical concepts: [${matchedKeywords.join(', ')}]. ${
      score >= maxMarks * 0.8
        ? 'Well articulated response meeting rubric standards.'
        : 'Good foundation but missing deeper architectural details.'
    }`;
  } else {
    feedback = `Answer provided (${wordCount} words), but lacks specific rubric keywords (${rubricKeywords.join(', ')}).`;
  }

  return {
    questionId: question.id,
    score,
    maxScore: maxMarks,
    rubricFeedback: feedback,
    confidence,
    evaluator: 'AI Rubric Evaluator v1.2',
  };
};
