# 115 Patient Shell Seed Routes

## Outcome
`apps/patient-web` now hosts the authoritative Phase 0 patient shell seed. The shell is route-aware, same-shell by default, manifest-guarded, continuity-preserving, and styled as a calm patient-first product surface rather than a generic dashboard.

## Shell law applied
- The masthead keeps the patient identity summary and the subtle `Signal Atlas Live` mark secondary to route work.
- Primary navigation is fixed to five patient sections: `Home`, `Requests`, `Appointments`, `Health record`, and `Messages`.
- The section header frame stays below nav and above state truth so route identity does not collapse into a generic page title.
- `SharedStatusStrip`, `CasePulse`, selected-anchor chips, guard posture, and `DecisionDock` all derive from the same manifest/runtime tuple instead of local component guesses.
- Wide layouts keep one dominant content surface plus one support rail. Narrow layouts degrade into the same mission-stack order without reordering shell landmarks.

## Seed Route Matrix
| Section | Route family | Paths | Posture seed | Continuity proof |
| --- | --- | --- | --- | --- |
| Home | `rf_patient_home` | `/home` | `live` | Attention-first spotlight and quiet-home variant share the same shell and status law. |
| Requests | `rf_patient_requests` | `/requests`, `/requests/:requestId` | `live` | List/detail continuity stays in one route family and preserves the selected request anchor. |
| Appointments | `rf_patient_appointments` | `/appointments` | `read_only` | Booking truth stays calm and specific without inventing writable manage flows. |
| Health record | `rf_patient_health_record` | `/records`, `/records/:recordId/follow-up` | `live` | Record-origin follow-up stays summary-first and return-safe. |
| Messages | `rf_patient_messages` | `/messages`, `/messages/thread/:threadId` | `live` or `stale_review` | Thread continuity remains in-shell and blocked reply posture suppresses false reassurance. |
| Recovery | `rf_patient_secure_link_recovery` | `/recovery/secure-link` | `recovery_only` | Repair posture stays in the same shell instead of ejecting to an error page. |
| Embedded | `rf_patient_embedded_channel` | `/home/embedded` | `recovery_only` | Missing embedded host capabilities fail closed with preserved summary context. |

## Route-specific notes
- `Home` is mission-first, not KPI-first. It promotes one dominant task and keeps quiet-home as a true calm state.
- `Requests` presents bucketed list posture with distinct `reply_needed`, `awaiting_review`, `in_progress`, and `blocked_repair` rows.
- `Appointments` keeps the itinerary visible while mutation authority remains fenced by the read-only tuple.
- `Health record` includes a bounded trend visualization with a table fallback and routes follow-up work through `ArtifactSurfaceFrame`.
- `Messages` avoids consumer-chat framing and uses `SurfaceStateFrame` when blocked-contact posture must remain calm but explicit.

## Gap resolutions recorded in this seed
- `GAP_RESOLUTION_PATIENT_COPY_QUIET_HOME`
  Quiet-home copy is intentionally reassuring but still tied to reachable next steps and never phrased as “all clear forever.”
- `GAP_RESOLUTION_PATIENT_COPY_APPOINTMENTS_READ_ONLY`
  Appointment language stays specific to held, pending, waitlist, and recovery-safe states until live booking proofs exist.
- `GAP_RESOLUTION_PATIENT_COPY_BLOCKED_CONTACT_THREAD`
  Blocked message threads preserve readable conversation context but suppress any copy that implies reply readiness or completed review.
- `GAP_RESOLUTION_PATIENT_COPY_RECORD_FOLLOW_UP`
  Record follow-up is intentionally bounded to summary, parity, and return-safe continuity until live question workflows land.

## Implementation references
- App shell: `apps/patient-web/src/patient-shell-seed.tsx`
- Seed projections and mock bindings: `apps/patient-web/src/patient-shell-seed.model.ts`
- Local patient styling: `apps/patient-web/src/patient-shell-seed.css`
- Browser-safe route guard and shell helpers: `packages/persistent-shell/src/route-guard-plumbing.tsx`

