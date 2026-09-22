# ClubSelect — Product & Technical Analysis

**Source:** `ClubSelect_Remote_Assessment_Product_Spec_and_Master_Prompt.docx`  
**Version:** 1.0 — September 2026

## 1. Executive Summary

ClubSelect is specified as a **cheat-resistant remote technical-club entrance assessment platform**, not a generic form and not a “100% anti-cheat” system. The core product combines timed assessments, randomized questions, integrity telemetry, watermarking, autosave, server-authoritative timing, objective scoring, AI-assisted subjective evaluation, and human review.

The specification explicitly states that browser controls cannot guarantee prevention of second-device use, screenshots, external cameras, or OS-level capture. The intended approach is therefore **prevention + detection + deterrence + randomization/adaptation + post-test review**.

## 2. Primary Users

- **Admin / Club Vice President:** creates assessments, manages candidates, reviews submissions, and makes final selection decisions.
- **Candidate:** receives an invitation, completes system checks, takes the assessment, and submits answers.
- **Reviewer (optional):** reviews answers and integrity reports without changing core assessment configuration.

## 3. Core End-to-End Flow

1. Admin signs in.
2. Admin creates an assessment.
3. Admin configures duration, sections, questions, selection rules, and integrity settings.
4. Candidates are added/imported.
5. Unique invitation links are generated.
6. Candidate verifies the invitation/session.
7. Candidate completes compatibility/system checks.
8. Candidate reads rules and starts.
9. Questions are delivered using fixed, randomized, or adaptive modes.
10. Answers are autosaved.
11. Integrity events are recorded.
12. Server-authoritative timer controls the actual deadline.
13. Submission occurs manually or automatically at timeout.
14. Objective questions are scored deterministically.
15. Subjective answers can go through AI-assisted rubric evaluation.
16. Admin reviews score, answers, integrity timeline, and AI evidence.
17. Admin makes the final selection decision.

## 4. MVP Scope

The first release should focus on:

- Admin authentication
- Assessment creation/editing
- Candidate management
- Unique invitation links
- Timed assessment player
- MCQ, short-answer, and scenario questions
- Randomized question order
- Server-side timer
- Copy/paste and focus-change logging
- Fullscreen monitoring
- Dynamic candidate/session watermark
- Autosave
- Automatic objective scoring
- AI-assisted subjective evaluation
- Candidate results/integrity dashboard
- CSV export
- Manual review workflow

### Explicitly Later / Optional

- Adaptive AI follow-ups
- Sandboxed coding questions
- Webcam/microphone proctoring
- Face-presence detection
- Plagiarism/similarity analysis
- Email/WhatsApp invitations
- Advanced reviewer permissions
- Multi-club/organization support
- Advanced audit analytics

## 5. Assessment Model

Supported/currently planned question types:

| Type | Evaluation | Purpose |
|---|---|---|
| MCQ | Automatic | Knowledge screening |
| Multiple select | Automatic | Concept verification |
| True/False | Automatic | Basic verification |
| Short answer | AI-assisted | Understanding |
| Long/scenario answer | AI-assisted/manual | Problem solving |
| Coding | Later extension | Technical skill |

Each question should support:

- Prompt
- Question type
- Options where applicable
- Correct answer for objective questions
- Rubric for subjective questions
- Skill tags
- Difficulty
- Time recommendation
- Explanation
- Optional follow-up configuration

## 6. Anti-Cheating / Integrity Architecture

The design is deliberately layered.

### Controls

- Unique invitation/session token
- Single active session per invitation
- Randomized question order
- Equivalent question pools
- Optional one-question-at-a-time mode
- Clipboard event detection
- Optional clipboard blocking
- `visibilitychange` monitoring
- Window blur/focus monitoring
- Fullscreen exit monitoring
- Reconnect/session anomaly logging
- Dynamic watermark
- Server-authoritative timer
- Frequent autosave
- Timestamped integrity event log

### What the System Must Not Claim

The platform must not claim that browser JavaScript can prevent or reliably detect:

- Screenshots in all cases
- Second phones/devices
- Another computer
- External cameras
- OS-level screenshot/capture tools
- Every form of external AI assistance

The product should be marketed and documented as **cheat-resistant**, not cheat-proof.

## 7. Integrity Review Model

The specification rejects a single opaque “cheating probability.”

Instead, the admin should see evidence-backed signals such as:

- Focus-loss count
- Total time away
- Fullscreen exits
- Clipboard attempts
- Session/device anomalies
- Reconnects
- Unusual answer timing
- Similarity signals where applicable
- Optional proctoring signals

Recommended workflow labels:

- `CLEAN`
- `NEEDS_REVIEW`
- `HIGH_RISK_REVIEW`

These labels are explicitly **not proof of misconduct**. Integrity signals must not silently change the academic/technical score.

## 8. AI Architecture

AI should be isolated behind a server-side abstraction.

Planned functions:

```text
generate_question_draft()
generate_question_variants()
evaluate_subjective_answer()
generate_follow_up()
summarize_candidate_performance()
```

AI evaluation should return:

- Score
- Rubric dimensions
- Concise evidence-based explanation
- Confidence/uncertainty indicator
- Provider/model information
- Evaluator version

