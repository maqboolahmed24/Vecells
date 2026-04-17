# 68 Identity Access Append Only Rules

## Binding rules

- Every binding transition appends a new immutable binding version with `supersedesBindingRef`; prior rows are not rewritten into new patient truth.
- `patientRef` remains nullable until the latest settled binding version carries a durable patient decision.
- `Request.patientRef` and `Episode.patientRef` are derived projections only. If they diverge from the current binding row, validation fails.
- `correction_applied` and `revoked` binding decisions require explicit repair-case, freeze, and release references at the authority boundary.

## Grant rules

- Every redeemable grant carries exactly one immutable `AccessGrantScopeEnvelope`.
- Family-specific validator namespaces and replay policies are frozen in code through `accessGrantFamilyPolicies`.
- URL-borne tokens store only `tokenHash`; raw tokens never appear in the generated manifest or persisted examples.
- One-time and rotating grants collapse duplicate presentation to the same redemption or supersession settlement instead of executing a second side effect.
- Replacement, repair, logout, and revoke outcomes settle through explicit supersession rows before older grants stop being authoritative.

## Demonstration validator closure

The generated validator pack reports:

- pass: derived patient scope stays inside the latest binding version
- pass: grants cannot widen route or runtime scope beyond their immutable scope envelope
- pass: exact-once redemption holds for one-time and rotating families
- pass: superseded grants do not remain live implicitly
