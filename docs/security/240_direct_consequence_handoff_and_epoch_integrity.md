# 240 Direct Consequence Handoff And Epoch Integrity

## Core control points

`240` enforces four security boundaries:

1. `decisionEpochRef` is mandatory on every downstream seed, artifact, and patient-status write.
2. Approval-required consequence cannot launch without checkpoint truth for the live epoch.
3. `BookingIntent` and `PharmacyIntent` must be born with their matching proposed `LineageCaseLink`.
4. outbox publication is not treated as final completion.

## Approval posture

The consequence orchestrator reads the current endpoint approval posture and fails closed when the checkpoint is not approved for the live epoch.

That blocks:

- direct resolution without approval
- handoff seed generation without approval
- stale checkpoint reuse across superseded epochs

The implementation keeps the approval gate explicit instead of inferring success from UI posture.

## Stale epoch handling

If a consequence source epoch is superseded:

- seed state becomes `recovery_only`
- artifact state becomes `recovery_only`
- pending publication effects are cancelled
- a recovery-only patient update is written

This is the security boundary that closes the stale-epoch launch gap.

## Navigation and publication

`TriageOutcomePresentationArtifact` is summary-first. Unsupported export or cross-app exit must later consume a bounded `OutboundNavigationGrant`; the seed tables themselves do not assume detached navigation authority.

Publication is outbox-safe and compensating. A queued publication effect is not proof of downstream ownership acknowledgement.

## Mock-now limits

Downstream callback, clinician-message, self-care, and admin execution remains simulator-backed in `240`.

That is an explicit boundary, not hidden behavior. The authoritative truth in this task is the typed seed plus lineage plus epoch tuple, not the simulator dispatch.
