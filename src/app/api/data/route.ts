import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import fs from 'fs';
import path from 'path';
import { AdminUser, Assessment, ExamVersion, Candidate, Session, Answer } from '@/types';
import { SEED_ADMIN_USERS, SEED_ASSESSMENT, SEED_EXAM_VERSIONS, SEED_CANDIDATES, SEED_SESSIONS } from '@/lib/seed-data';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminUserModel } from '@/models/AdminUser';
import { AssessmentModel } from '@/models/Assessment';
import { ExamVersionModel } from '@/models/ExamVersion';
import { CandidateModel } from '@/models/Candidate';
import { SessionModel } from '@/models/Session';

const dataDir = path.join(process.cwd(), 'data');
const dbFilePath = path.join(dataDir, 'db.json');

interface DatabaseSchema {
  assessment: Assessment;
  assessments?: Assessment[];
  examVersions: ExamVersion[];
  candidates: Candidate[];
  sessions: Session[];
  adminUsers: AdminUser[];
}

let inMemoryDb: DatabaseSchema | null = null;

function ensureDbFile(): DatabaseSchema {
  if (inMemoryDb) {
    if (!inMemoryDb.adminUsers) inMemoryDb.adminUsers = SEED_ADMIN_USERS;
    if (!inMemoryDb.assessments) inMemoryDb.assessments = [SEED_ASSESSMENT];
    if (!inMemoryDb.examVersions) inMemoryDb.examVersions = SEED_EXAM_VERSIONS;
    return inMemoryDb;
  }

  try {
    if (fs.existsSync(dbFilePath)) {
      const raw = fs.readFileSync(dbFilePath, 'utf-8');
      inMemoryDb = JSON.parse(raw);
      if (!inMemoryDb!.adminUsers) inMemoryDb!.adminUsers = SEED_ADMIN_USERS;
      if (!inMemoryDb!.assessments) inMemoryDb!.assessments = [inMemoryDb!.assessment || SEED_ASSESSMENT];
      if (!inMemoryDb!.examVersions) inMemoryDb!.examVersions = SEED_EXAM_VERSIONS;
      return inMemoryDb!;
    }
  } catch (err) {
    // Read failure fallback
  }

  inMemoryDb = {
    assessment: SEED_ASSESSMENT,
    assessments: [SEED_ASSESSMENT],
    examVersions: SEED_EXAM_VERSIONS,
    candidates: SEED_CANDIDATES,
    sessions: SEED_SESSIONS,
    adminUsers: SEED_ADMIN_USERS,
  };

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dbFilePath, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
  } catch (err) {
    // Read-only filesystem fallback on Vercel
  }

  return inMemoryDb;
}

function writeDbFile(data: DatabaseSchema): void {
  inMemoryDb = data;
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Read-only filesystem fallback on Vercel
  }
}

async function getMongoDbData(): Promise<DatabaseSchema | null> {
  try {
    const conn = await connectToDatabase();
    if (!conn) return null;

    let adminUsers = await AdminUserModel.find().lean();
    let assessments = await AssessmentModel.find().lean();
    let examVersions = await ExamVersionModel.find().lean();
    let candidates = await CandidateModel.find().lean();
    let sessions = await SessionModel.find().lean();

    // Auto seed MongoDB if database is empty
    if (adminUsers.length === 0) {
      await AdminUserModel.insertMany(SEED_ADMIN_USERS);
      adminUsers = await AdminUserModel.find().lean();
    }

    if (assessments.length === 0) {
      await AssessmentModel.create(SEED_ASSESSMENT);
      assessments = await AssessmentModel.find().lean();
    }

    if (examVersions.length === 0) {
      await ExamVersionModel.insertMany(SEED_EXAM_VERSIONS);
      examVersions = await ExamVersionModel.find().lean();
    }

    const defaultAssessment = assessments[0] || SEED_ASSESSMENT;

    return {
      assessment: defaultAssessment as unknown as Assessment,
      assessments: assessments as unknown as Assessment[],
      examVersions: examVersions as unknown as ExamVersion[],
      candidates: candidates as unknown as Candidate[],
      sessions: sessions as unknown as Session[],
      adminUsers: adminUsers as unknown as AdminUser[],
    };
  } catch (err) {
    console.error('MongoDB query fallback to file db:', err);
    return null;
  }
}

