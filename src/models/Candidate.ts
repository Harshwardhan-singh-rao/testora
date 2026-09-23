import mongoose, { Schema, Document, Model } from 'mongoose';
import { Candidate } from '@/types';

export interface ICandidateDoc extends Omit<Candidate, 'id'>, Document {
  id: string;
}

const CandidateSchema = new Schema<ICandidateDoc>(
  {
    id: { type: String, required: true, unique: true },
    adminEmail: { type: String, lowercase: true, trim: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    invitationToken: { type: String, required: true },
    assessmentId: { type: String, required: true },
    status: {
      type: String,
      enum: ['INVITED', 'SYSTEM_CHECK_PASSED', 'IN_PROGRESS', 'SUBMITTED', 'BLOCKED', 'EXPIRED'],
      default: 'INVITED',
    },
    invitedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

export const CandidateModel: Model<ICandidateDoc> =
  mongoose.models.Candidate || mongoose.model<ICandidateDoc>('Candidate', CandidateSchema);
