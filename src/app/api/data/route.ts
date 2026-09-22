import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { AdminUser, Assessment, Candidate, Session } from '@/types';
import { SEED_ADMIN_USERS, SEED_ASSESSMENT, SEED_CANDIDATES, SEED_SESSIONS } from '@/lib/seed-data';

const dataDir = path.join(process.cwd(), 'data');
const dbFilePath = path.join(dataDir, 'db.json');

interface DatabaseSchema {
  assessment: Assessment;
  assessments?: Assessment[];
  candidates: Candidate[];
  sessions: Session[];
  adminUsers: AdminUser[];
}

let inMemoryDb: DatabaseSchema | null = null;

function ensureDbFile(): DatabaseSchema {
  if (inMemoryDb) {
    if (!inMemoryDb.adminUsers) inMemoryDb.adminUsers = SEED_ADMIN_USERS;
    if (!inMemoryDb.assessments) inMemoryDb.assessments = [SEED_ASSESSMENT];
    return inMemoryDb;
  }

  try {
    if (fs.existsSync(dbFilePath)) {
      const raw = fs.readFileSync(dbFilePath, 'utf-8');
      inMemoryDb = JSON.parse(raw);
      if (!inMemoryDb!.adminUsers) inMemoryDb!.adminUsers = SEED_ADMIN_USERS;
      if (!inMemoryDb!.assessments) inMemoryDb!.assessments = [inMemoryDb!.assessment || SEED_ASSESSMENT];
      return inMemoryDb!;
    }
  } catch (err) {
    // Read failure fallback
  }

  inMemoryDb = {
    assessment: SEED_ASSESSMENT,
    assessments: [SEED_ASSESSMENT],
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

export async function GET() {
  const db = ensureDbFile();
  return NextResponse.json(db);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = ensureDbFile();
    const { action, candidate, session, assessment, adminUser, adminUserId, status } = body;

    if (action === 'saveCandidate' && candidate) {
      const idx = db.candidates.findIndex((c) => c.id === candidate.id);
      if (idx >= 0) {
        db.candidates[idx] = candidate;
      } else {
        db.candidates.push(candidate);
      }
    } else if (action === 'saveSession' && session) {
      const idx = db.sessions.findIndex((s) => s.id === session.id);
      if (idx >= 0) {
        db.sessions[idx] = session;
      } else {
        db.sessions.push(session);
      }
    } else if (action === 'saveAssessment' && assessment) {
      db.assessment = assessment;
      if (!db.assessments) db.assessments = [];
      const adminEmail = assessment.adminEmail || 'admin@testora.com';
      const idx = db.assessments.findIndex((a) => (a.adminEmail && a.adminEmail.toLowerCase() === adminEmail.toLowerCase()) || a.id === assessment.id);
      if (idx >= 0) {
        db.assessments[idx] = assessment;
      } else {
        db.assessments.push(assessment);
      }
    } else if (action === 'saveAdminUser' && adminUser) {
      const idx = db.adminUsers.findIndex((u) => u.id === adminUser.id || u.email.toLowerCase() === adminUser.email.toLowerCase());
      if (idx >= 0) {
        db.adminUsers[idx] = adminUser;
      } else {
        db.adminUsers.push(adminUser);
      }
    } else if (action === 'updateAdminStatus' && adminUserId && status) {
      const idx = db.adminUsers.findIndex((u) => u.id === adminUserId);
      if (idx >= 0) {
        db.adminUsers[idx].status = status;
      }
    } else if (action === 'unblockCandidate' && session) {
      const idx = db.sessions.findIndex((s) => s.id === session.id);
      if (idx >= 0) {
        db.sessions[idx] = {
          ...db.sessions[idx],
          isBlocked: false,
          reviewStatus: 'NEEDS_REVIEW',
          finalDecision: 'PENDING',
        };
      }
    } else if (action === 'reset') {
      db.assessment = SEED_ASSESSMENT;
      db.candidates = SEED_CANDIDATES;
      db.sessions = SEED_SESSIONS;
      db.adminUsers = SEED_ADMIN_USERS;
    }

    writeDbFile(db);
    return NextResponse.json({ success: true, db });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
