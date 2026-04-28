# Route Profile And Decision Contract

Task: `par_180_phase2_track_identity_build_capability_decision_engine_and_scope_envelope_rules`

## RouteCapabilityProfile

Every protected route resolves to exactly one `RouteCapabilityProfile`. Unknown routes deny by default.

Required profile fields:

| Field                          | Meaning                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| `routeProfileRef`              | Stable profile identifier.                                                               |
| `routeFamily`                  | Canonical route family.                                                                  |
| `actionScope`                  | Route action scope such as `status_view`, `claim`, `attachment_add`, or `secure_resume`. |
| `sensitivityClass`             | `public`, `low`, `moderate`, `high`, or `restricted`.                                    |
| `requiresAuthenticatedSubject` | Whether an anonymous or URL-only subject must step up.                                   |
| `requiresHighAssuranceBinding` | Whether current `IdentityBindingAuthority` binding version is required.                  |
| `requiresWritableAuthority`    | Whether the route needs separate write authority beyond capability.                      |
| `supportsRecovery`             | Whether stale same-lineage routes may return `recover_only`.                             |
| `supportsStepUp`               | Whether `step_up_required` is valid for the route.                                       |
| `grantFamiliesAllowed`         | Redeemable grant families allowed to back the route.                                     |
| `channelCeiling`               | Maximum trust band allowed by the channel.                                               |
| `releaseConstraints`           | Required release and manifest tuple refs.                                                |
| `embeddedConstraints`          | Embedded posture and bridge capability requirements.                                     |
| `minimumLinkConfidenceBand`    | `none`, `candidate`, `verified`, or `high`.                                              |
| `restrictionChecks`            | Explicit policy checks applied by the engine.                                            |
| `agePolicy`                    | `none`, `minor_proxy_required`, or `adult_only`.                                         |
| `profileVersion`               | Versioned profile contract ref.                                                          |

## CapabilityDecision

`CapabilityDecision` is immutable and serialized by `CapabilityDecisionEngine`.

Required output fields:

| Field                         | Meaning                                                                |
| ----------------------------- | ---------------------------------------------------------------------- |
| `capabilityDecisionId`        | Deterministic decision id for the same route tuple and inputs.         |
| `schemaVersion`               | `170.phase2.trust.v1`.                                                 |
| `policyVersion`               | `phase2-trust-v1`.                                                     |
| `routeProfileRef`             | Resolved route profile or deny fallback ref.                           |
| `decisionState`               | `allow`, `step_up_required`, `recover_only`, or `deny`.                |
| `reasonCodes[]`               | Stable machine-readable codes such as `CAP_180_BINDING_VERSION_DRIFT`. |
| `evaluatedAt` and `expiresAt` | Decision lifetime.                                                     |
| `subjectBindingVersionRef`    | Authority-derived binding fence.                                       |
| `sessionEpochRef`             | Session-governor epoch fence.                                          |
| `lineageFenceRef`             | Request or episode lineage fence.                                      |
| `derivedTrustBand`            | Monotone effective trust band.                                         |
| `stepUpPathRef`               | Present only when `decisionState = step_up_required`.                  |
| `recoveryPathRef`             | Present only when `decisionState = recover_only`.                      |
| `routeTupleHash`              | Hash of the route tuple; no raw PHI or token values.                   |
| `capabilityIsCeilingOnly`     | Always `true`.                                                         |
| `identityBindingMutation`     | Always `none`.                                                         |

## API Routes

| Route                                                | Contract                                        | Purpose                                                    |
| ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| `POST /identity/capability/evaluate`                 | `CapabilityDecisionContract`                    | Evaluate a protected route through the central engine.     |
| `POST /identity/capability/scope-envelope/authorize` | `AccessGrantScopeEnvelopeAuthorizationContract` | Validate a grant envelope against the current route tuple. |
| `GET /identity/capability/route-profiles`            | `RouteCapabilityProfileRegistryContract`        | Expose the active route profile registry.                  |

## Guard Adapter

`authorizeRoute()` combines a `CapabilityDecision` with optional `ScopeEnvelopeAuthorizationRecord`.

Rules:

- `allow` from capability is not enough for mutation.
- A grant-backed route must also return `authorizationState = authorized`.
- If scope drift returns `recover_only`, the route guard returns `canProceed = false` and keeps same-lineage recovery refs.
- Unknown routes and unknown capability ids return `deny`.

## Reason-Code Catalogue

Reason codes are owned by `CapabilityDecisionEngine` and grouped by concern:

| Family           | Examples                                                                     |
| ---------------- | ---------------------------------------------------------------------------- |
| Route profile    | `CAP_180_ROUTE_PROFILE_RESOLVED`, `CAP_180_UNKNOWN_ROUTE_PROFILE_DENIED`.    |
| Subject/session  | `CAP_180_AUTHENTICATED_SUBJECT_REQUIRED`, `CAP_180_SESSION_EPOCH_DRIFT`.     |
| Link/binding     | `CAP_180_PATIENT_LINK_AMBIGUOUS`, `CAP_180_BINDING_VERSION_DRIFT`.           |
| Restrictions     | `CAP_180_RESTRICTION_DENY`, `CAP_180_AGE_POLICY_BLOCKED`.                    |
| Recovery/step-up | `CAP_180_SAME_LINEAGE_RECOVERY_AVAILABLE`, `CAP_180_STEP_UP_PATH_AVAILABLE`. |
| Scope envelope   | `CAP_180_SCOPE_GOVERNING_VERSION_DRIFT`, `CAP_180_SCOPE_REPLAY_RETURNED`.    |

No route contract may use free-text policy outcomes as authority.
