# Capability Decision Engine Design

Task: `par_180_phase2_track_identity_build_capability_decision_engine_and_scope_envelope_rules`

## Purpose

`CapabilityDecisionEngine` is the sole route trust-ceiling authority. It consumes authority-derived state from `IdentityContext`, `SessionGovernor`, `PatientLinker`, and `IdentityBindingAuthority`, resolves one explicit `RouteCapabilityProfile`, and emits one immutable `CapabilityDecision`.

The engine does not write `IdentityBinding`, `Request.patientRef`, `Episode.patientRef`, ownership state, grant state, or route-local mutation truth. CapabilityDecision is a ceiling only.

## Central Flow

The service lives in `services/command-api/src/capability-decision-engine.ts` and exposes `createCapabilityDecisionEngineApplication()`.

Evaluation order is fixed:

1. Subject and identity source posture.
2. Session posture and local auth state.
3. Patient-link outcome and ambiguity state.
4. Binding authority state and subject-binding version.
5. Age policy and explicit restrictions.
6. Route sensitivity and explicit route profile.
7. Channel ceiling.
8. Release or manifest posture.
9. Same-lineage recovery availability.

Later checks may narrow a decision, but they cannot raise a hard-stop deny into allow. unknown routes deny with `CAP_180_UNKNOWN_ROUTE_PROFILE_DENIED` and `CAP_180_DENY_BY_DEFAULT`.

## Objects

| Object | Role |
| --- | --- |
| `RouteCapabilityProfile` | Explicit route tuple policy with `routeFamily`, `actionScope`, sensitivity, auth/link/binding requirements, grant families, recovery, step-up, release, channel, age, and policy thresholds. |
| `CapabilityDecisionRecord` | Immutable decision record with `decisionState`, reason codes, policy version, route tuple hash, subject-binding version, session epoch, lineage fence, freshness score, risk upper bound, and ceiling-only marker. |
| `AccessGrantScopeEnvelope` | Immutable grant scope tuple consumed by the authorizer. |
| `ScopeEnvelopeAuthorizationRecord` | Replay-safe envelope authorization result with drift fields and reason codes. |
| `RouteGuardAuthorizationResult` | Adapter result that combines capability and optional scope-envelope authority for gateway/service guards. |

## Route Profile Registry

The registry is machine-readable and strict. It mirrors the frozen task `170` profile families while enriching them with task `180` fields required by runtime evaluation:

- `routeFamily`
- `actionScope`
- `sensitivityClass`
- `requiresAuthenticatedSubject`
- `requiresHighAssuranceBinding`
- `requiresWritableAuthority`
- `supportsRecovery`
- `supportsStepUp`
- `grantFamiliesAllowed`
- `channelCeiling`
- `releaseConstraints`
- `embeddedConstraints`
- `minimumLinkConfidenceBand`
- `restrictionChecks`
- `agePolicy`
- `profileVersion`

Invalid or duplicate profiles fail registry construction.

## Scope Envelope Authorization

Grant-backed routes call `authorizeScopeEnvelope()` before proceeding. The authorizer compares the immutable `AccessGrantScopeEnvelope` to the current `RouteRuntimeTuple` across:

- grant family
- route family
- action scope
- governing object ref
- governing object version
- session epoch
- subject-binding version
- lineage fence
- release posture
- manifest posture
- channel posture
- audience and visibility scope
- expiry, supersession, and redemption state

Any mismatch produces `recover_only` or `deny`; there is no partial allow.

## Gap Closures

| Gap | Closure |
| --- | --- |
| `PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_ROUTE_PROFILE_REGISTRY_V1` | Strict explicit registry replaces route-name inference. |
| `PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_CENTRAL_ENGINE_V1` | Gateway and service routes use one central engine boundary. |
| `PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_SCOPE_ENVELOPE_DRIFT_V1` | Scope-envelope drift is field-specific and reason-coded. |
| `PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_CEILING_NOT_MUTATION_AUTHORITY_V1` | Decision records carry `identityBindingMutation = none` and `capabilityIsCeilingOnly = true`. |
| `PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_STALE_FENCE_RECOVERY_V1` | Stale session, binding, and lineage fences downgrade to same-lineage recovery when safe. |
| `PARALLEL_INTERFACE_GAP_PHASE2_CAPABILITY_AUDIT_PUBLICATION_V1` | Decisions and scope checks persist immutable policy/audit records. |

## Persistence

Migration `services/command-api/migrations/095_phase2_capability_decision_engine.sql` adds:

| Table | Purpose |
| --- | --- |
| `route_capability_profile_registry` | Versioned route profile rows. |
| `capability_decision_records` | Immutable central capability decisions. |
| `scope_envelope_authorization_records` | Replay-safe scope-envelope authorization records. |
| `capability_policy_audit` | Policy audit join for decision and scope authorization refs. |

## Integration

`services/command-api/src/service-definition.ts` declares:

- `POST /identity/capability/evaluate`
- `POST /identity/capability/scope-envelope/authorize`
- `GET /identity/capability/route-profiles`

Controllers, BFF handlers, workers, and route guards should call these routes or the local `authorizeRoute()` adapter. They must not inline route trust logic.