The system should **not expose hidden chain-of-thought** and should not allow AI to secretly change the grading rubric.

For high-stakes selection, the specification prefers **admin-approved question banks**. AI-generated questions should remain drafts until approved unless trusted generation is explicitly enabled.

## 9. Adaptive Assessment

Optional adaptive mode:

1. Candidate answers a scenario/short-answer question.
2. Backend sends the answer plus predefined skill target to AI.
3. AI generates one follow-up.
4. Admin-defined topic/difficulty constraints remain fixed.
5. The generated question is stored in the session audit trail.
6. If generation fails, a pre-approved fallback question is used.

The AI must not unpredictably change difficulty or scoring rules.

## 10. Admin Dashboard

The dashboard should include:

- Assessment overview
- Assessment builder
- Question bank
- Candidate invitations
- Live session status
- Submission list
- Candidate detail page
- Answer-by-answer review
- Integrity timeline
- Section score breakdown
- AI evaluation/rubric evidence
- Reviewer notes
- Final review decision
- CSV export

### Candidate Report

A candidate report should contain:

- Candidate information
- Assessment
- Completion status
- Total score
- Section scores
- Answers
- Expected answer/rubric
- AI evaluation
- Reviewer notes
- Integrity event timeline
- Review status
- Final admin decision

## 11. Candidate Experience

The candidate flow should remain controlled but usable:

- Club-branded landing page
- Invitation verification
- Rules page
- Compatibility/system check
- Permission requests only when required
- Fullscreen where configured
- Clear synchronized timer
- Question navigation
- Autosave status
- Warnings for prohibited actions
- Submission confirmation
- Network interruption recovery

The specification specifically warns against making ordinary browser/network problems disqualifying.

## 12. Timer & Reliability

The **server is authoritative**.

Client responsibilities:

- Display remaining time.
- Refresh UI countdown.
- Request authoritative time after reconnect.

Server responsibilities:

- Determine actual remaining time.
- Lock editing at timeout.
- Trigger/accept final submission.
- Prevent client-side clock manipulation.

For network failure:

1. Preserve locally unsent answer data when safe.
2. Show connection warning.
3. Attempt reconnect.
4. Synchronize with server.
5. Record the incident.
6. Do not unfairly reset the timer.
7. Never allow offline manipulation of server time.

## 13. Watermarking

The candidate UI should show a semi-transparent dynamic watermark containing:

- Candidate display name
- Session short ID
- Timestamp

The watermark should periodically move within safe UI boundaries and must not obscure questions or inputs.

## 14. Suggested Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python |
| Database | PostgreSQL |
| Auth | Supabase Auth or equivalent |
| Realtime | WebSocket or equivalent |
| Storage | Supabase Storage or equivalent |
| AI | Provider-agnostic server-side LLM abstraction |
| Frontend hosting | Vercel |
| Backend hosting | Managed Python hosting |
| Version control | GitHub |

The architecture should remain modular so providers can be replaced later.

## 15. Core Data Model

Required normalized entities:

```text
users
assessments
questions
candidates
invitations
sessions
answers
integrity_events
evaluations
reviews
```

Important relationships:

- Assessment → Questions
- Assessment → Invitations
- Invitation → Candidate
- Invitation → Session
- Session → Answers
- Session → Integrity Events
- Answer → Evaluation
- Session → Review

Security-sensitive fields include invitation token hashes, session credentials, answer keys, evaluation data, and reviewer/admin actions.

## 16. API Surface

The specification suggests versioned APIs such as:

```text
POST /api/v1/assessments
GET  /api/v1/assessments
GET  /api/v1/assessments/{id}
POST /api/v1/assessments/{id}/publish

POST /api/v1/invitations

POST /api/v1/sessions/start
GET  /api/v1/sessions/{id}
POST /api/v1/sessions/{id}/answers
POST /api/v1/sessions/{id}/events
POST /api/v1/sessions/{id}/submit

GET /api/v1/admin/sessions
GET /api/v1/admin/sessions/{id}/report
```

Every protected endpoint must enforce authorization.

## 17. Security Requirements

Critical requirements:

- Never expose answer keys in client JavaScript.
- Keep AI API keys server-side.
- Hash invitation tokens.
- Use short-lived session credentials.
- Rate-limit authentication, invitation redemption, and submissions.
- Validate all requests server-side.
- Prevent cross-candidate access/IDOR.
- Use role-based access control.
- Sanitize rendered/user-controlled content.
- Use HTTPS in production.
- Log administrative changes.
- Protect production secrets.
- Provide data retention/deletion configuration.
- Do not store webcam/microphone recordings unless explicitly required and consented to.

## 18. Privacy & Fairness

The platform should:

- Explain what data is collected.
- Explain integrity monitoring.
- Explain optional camera/microphone use.
- Avoid collecting recordings unless configured and justified.
- Give administrators retention controls.
- Keep scoring rubrics stable across candidates.
- Use equivalent difficulty when randomizing pools.
- Separate technical interruptions from suspicious behavior.
- Let reviewers inspect underlying event timelines.
- Never automatically reject a candidate solely because an AI detector flags them.

