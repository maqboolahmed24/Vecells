# 247 Patient Thread Visibility And Redaction Controls

`247` closes two security-sensitive gaps in the Phase 3 conversation loop.

## 1. Preview depth is not inferred

`PatientCommunicationVisibilityProjection` is the only preview-depth authority for the patient thread.

Allowed modes are:

- `public_safe_summary`
- `authenticated_summary`
- `step_up_required`
- `suppressed_recovery_only`

The cluster is never hidden just because content is redacted. Public-safe, step-up, and suppressed states keep a placeholder contract and safe continuation guidance so the patient can see that governed work still exists.

## 2. Receipt facts stay separate

`PatientReceiptEnvelope` preserves:

- local acknowledgement
- transport acceptance
- delivery evidence
- delivery risk
- authoritative outcome

Send success does not imply settled calmness. Local acknowledgement does not imply provider acceptance. Provider acceptance does not imply delivery or review completion. Calm reviewed or settled wording is allowed only when the current tuple still agrees.

## 3. Repair and step-up fail closed

If preview posture is `step_up_required` or `suppressed_recovery_only`, the thread does not widen content locally. If continuity evidence or request-lineage tuple drift is stale, the thread freezes into placeholder or pending posture instead of rendering settled copy.

Reachability repair remains authoritative:

- repair notice rows are explicit
- repair journeys do not become hidden mutable flags
- callback or message route failure keeps the conversation visible but bounded

## 4. Legacy history cannot calm the thread

Backfilled callback or clinician-message rows enter through placeholder or recovery posture first. Legacy history cannot claim calm settled copy until the canonical tuple is coherent on the current request lineage.
