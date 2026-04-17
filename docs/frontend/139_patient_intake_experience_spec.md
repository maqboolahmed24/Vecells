# 139 Patient Intake Experience Spec

## Surface Mode
`Patient_Intake_Mission_Frame`

## Experience Thesis
This is one calm same-shell mission frame, not a generic wizard. The patient should always know:
- what question is being asked now,
- what has been saved authoritatively,
- how to leave for urgent help,
- and how the next safe action relates to the same request lineage.

## Mock Now Execution
Mock_now_execution uses simulator-backed runtime/publication tuples and browser-only self-service. The surface still behaves like a premium healthcare intake shell rather than a placeholder form.

## Actual Production Strategy Later
Actual_production_strategy_later may narrow host chrome for embedded or authenticated contexts, but it must keep the same mission-frame hierarchy, same-shell continuity law, and same public contract set.

## Visual Direction
- restrained Vecells wordmark in the header
- one small inline `intake_path` SVG near the title
- outer canvas max width `1280px`
- centered mission-frame content column `720px`
- recap column `280px`, collapsing into a peek drawer in `mission_stack`
- header band `72px`
- emergency escape strip immediately below the header
- sticky footer action bar `72px` on compact/mobile

## Interaction Law
- one dominant question or decision per step
- one dominant CTA per step
- helper copy lives in one bounded helper region and replaces itself rather than stacking
- quiet status strip is singular; no banner plus toast duplication
- urgent diversion morphs the active step in place and keeps the same shell frame
- validation is local to the field group and never resets scroll or anchor
- `mission_stack` is the same shell folded for narrow screens, not a separate mobile IA

## Motion
- `140ms` step morphs and recap-chip updates
- `180ms` status-strip settle transitions
- `220ms` recap drawer reveal
- reduced-motion mode removes sliding page replacement while preserving parity

## Step Controls
| Step | Primary CTA | Selected anchor | Quiet status state |
| --- | --- | --- | --- |
| Landing and service explanation | Start your request | request-start | draft_not_started |
| Request type | Continue | request-start | Saved posture derives from DraftSaveSettlement plus DraftContinuityEvidenceProjection only. |
| Details | Save and continue | request-proof | Saved posture derives from DraftSaveSettlement plus DraftContinuityEvidenceProjection only. |
| Supporting files | Continue | request-proof | Quiet strip stays singular; no toast and banner duplication. |
| Contact preferences | Review your request | request-return | Saved posture derives from DraftSaveSettlement plus DraftContinuityEvidenceProjection only. |
| Review and submit | Submit request | request-return | submitting_authoritative |
| Resume recovery | Resume safely | request-return | resume_safely |
| Urgent advice outcome | Get urgent help now | request-return | outcome_authoritative |
| Receipt outcome | Track request status | request-return | receipt_authoritative |
| Track my request | Refresh status | request-return | status_authoritative |

## Quiet-clarity Rules
- The emergency strip is always visible, but quiet.
- Recap content appears as compact chips or a slim peek card, never as a dashboard.
- The receipt outcome and urgent outcome inherit the same shell continuity key and status strip placement.
- The status page stays intentionally minimal: one timeline, one current state, one next-step message.

## Accessibility and Content
- Primary type resolves through canonical design tokens with fallback `Inter, system-ui, sans-serif`.
- Landmarks are fixed: one `header`, one `nav`, one `main`, one `aside`.
- Keyboard traversal must cover the full step rail, recap drawer, and outcome views.
- Reduced-motion parity is mandatory.
- Copy stays plain, bounded, and non-clinical where possible.
