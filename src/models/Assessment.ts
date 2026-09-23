import mongoose, { Schema, Document, Model } from 'mongoose';
import { Assessment } from '@/types';

export interface IAssessmentDoc extends Omit<Assessment, 'id'>, Document {
  id: string;
  questions?: any;
}

const AssessmentSchema = new Schema<IAssessmentDoc>(
  {
    id: { type: String, required: true, unique: true },
    adminEmail: { type: String, lowercase: true, trim: true },
    title: { type: String, required: true },
    clubName: { type: String, required: true },
    description: { type: String },
    durationMinutes: { type: Number, default: 40 },
    linkExpiresAt: { type: String },
    passingPercentage: { type: Number, default: 70 },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'PUBLISHED' },
    isRandomized: { type: Boolean, default: true },
    sharableToken: { type: String, required: true },
    currentVersionId: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
    integritySettings: {
      strictBlockMode: { type: Boolean, default: true },
      trackFocus: { type: Boolean, default: true },
      trackFullscreen: { type: Boolean, default: true },
      trackClipboard: { type: Boolean, default: true },
      enableWatermark: { type: Boolean, default: true },
      allowCopyPaste: { type: Boolean, default: false },
    },
    questions: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

export const AssessmentModel: Model<IAssessmentDoc> =
  mongoose.models.Assessment || mongoose.model<IAssessmentDoc>('Assessment', AssessmentSchema);