export async function GET() {
  const mongoData = await getMongoDbData();
  if (mongoData) {
    return NextResponse.json(mongoData);
  }

  const db = ensureDbFile();
  return NextResponse.json(db);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, candidate, session, assessment, examVersion, adminUser, adminUserId, status, attemptId, questionId, candidateResponse } = body;

    const mongoConn = await connectToDatabase().catch(() => null);

    if (mongoConn) {
      if (action === 'saveCandidate' && candidate) {
        await CandidateModel.findOneAndUpdate({ id: candidate.id }, candidate, { upsert: true, new: true });
      } else if (action === 'saveSession' && session) {
        await SessionModel.findOneAndUpdate({ id: session.id }, session, { upsert: true, new: true });
      } else if (action === 'saveAnswer' && attemptId && questionId) {
        const sessDoc = await SessionModel.findOne({ id: attemptId });
        if (sessDoc) {
          if (new Date(sessDoc.expiresAt).getTime() < Date.now()) {
            return NextResponse.json({ success: false, error: 'Session expired' }, { status: 403 });
          }
          if (sessDoc.status === 'SUBMITTED' || sessDoc.status === 'AUTO_SUBMITTED') {
            return NextResponse.json({ success: false, error: 'Session already submitted' }, { status: 403 });
          }

          const answer: Answer = {
            id: `ans-${attemptId}-${questionId}`,
            attemptId,
            questionId,
            candidateResponse,
            savedAt: new Date().toISOString(),
            isAutosaved: true,
          };

          const answersObj = sessDoc.answers || {};
          answersObj[questionId] = answer;
          sessDoc.answers = answersObj;
          sessDoc.markModified('answers');
          await sessDoc.save();
        }
      } else if (action === 'saveAssessment' && assessment) {
        const adminEmail = assessment.adminEmail || 'admin@testora.com';
        await AssessmentModel.findOneAndUpdate(
          { $or: [{ id: assessment.id }, { adminEmail }] },
          assessment,
          { upsert: true, new: true }
        );
      } else if (action === 'saveExamVersion' && examVersion) {
        await ExamVersionModel.findOneAndUpdate(
          { id: examVersion.id },
          examVersion,
          { upsert: true, new: true }
        );
      } else if (action === 'saveAdminUser' && adminUser) {
        await AdminUserModel.findOneAndUpdate(
          { $or: [{ id: adminUser.id }, { email: adminUser.email }] },
          adminUser,
          { upsert: true, new: true }
        );
      } else if (action === 'updateAdminStatus' && adminUserId && status) {
        await AdminUserModel.findOneAndUpdate({ id: adminUserId }, { status });
      } else if (action === 'unblockCandidate' && session) {
        await SessionModel.findOneAndUpdate(
          { id: session.id },
          { isBlocked: false, reviewStatus: 'NEEDS_REVIEW', finalDecision: 'PENDING', status: 'REOPENED' }
        );
      } else if (action === 'grantReattempt' && candidate) {
        await CandidateModel.findOneAndUpdate({ id: candidate.id }, { status: 'INVITED' });
        await SessionModel.deleteMany({ candidateId: candidate.id });
      } else if (action === 'reset') {
        await AdminUserModel.deleteMany({});
        await AssessmentModel.deleteMany({});
        await ExamVersionModel.deleteMany({});
        await CandidateModel.deleteMany({});
        await SessionModel.deleteMany({});
        await AdminUserModel.insertMany(SEED_ADMIN_USERS);
        await AssessmentModel.create(SEED_ASSESSMENT);
        await ExamVersionModel.insertMany(SEED_EXAM_VERSIONS);
        await CandidateModel.insertMany(SEED_CANDIDATES);
        await SessionModel.insertMany(SEED_SESSIONS);
      }

      const mongoData = await getMongoDbData();
      if (mongoData) {
        return NextResponse.json({ success: true, db: mongoData });
      }
    }

    // Fallback file DB execution
    const db = ensureDbFile();
    if (action === 'saveCandidate' && candidate) {
      const idx = db.candidates.findIndex((c) => c.id === candidate.id);
      if (idx >= 0) db.candidates[idx] = candidate;
      else db.candidates.push(candidate);
    } else if (action === 'saveSession' && session) {
      const idx = db.sessions.findIndex((s) => s.id === session.id);
      if (idx >= 0) db.sessions[idx] = session;
      else db.sessions.push(session);
    } else if (action === 'saveAssessment' && assessment) {
      db.assessment = assessment;
      if (!db.assessments) db.assessments = [];
      const adminEmail = assessment.adminEmail || 'admin@testora.com';
      const idx = db.assessments.findIndex((a) => (a.adminEmail && adminEmail && a.adminEmail.toLowerCase() === adminEmail.toLowerCase()) || a.id === assessment.id);
      if (idx >= 0) db.assessments[idx] = assessment;
      else db.assessments.push(assessment);
    } else if (action === 'saveAdminUser' && adminUser) {
      const idx = db.adminUsers.findIndex((u) => u.id === adminUser.id || (u.email && adminUser.email && u.email.toLowerCase() === adminUser.email.toLowerCase()));
      if (idx >= 0) db.adminUsers[idx] = adminUser;
      else db.adminUsers.push(adminUser);
    } else if (action === 'updateAdminStatus' && adminUserId && status) {
      const idx = db.adminUsers.findIndex((u) => u.id === adminUserId);
      if (idx >= 0) db.adminUsers[idx].status = status;
    }

    writeDbFile(db);
    return NextResponse.json({ success: true, db });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