## 19. Testing Requirements

Automated tests should cover:

- Authentication
- Authorization
- Invitation redemption
- Session locking
- Timer logic
- Autosave
- Submission
- Scoring
- Integrity event recording
- CSV export
- AI-service failure fallback
- Reconnect behavior

End-to-end test:

```text
Admin creates assessment
→ adds candidate
→ candidate opens invitation
→ system check
→ starts assessment
→ answers questions
→ integrity event occurs
→ submits
→ admin views report
```

Also explicitly test:

- Tab switching
- Fullscreen exit
- Refresh
- Reconnect
- Timeout
- Candidate/admin route isolation
- API-key exposure
- Timer behavior after refresh/reconnect

## 20. Recommended Implementation Order

The specification gives this priority:

1. Project setup
2. Database/auth
3. Admin dashboard
4. Assessment builder
5. Candidate invitation
6. Candidate assessment player
7. Timer/autosave
8. Integrity events
9. Scoring
10. Candidate report
11. AI service
12. Testing
13. Deployment documentation

This order keeps the core assessment flow functional before adding more advanced AI/proctoring functionality.

## 21. Demo / Seed Data

Local development should include a demo mechanism with:

- Sample admin
- Sample technical-club assessment
- 5 MCQs
- 2 short-answer questions
- 2 scenario questions
- Sample rubric
- Sample candidate
- Sample integrity events

## 22. Example First Assessment

The source gives an example 30–40 minute structure:

| Component | Quantity | Marks | Time |
|---|---:|---:|---:|
| MCQs | 10 | 10 | 8 min |
| Short technical questions | 3 | 15 | 10 min |
| Problem-solving/scenario | 2 | 20 | 15 min |
| Club/teamwork scenario | 1 | 5 | 5 min |

The source explicitly describes this as an **example rather than a fixed scoring recommendation**.

## 23. Important Product Guardrails

Do not:

- Call the product “100% anti-cheat.”
- Depend on a single AI detector.
- Automatically reject candidates from tab-switch counts alone.
- Put answer keys in client-side code.
- Request webcam/microphone permissions without explanation.
- Make normal browser/network failures disqualifying.
- Start with complex facial recognition without a real need.
- Build fake UI buttons that do nothing.

## 24. Definition of Done

The product is considered complete when:

- Admin can create and publish an assessment.
- Candidates enter only through valid invitations.
- Tests autosave and use server-authoritative timing.
- Integrity events are recorded and visible.
- Objective questions score correctly.
- Subjective answers can be evaluated with an explicit rubric.
- Candidates cannot access answer keys.
- Admin can inspect the full candidate report.
- Refresh/reconnect scenarios work reasonably.
- Production secrets are protected.
- Setup/deployment documentation exists.
- Monitoring is clearly described as imperfect.

## 25. Product Architecture — High-Level

```text
                    ┌─────────────────────┐
                    │      Admin UI       │
                    │ Assessment Builder  │
                    │ Candidate Review    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     API / Backend   │
                    │      FastAPI        │
                    └───────┬─────┬───────┘
                            │     │
                ┌───────────┘     └─────────────┐
                ▼                               ▼
        ┌───────────────┐              ┌────────────────┐
        │ PostgreSQL    │              │ AI Service     │
        │ Assessments   │              │ Rubric Eval    │
        │ Sessions      │              │ Questions      │
        │ Answers       │              │ Follow-ups     │
        │ Events        │              └────────────────┘
        └───────────────┘
                ▲
                │
        ┌───────┴────────┐
        │ Candidate UI   │
        │ Timer          │
        │ Questions      │
        │ Autosave       │
        │ Integrity      │
        │ Watermark      │
        └────────────────┘
```

## 26. Key Product Insight

The strongest architectural idea in the source is that **integrity should be treated as an evidence/review workflow rather than a binary cheating detector**.

That means the platform should preserve:

- Raw timestamped events
- Technical interruptions
- Candidate answers
- Scoring evidence
- AI evaluation evidence
- Reviewer decisions

This creates an auditable decision-support system rather than an opaque automated rejection mechanism.

## 27. Practical MVP Boundary

For a first real club pilot, the most important working loop is:

```text
Admin Login
→ Create Assessment
→ Add Questions
→ Add Candidates
→ Generate Invitations
→ Candidate System Check
→ Timed Test
→ Autosave
→ Integrity Logging
→ Auto Scoring
→ Candidate Report
→ Human Review
→ Final Decision
→ CSV Export
```

Advanced adaptive AI, coding sandboxing, webcam proctoring, facial detection, and multi-organization support should remain outside the first production milestone unless there is a specific requirement.

## 28. Final Assessment

The specification describes a complete product blueprint rather than merely a form replacement. Its architecture is centered on **controlled assessment delivery, auditable integrity signals, deterministic scoring, AI-assisted evaluation, and human decision-making**.

The critical implementation principle is:

> Build a controlled assessment platform, not an supposedly unbreakable browser.

The source's final product position is that defensibility comes from combining randomized/adaptive questions, time pressure, integrity telemetry, individualized follow-ups, watermarking, and human review.
