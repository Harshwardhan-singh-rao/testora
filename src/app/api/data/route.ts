import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Assessment, Candidate, Session } from '@/types';
import { SEED_ASSESSMENT, SEED_CANDIDATES, SEED_SESSIONS } from '@/lib/seed-data';

const dataDir = path.join(process.cwd(), 'data');
const dbFilePath = path.join(dataDir, 'db.json');

interface DatabaseSchema {
  assessment: Assessment;
  candidates: Candidate[];
  sessions: Session[];
}

let inMemoryDb: DatabaseSchema | null = null;

function ensureDbFile(): DatabaseSchema {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  try {
    if (fs.existsSync(dbFilePath)) {
      const raw = fs.readFileSync(dbFilePath, 'utf-8');
      inMemoryDb = JSON.parse(raw);
      return inMemoryDb!;
    }
  } catch (err) {
    // Read failure fallback
  }

  inMemoryDb = {
    assessment: SEED_ASSESSMENT,
    candidates: SEED_CANDIDATES,
    sessions: SEED_SESSIONS,
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
    const { action, candidate, session, assessment } = body;

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
    }

    writeDbFile(db);
    return NextResponse.json({ success: true, db });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
