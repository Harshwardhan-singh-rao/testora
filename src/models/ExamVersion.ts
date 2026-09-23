import mongoose, { Schema, Document, Model } from 'mongoose';
import { ExamVersion } from '@/types';

export interface IExamVersionDoc extends Omit<ExamVersion, 'id'>, Document {
  id: string;
}

const ExamVersionSchema = new Schema<IExamVersionDoc>(
  {
    id: { type: String, required: true, unique: true },
    examId: { type: String, required: true },
    versionNumber: { type: Number, required: true },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'PUBLISHED' },
    createdAt: { type: String, default: () => new Date().toISOString() },
    questions: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

export const ExamVersionModel: Model<IExamVersionDoc> =
  mongoose.models.ExamVersion || mongoose.model<IExamVersionDoc>('ExamVersion', ExamVersionSchema);
