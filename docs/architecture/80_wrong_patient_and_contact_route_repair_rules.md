# 80 Wrong Patient And Contact Route Repair Rules

Task: `par_080`

## Non-negotiable rules

- Wrong-patient correction must open `IdentityRepairCase`. It must not rewrite `Request.workflowState`.
- `IdentityRepairFreezeRecord` is the exact-once repair barrier for sessions, grants, route-intent hooks, communications hold, and patient/staff read posture.
- `IdentityRepairReleaseSettlement` is the only authority that may clear a repair hold and mint fresh continuity.
- `ReachabilityGovernor` is the only service allowed to settle current route-health and delivery-risk posture.
- Send acceptance and transport acknowledgements are weak observations only. They may never stand in for verified route truth.
- Contact-route repair must stay in the same shell via `ContactRouteRepairJourney`; generic settings detours are not release authority.

## Wrong-patient repair flow

1. Append one immutable `IdentityRepairSignal`.
2. Reuse or open one active `IdentityRepairCase` keyed to the frozen binding.
3. Commit one `IdentityRepairFreezeRecord` under compare-and-set.
4. Add the repair case to episode/request blocker posture and freeze outward comms.
5. Supersede matching live grants and route-intent hooks before any recovery continues.
6. Materialize one `IdentityRepairBranchDisposition` per affected downstream branch.
7. Record supervisor and independent review before correction authority proceeds.
8. Settle the corrected binding through `IdentityBindingAuthority`, not by mutating the repair case.
9. Rebuild projections and branch outcomes against the corrected binding.
10. Release only after every branch is rebuilt or explicitly released.
11. Clear blockers only through `IdentityRepairReleaseSettlement`.

## Reachability repair flow

1. Freeze the current `ContactRouteSnapshot`.
2. Append `ReachabilityObservation` rows for bounce, mismatch, opt-out, dispute, verification, or manual confirmation.
3. Recompute one append-only `ReachabilityAssessmentRecord` when posture materially changes.
4. If posture is not clear, open one `ContactRouteRepairJourney`.
5. Collect the candidate route in the same shell.
6. Issue one `ContactRouteVerificationCheckpoint`.
7. Only verification success plus a fresh snapshot plus a clear assessment may reopen the original action.
8. Expired, failed, or disputed verification stays inside the repair shell and never silently restores the prior route.

## Branch disposition law

- `suppress_visibility`
  Use when the branch only rendered local or cached state and can safely stay hidden until release.
- `revalidate_under_new_binding`
  Use when the branch may resume only if the corrected binding and current route posture still allow it.
- `compensate_external`
  Use when an external side effect already escaped and bounded compensation must be recorded before release.
- `manual_review_only`
  Use when the branch must remain human-governed even after the corrected binding settles.

## Release-mode law

- `read_only_resume`
  The shell may reopen for visibility but not mutation.
- `claim_pending_resume`
  The shell resumes only after fresh claim proof.
- `writable_resume`
  Writable continuity may resume because the corrected binding, branch set, and route posture are all current.
- `manual_follow_up_only`
  The shell remains non-writable and diverts to human follow-up.

## Source traceability

- `blueprint/phase-0-the-foundation-protocol.md#1.5 IdentityRepairCase`
- `blueprint/phase-0-the-foundation-protocol.md#1.5A IdentityRepairFreezeRecord`
- `blueprint/phase-0-the-foundation-protocol.md#1.5B IdentityRepairBranchDisposition`
- `blueprint/phase-0-the-foundation-protocol.md#1.5C IdentityRepairReleaseSettlement`
- `blueprint/phase-0-the-foundation-protocol.md#1.9A ContactRouteRepairJourney`
- `blueprint/phase-0-the-foundation-protocol.md#1.9B ContactRouteVerificationCheckpoint`
- `blueprint/phase-0-the-foundation-protocol.md#5.6 Wrong-patient correction algorithm`
- `blueprint/phase-0-the-foundation-protocol.md#7.1.2 Reachability-risk function`
- `prompt/shared_operating_contract_076_to_085.md#For task 080`
