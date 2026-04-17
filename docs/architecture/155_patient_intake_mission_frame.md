# 155 Patient Intake Mission Frame

## Mission
Publish the first real Phase 1 patient intake shell: one premium same-shell mission frame that later request-type, question, upload, contact, urgent, receipt, and recovery routes inherit without redesign.

## Shell Identity
- visual mode: `Quiet_Clarity_Mission_Frame`
- route family: `rf_intake_self_service`
- shell continuity key: `patient.portal.requests`
- required entry alias: `/start-request`
- preserved contract entry: `/intake/start`

## Implemented Anatomy
The shell now renders one governed vertical order:
1. `MissionFrameMasthead`
2. `AmbientStateRibbon`
3. `MissionFrameBody`
4. `FooterActionTray`

Desktop keeps the full three-region mission frame:
- `ProgressConstellationRail` at `112px`
- `QuestionCanvas` at `minmax(0, 720px)`
- `SummaryPeekPanel` at `332px`

Tablet and mobile fold the same shell into `mission_stack`. The summary panel becomes a drawer or sheet, but the continuity key, masthead, status strip, and action tray remain the same surface rather than a separate mobile information architecture.

## Seeded Route Family
| Route key | Implemented route | Contract alias | Dominant action |
| --- | --- | --- | --- |
| landing | `/start-request` | `/intake/start` | Start request |
| request_type | `/start-request/:draftPublicId/request-type` | `/intake/drafts/:draftPublicId/request-type` | Continue |
| details | `/start-request/:draftPublicId/details` | `/intake/drafts/:draftPublicId/details` | Save and continue |
| supporting_files | `/start-request/:draftPublicId/files` | `/intake/drafts/:draftPublicId/supporting-files` | Continue |
| contact_preferences | `/start-request/:draftPublicId/contact` | `/intake/drafts/:draftPublicId/contact-preferences` | Review your request |
| review_submit | `/start-request/:draftPublicId/review` | `/intake/drafts/:draftPublicId/review` | Submit request |
| resume_recovery | `/start-request/:draftPublicId/recovery` | `/intake/drafts/:draftPublicId/recovery?resumeToken=:resumeToken` | Resume safely |
| urgent_outcome | `/start-request/:draftPublicId/urgent-guidance` | `/intake/requests/:requestPublicId/urgent-guidance` | Call 999 now |
| receipt_outcome | `/start-request/:draftPublicId/receipt` | `/intake/requests/:requestPublicId/receipt` | Track request status |
| request_status | `/start-request/:draftPublicId/status` | `/intake/requests/:requestPublicId/status` | Refresh status |

## Composition Decisions
- The shell deliberately does not use a generic numeric wizard or detached success template.
- The left rail is a quiet orbital constellation, not a commodity stepper.
- The center canvas is one large panel with one dominant question or outcome surface at a time.
- The right panel is a compact recap and provenance region. It never dominates the active step.
- Save, freshness, and resume posture all stay singular inside the quiet ribbon. No toast or banner duplication is allowed.

## Mock-Now Contract
- mock data binds the real `IntakeDraftView` vocabulary from `@vecells/domain-identity-access`
- the shell preserves the real anchor grammar: `request-start`, `request-proof`, `request-return`
- urgent guidance, receipt, and resume are already same-shell placeholders rather than deferred page concepts
- the `/start-request` family is implemented as a published alias over the seq_139 `/intake/...` contract so the app can satisfy the task requirement without silently rewriting the prior contract layer

## Verification Surface
- app runtime: `apps/patient-web/src/patient-intake-mission-frame.tsx`
- typed model: `apps/patient-web/src/patient-intake-mission-frame.model.ts`
- layout contract: `data/analysis/155_mission_frame_layout_contract.json`
- state and anchor matrix: `data/analysis/155_mission_frame_state_and_anchor_matrix.csv`
- gallery: `docs/frontend/155_patient_intake_mission_frame_gallery.html`
- browser proof: `tests/playwright/155_patient_intake_mission_frame.spec.js`

## Acceptance Notes
- same-shell step changes preserve masthead, ribbon, selected anchor, and continuity key
- reduced motion keeps the same state order and meaning
- the mobile tray is sticky and focus-safe
- every gallery diagram ships with table parity
