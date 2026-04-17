# Scope Envelope And Route Authorization Controls

Task: `par_180_phase2_track_identity_build_capability_decision_engine_and_scope_envelope_rules`

## Deny By Default

Unknown routes deny with `CAP_180_UNKNOWN_ROUTE_PROFILE_DENIED`. The gateway, BFF, controller, worker, and frontend guard layers must not infer capability from URLs, route names, cached shell state, or grant possession.

`CapabilityDecisionEngine` centralizes route trust evaluation and closes `IAR_170_ROUTE_PROFILE_REQUIRED`.

## Capability Is Not Write Authority

`CapabilityDecision(decisionState = allow)` is necessary but not sufficient for writes. Mutable paths still need:

- current `RouteIntentBinding`
- active `Session`
- current `SessionEstablishmentDecision`
- current subject-binding version from `IdentityBindingAuthority`
- current session epoch from `SessionGovernor`
- current lineage fence
- current `AccessGrantScopeEnvelope` when grant-backed
- current release, manifest, embedded, and channel posture when applicable

Decision records enforce `identityBindingMutation = none` and `capabilityIsCeilingOnly = true`. They never mutate `IdentityBinding`, `Request.patientRef`, `Episode.patientRef`, ownership state, grant state, or command settlement state.

## Scope Envelope Drift Controls

`AccessGrantScopeEnvelope` is immutable. `authorizeScopeEnvelope()` compares it to the current route tuple on every grant-backed request.

Drift fields:

| Field                                | Reason code                              |
| ------------------------------------ | ---------------------------------------- |
| `grantFamily`                        | `CAP_180_SCOPE_GRANT_FAMILY_DRIFT`       |
| `routeFamily`                        | `CAP_180_SCOPE_ROUTE_FAMILY_DRIFT`       |
| `actionScope`                        | `CAP_180_SCOPE_ACTION_SCOPE_DRIFT`       |
| `governingObjectRef`                 | `CAP_180_SCOPE_GOVERNING_OBJECT_DRIFT`   |
| `governingObjectVersionRef`          | `CAP_180_SCOPE_GOVERNING_VERSION_DRIFT`  |
| `sessionEpochRef`                    | `CAP_180_SCOPE_SESSION_EPOCH_DRIFT`      |
| `subjectBindingVersionRef`           | `CAP_180_SCOPE_BINDING_VERSION_DRIFT`    |
| `lineageFenceRef`                    | `CAP_180_SCOPE_LINEAGE_FENCE_DRIFT`      |
| `releaseApprovalFreezeRef`           | `CAP_180_SCOPE_RELEASE_POSTURE_DRIFT`    |
| `manifestVersionRef`                 | `CAP_180_SCOPE_MANIFEST_POSTURE_DRIFT`   |
| `channelPosture`                     | `CAP_180_SCOPE_CHANNEL_POSTURE_DRIFT`    |
| `audienceScope` or `visibilityScope` | `CAP_180_SCOPE_AUDIENCE_DRIFT`           |
| expiry                               | `CAP_180_SCOPE_EXPIRED`                  |
| supersession                         | `CAP_180_SCOPE_SUPERSEDED`               |
| redemption state                     | `CAP_180_SCOPE_REDEMPTION_STATE_BLOCKED` |

The authorizer returns `authorized`, `recover_only`, or `deny`. It never partially allows by ignoring mismatches.

## Replay Safety

Scope authorization is keyed by idempotency key. Duplicate checks return the existing record with `CAP_180_SCOPE_REPLAY_RETURNED` rather than creating multiple policy outcomes.

This supports later exact-once `AccessGrantRedemptionRecord` and `AccessGrantSupersessionRecord` workflows without inventing controller-local replay behavior.

## Stale Fence Behavior

Stale session epoch, stale subject-binding version, stale lineage fence, expired evidence, manifest drift, and channel freeze never produce optimistic allow. If same-lineage recovery is valid and the route profile supports it, the engine returns `recover_only`; otherwise it returns `deny`.

## Logging And Privacy

Decision and authorization records may include refs, hashes, route tuple hashes, policy versions, reason codes, edge correlation ids, binding version refs, session epoch refs, and lineage fence refs.

They must not include raw claims, tokens, NHS numbers, full contact details, request free text, attachment content, raw PHI, or provider payloads. This follows OWASP authorization and logging guidance and the task `170` evidence-vault boundary.

## Operational Invariants

- `CapabilityDecisionEngine` owns route capability evaluation.
- `IdentityBindingAuthority` owns durable binding and derived patient refs.
- `AccessGrantService` owns grant issuance, redemption, revocation, and supersession.
- `SessionGovernor` owns local session epoch and session posture.
- Controllers and route guards may call these authorities; they may not replace them with local trust shortcuts.
