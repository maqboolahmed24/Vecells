# par_163 Sign-In Uplift, Refresh, and Resume Postures

`par_163` publishes the Phase 1 same-shell access-change law for the patient intake mission frame.

## Outcome

The patient shell now preserves one request lineage across:

- anonymous-to-auth uplift
- auth return with narrower authority
- claim-pending narrowing
- identity hold and rebind-required recovery
- embedded or manifest drift
- stale draft token presentation after promotion

The shell does not redirect to a generic login, continue, or home page when continuity is still lawful. It preserves the mission frame, selected anchor, and last-safe context, then narrows what is visible until `AccessGrantScopeEnvelope`, `PatientNavReturnContract`, `RecoveryContinuationToken`, and the continuity projections agree again.

## Posture Family

The runtime contract is [163_patient_action_recovery_surface_contract.json](/Users/test/Code/V/data/contracts/163_patient_action_recovery_surface_contract.json).

Authoritative postures:

1. `uplift_pending`
2. `read_only_return`
3. `claim_pending`
4. `identity_hold`
5. `rebind_required`
6. `embedded_drift`
7. `stale_draft_mapped_to_request`

Each posture renders inside the existing `Quiet_Clarity_Mission_Frame` and uses the same shell continuity key `patient.portal.requests`.

## Laws

- same-shell continuity is preserved whenever the route family and lineage are still lawful.
- Narrowed authority withholds writable controls and PHI-bearing summaries until the relevant fences succeed.
- `stale_draft_promoted` never reopens mutable draft editing. It maps to receipt or request status in the same shell.
- Embedded or manifest drift renders a bounded recovery frame instead of resetting the shell.
- Focus lands on the posture title or dominant action after a major access change.
- Reduced-motion mode preserves the same content and control order.

## Bound Gap Closures

- `GAP_RESOLVED_ACCESS_POSTURE_COPY_SAME_SHELL_V1`
- `GAP_RESOLVED_ACCESS_POSTURE_COPY_REBIND_V1`
- `GAP_RESOLVED_ACCESS_POSTURE_COPY_STALE_PROMOTION_V1`

These close the remaining patient-facing copy gaps without weakening the shell continuity law.

## Artifact Index

- [163_access_change_and_recovery_gallery.html](/Users/test/Code/V/docs/frontend/163_access_change_and_recovery_gallery.html)
- [163_same_shell_rebind_and_return_flow.mmd](/Users/test/Code/V/docs/frontend/163_same_shell_rebind_and_return_flow.mmd)
- [163_access_posture_matrix.csv](/Users/test/Code/V/data/analysis/163_access_posture_matrix.csv)
- [163_refresh_resume_and_stale_token_cases.csv](/Users/test/Code/V/data/analysis/163_refresh_resume_and_stale_token_cases.csv)
