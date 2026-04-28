# 368 Pharmacy Notification And Status Rules

## Source of truth

Patient and staff notifications now derive from the same `PharmacyLoopMergeSnapshot` used by request detail, patient messages, staff-entry cards, and operations visibility.

## Rules by merge state

### `dispatch_pending`

- Patient message state: `Pending confirmation`
- Browser posture: pending handoff / dispatch surface
- Calm copy: forbidden
- Required behavior: keep the case visible, keep the request anchor visible, do not imply provider acceptance or final settlement

### `urgent_return`

- Patient message state: the current urgent-return notification label from the bounce-back recovery preview
- Browser posture: urgent return / review next steps
- Calm copy: forbidden
- Required behavior: preserve the original request anchor, keep bounce-back provenance visible, promote operations visibility

### `completed`

- Patient message state: `Outcome recorded`
- Browser posture: completed / settled outcome
- Calm copy: allowed only after the message state and patient status route both say the outcome is recorded
- Required behavior: keep the result request-led and auditable; do not create a detached pharmacy-only completion history

## Staff notification rule

Staff notifications must use the merge snapshot’s staff notification channel and state. Ops and staff-entry may not invent a new label that differs from the underlying pharmacy merge state.

## Contradiction rules

- A patient message may not say the work is complete while the patient status route is still pending or urgent.
- Operations may not hide urgent return while request detail and messages still show reopen or bounce-back posture.
- Support replay may not describe a different anchor from the one shown in request detail and the message braid.
