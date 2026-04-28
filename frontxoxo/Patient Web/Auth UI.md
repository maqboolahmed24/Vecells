# Auth UI

## Stage 1 - Scope
- PW-AU-S1-001: Platform: Patient Web.
- PW-AU-S1-002: Source app: /Users/test/Code/V/apps/patient-web/src/App.tsx.
- PW-AU-S1-003: Agent goal: inspect sign-in, callback, session, and recovery authentication surfaces.

## Stage 2 - Screens And Phases
- PW-AU-S2-001: Sign-in entry.
- PW-AU-S2-002: Auth callback.
- PW-AU-S2-003: Confirming details.
- PW-AU-S2-004: Consent declined.
- PW-AU-S2-005: Higher assurance required.
- PW-AU-S2-006: Safe re-entry.
- PW-AU-S2-007: Session expired.
- PW-AU-S2-008: Clean signed-out state.

## Stage 3 - UI/UX Bug Checks
- PW-AU-S3-001: Verify auth state copy explains what happened and what the patient can do next.
- PW-AU-S3-002: Verify pending/callback states avoid dead ends and show progress without layout shift.
- PW-AU-S3-003: Verify session-expired and signed-out actions are visually distinct from destructive actions.
- PW-AU-S3-004: Verify focus lands on the primary message or first actionable control after redirects.
