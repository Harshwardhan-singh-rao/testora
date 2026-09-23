import mongoose, { Schema, Document, Model } from 'mongoose';
import { Session } from '@/types';

export interface ISessionDoc extends Omit<Session, 'id'>, Document {
  id: string;
}

const SessionSchema = new Schema<ISessionDoc>(
  {
    id: { type: String, required: true, unique: true },
    adminEmail: { type: String, lowercase: true, trim: true },
    candidateId: { type: String, required: true },
    candidateName: { type: String },
    candidateEmail: { type: String },
    assessmentId: { type: String, required: true },
    startedAt: { type: String, default: () => new Date().toISOString() },
    submittedAt: { type: String },
    expiresAt: { type: String },
    objectiveScore: { type: Number, default: 0 },
    subjectiveScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 50 },
    totalScore: { type: Number, default: 0 },
    reviewStatus: {
      type: String,
      enum: ['CLEAN', 'NEEDS_REVIEW', 'HIGH_RISK_REVIEW', 'BLOCKED_DISQUALIFIED'],
      default: 'CLEAN',
    },
    finalDecision: {
      type: String,
      enum: ['ACCEPTED', 'REJECTED', 'PENDING', 'BLOCKED'],
      default: 'PENDING',
    },
    reviewerNotes: { type: String },
    isBlocked: { type: Boolean, default: false },
    blockedReason: { type: String },
    answers: { type: Schema.Types.Mixed, default: {} },
    integrityEvents: { type: Schema.Types.Mixed, default: [] },
    evaluations: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const SessionModel: Model<ISessionDoc> =
  mongoose.models.Session || mongoose.model<ISessionDoc>('Session', SessionSchema);
