# 311 Phase 5 Hub Case And Acting Context Contract

Contract version: `311.phase5.hub-core-freeze.v1`

This document freezes the opening Phase 5 hub-domain contract pack. The hub is not a loose Phase 4 booking exception. It is a child lineage branch with its own durable aggregate, state machine, ownership fence, and acting-context law.

## Aggregate boundary

| Contract | Purpose | Non-negotiable law |
| --- | --- | --- |
| `NetworkBookingRequest` | Single executable booking-to-hub handoff. | Must preserve `requestLineageRef`, origin booking refs, origin practice identity, patient constraints, and `reasonForHubRouting`. |
| `HubCoordinationCase` | Durable hub aggregate and state machine root. | Must open one child `LineageCaseLink(caseFamily = hub)` under the booking branch and never overwrite the booking lineage link. |
| `StaffIdentityContext` | Authenticated staff identity frame. | Freezes `authProvider = cis2`; raw RBAC claims remain necessary but insufficient. |
| `ActingContext` | Current organisation, purpose-of-use, and audience envelope for commands. | Every write carries `scopeTupleHash`, audience tier, minimum-necessary contract, and drift state. |
| `CrossOrganisationVisibilityEnvelope` | Materialized minimum-necessary visibility contract. | Cross-org visibility may never be inferred from frontend state or role labels alone. |
| `CoordinationOwnership` | Live ownership fence and lease posture. | Only one live ownership lease may exist per case; stale-owner recovery is explicit and blocks close. |

## Lineage carry-forward

1. `BookingCase.lineageCaseLinkRef` remains the canonical Phase 4 booking branch.
2. Hub entry opens one child `LineageCaseLink(caseFamily = hub, parentLineageCaseLinkRef = origin booking link)`.
3. `NetworkBookingRequest`, `HubCoordinationCase`, fallback linkage, patient visibility, and practice acknowledgement all bind the same `requestLineageRef`.
4. Hub fallback may never overwrite the booking lineage link or infer continuity from foreign keys alone.

## Operational state families

| Family | States | Meaning |
| --- | --- | --- |
| Intake and Queue | `hub_requested`, `intake_validated`, `queued` | The network request is being validated, policy-scoped, and admitted into the hub queue under preserved booking lineage. |
| Coordination | `claimed`, `candidate_searching`, `candidates_ready`, `coordinator_selecting` | Ownership, candidate discovery, and coordinator decision-making are active inside the hub shell. |
| Patient Choice | `alternatives_offered`, `patient_choice_pending` | A governed offer pack exists, the full open-choice set is visible, and stale mutations are blocked by tuple drift. |
| Commit and Truth | `candidate_revalidating`, `native_booking_pending`, `confirmation_pending`, `booked_pending_practice_ack`, `booked` | A selected candidate is revalidated, committed, and then held in acknowledgement debt until origin-practice visibility is satisfied. |
| Fallback and Return | `callback_transfer_pending`, `callback_offered`, `escalated_back` | The hub has switched from direct coordination to callback or return-to-practice continuity, but the case stays supervised until linkage is durable. |
| Completion | `closed` | Closure is permitted only after ownership, truth, fallback, and acknowledgement blockers are all clear. |

Operational status is intentionally narrower than cross-surface truth:

- Patient reassurance comes from `HubOfferToConfirmationTruthProjection.patientVisibilityState`, not raw `HubCoordinationCase.status`.
- Practice visibility comes from `HubOfferToConfirmationTruthProjection.practiceVisibilityState` plus current-generation acknowledgement evidence.
- Closeability comes from `HubOfferToConfirmationTruthProjection.closureState` plus `OpenCaseBlockers(h) = empty`, not from booked or callback posture alone.

## Ownership and close law

1. Hub ownership is lease-based and fenced. Every claim, transfer, supervisor takeover, commit, return, and close must present the current `ownershipFenceToken` and `ownershipEpoch`.
2. Lease expiry does not silently close or reassign the case. It creates governed stale-owner recovery and keeps the case visible.
3. `OpenCaseBlockers(h)` must include live ownership lease, live ownership transition, truth blockers, callback or return linkage blockers, continuity-evidence blockers, unresolved supplier drift, and active identity-repair blockers.
4. `HubCoordinationCase.status = closed` is legal only when `OpenCaseBlockers(h)` is empty and `LifecycleCoordinator` has persisted the governing close decision.

## Same-shell continuity law

1. `/hub/queue`, `/hub/case/:hubCoordinationCaseId`, `/hub/alternatives/:offerSessionId`, `/hub/exceptions`, and `/hub/audit/:hubCoordinationCaseId` are one hub shell family.
2. Case detail is the same-shell root. Alternatives and audit are bounded child routes; exceptions is a same-shell peer workbench.
3. Deep links, refresh, and back-forward navigation must reopen the current hub shell and selected case anchor rather than reconstructing detached booking or callback pages.
4. Every hub route family must publish one `FrontendContractManifest`, one exact `ProjectionContractVersionSet`, and one `projectionCompatibilityDigestRef`.

## Typed later-owned seams

| Typed seam file | Owner | Why it exists |
| --- | --- | --- |
| PHASE5_INTERFACE_GAP_HUB_CORE_POLICY_AND_CAPACITY.json | `seq_312` | Freeze the later-owned policy tuple, candidate snapshot, and ranking inputs already referenced by HubCoordinationCase without backfilling them with informal placeholders. |
| PHASE5_INTERFACE_GAP_HUB_CORE_CANDIDATE_AND_OFFER.json | `seq_312` | Freeze the alternative-offer and direct-candidate references consumed by the 311 state machine and route family without inventing surrogate status names. |
| PHASE5_INTERFACE_GAP_HUB_CORE_COMMIT_AND_CONFIRMATION.json | `seq_313` | Freeze the commit-attempt and monotone confirmation-truth seams so 313 must implement the same names and fences already referenced by 311. |
| PHASE5_INTERFACE_GAP_HUB_CORE_FALLBACK_AND_VISIBILITY.json | `seq_313` | Freeze the practice-visibility and fallback-linkage objects that already block close in 311 while leaving implementation depth to later Phase 5 tracks. |

These seam files exist so later Phase 5 tasks extend the 311 vocabulary instead of inventing substitute state names or placeholder case fields.
