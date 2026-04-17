# Signed-In Request Ownership And Patient-Ref Derivation

`SignedInRequestOwnershipService` is the Phase 2 orchestration layer for authenticated request starts, public-to-authenticated draft claims, and post-submit uplift. It does not become a second request system. Public and signed-in starts both resolve to one `RequestLineageOwnershipRecord` keyed by `draftPublicId`, `requestLineageRef`, `SubmissionEnvelope`, `continuityShellRef`, `continuityAnchorRef`, `requestShellRef`, `RouteIntentBinding`, and `lineageFenceRef`.

## Ownership Model

The durable owner fields are `currentSubjectRef`, `currentOwnerSubjectRef`, `subjectBindingVersionRef`, `sessionEpochRef`, `routeIntentBindingRef`, `lineageFenceRef`, `ownershipPosture`, and `writableAuthorityState`. Signed-in draft creation records `SignedInRequestStartRecord` and attaches session/binding references, but it does not derive `Request.patientRef` or `Episode.patientRef`.

Pre-submit claim writes an `AuthenticatedOwnershipAttachmentRecord` against the same `draftPublicId`, same `SubmissionEnvelope`, same continuity shell, and same continuity anchor. It consumes the canonical `AccessGrantService` supersession seam to narrow public grants and calls `SessionGovernor` when writable scope changes require session rotation. The claim then calls `IdentityBindingAuthority` to settle ownership and derive patient references.

Post-submit uplift writes an `AuthenticatedUpliftMappingRecord` to the existing request shell. The mapping has `clonedRequestCreated = false`, carries `requestLineageRef`, and returns the same shell or a same-shell recovery route. It does not create a duplicate episode, duplicate request, or generic home redirect.

## Patient-Ref Derivation

`IdentityBindingAuthority` remains the sole authority for binding versions, binding state, ownership state, and derived patient refs. `Request.patientRef` and `Episode.patientRef` are represented in this layer as `requestPatientRef` and `episodePatientRef`, and they only advance when an `AuthorityPatientRefDerivationSettlement` records:

- `authoritySettlementRef`
- previous and next `subjectBindingVersionRef`
- previous and next request/episode patient refs
- `transactionBoundary = identity_binding_authority_request_episode_patient_refs`
- reason codes `SRO_184_AUTHORITY_DERIVED_PATIENT_REF_ONLY` and `SRO_184_REQUEST_EPISODE_PATIENT_REF_SAME_TRANSACTION`

This closes direct patientRef writes by making every lineage patient-ref update dependent on the binding authority settlement and by keeping request and episode derivation in one transaction-shaped record.

## Continuity And Recovery

Every writable continuation checks the tuple `(sessionEpochRef, subjectBindingVersionRef, routeIntentBindingRef, lineageFenceRef, subjectRef)`. Stale sessions, stale binding versions, subject switches, route-intent tuple drift, and lineage-fence drift write an `OwnershipDriftFenceRecord` and degrade to `recovery_shell` or `claim_pending_shell`.

The route continuity contract is intentionally conservative:

- signed-in draft start: `same_draft_shell`
- pre-submit claim: `same_draft_shell`
- post-submit uplift: `same_request_shell`
- stale or mismatched tuple: `recovery_shell`
- subject switch requiring confirmation: `claim_pending_shell`

This preserves public-to-authenticated uplift continuity while refusing optimistic writable access when any authority tuple is stale.

## Integration Seams

`SignedInRequestOwnershipService` depends on ports rather than local authority shortcuts:

- `IdentityBindingAuthorityOwnershipPort` settles binding/ownership and returns authority-derived request/episode patient refs.
- `AccessGrantOwnershipPort` supersedes or narrows public grants after claim using canonical grant service semantics.
- `SessionGovernorOwnershipPort` rotates sessions when writable authority changes.
- `RouteIntentOwnershipPort` maps same-shell continuation and recovery routes without generic redirects.

These seams consume the coherent Phase 2 artifacts from `par_176`, `par_179`, and `par_181`, so no `PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP.json` artifact is needed.

## Gap Closures

- `PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_ONE_LINEAGE_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_AUTHORITY_DERIVED_PATIENT_REF_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_PRE_SUBMIT_CLAIM_CONTINUITY_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_POST_SUBMIT_UPLIFT_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_RACE_SAFE_MAPPING_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_STALE_FENCING_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_REQUEST_OWNERSHIP_SAME_SHELL_RECOVERY_V1`
