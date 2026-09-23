import mongoose, { Schema, Document, Model } from 'mongoose';
import { AdminUser } from '@/types';

export interface IAdminUserDoc extends Omit<AdminUser, 'id'>, Document {
  id: string;
}

const AdminUserSchema = new Schema<IAdminUserDoc>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN'], default: 'ADMIN' },
    status: { type: String, enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'], default: 'PENDING_APPROVAL' },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

export const AdminUserModel: Model<IAdminUserDoc> =
  mongoose.models.AdminUser || mongoose.model<IAdminUserDoc>('AdminUser', AdminUserSchema);
