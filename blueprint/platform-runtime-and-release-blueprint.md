# Platform runtime and release blueprint

## Purpose

Define the production runtime, trust boundaries, release system, and verification ladder for Vecells.

This document closes the delivery gap between the canonical domain runtime in `phase-0-the-foundation-protocol.md`, the shell contracts in `platform-frontend-blueprint.md`, the admin promotion rules in `platform-admin-and-config-blueprint.md`, and the restore and assurance controls in `phase-9-the-assurance-ledger.md`. The phase documents already define what Vecells must do; this blueprint defines how it is allowed to ship, change, recover, and prove safety in production.

## Runtime topology contract

Use one governed entry plane and separate internal workload planes.

Suggested workload families:

- public edge
- shell delivery plane
- command plane
- projection plane
- integration plane
- data plane
- assurance and security plane

Suggested runtime objects:

- `RuntimeTopologyManifest`
- `GatewayBffSurface`
- `DependencyDegradationProfile`
- `BuildProvenanceRecord`
- `ReleaseCandidate`
- `DeploymentWave`
- `SchemaMigrationPlan`
- `ProjectionBackfillPlan`
- `ReleaseGateEvidence`

### `RuntimeTopologyManifest`

Required fields:

- `manifestId`
- `environment`
- `ingressRefs`
- `serviceIdentityRefs`
- `dataStoreRefs`
- `queueRefs`
- `egressAllowlistRefs`
- `tenantIsolationMode`
- `approvedAt`

### `GatewayBffSurface`

Required fields:

- `surfaceId`
- `audience`
- `routeFamilies`
- `openApiRef`
- `asyncChannelRef`
- `projectionSchemaRefs`
- `sessionPolicyRef`
- `cachePolicyRef`

### `DependencyDegradationProfile`

Required fields:

- `profileId`
- `dependencyCode`
- `failureModes`
- `patientFallbackState`
- `staffFallbackState`
- `retryPolicyRef`
- `alertThresholdRef`

### `BuildProvenanceRecord`

Required fields:

- `provenanceId`
- `buildSystemRef`
- `sourceCommitRef`
- `artifactDigests`
- `dependencyLockRefs`
- `sbomRef`
- `signedAt`
- `verifiedBy`

### `ReleaseCandidate`

Required fields:

- `releaseId`
- `gitRef`
- `artifactDigests`
- `bundleHashRefs`
- `schemaMigrationPlanRef`
- `projectionBackfillPlanRef`
- `sbomRef`
- `provenanceRef`
- `approvalRefs`
- `waveState`

### `DeploymentWave`

Required fields:

- `waveId`
- `releaseRef`
- `environment`
- `tenantScope`
- `cohortScope`
- `startedAt`
- `completedAt`
- `resultState`

### `SchemaMigrationPlan`

Required fields:

- `migrationPlanId`
- `storeScope`
- `changeType = additive | backfill | contractive | rollforward_only`
- `compatibilityWindow`
- `executionOrder`
- `verificationRefs`
- `rollbackMode`

### `ProjectionBackfillPlan`

Required fields:

- `backfillPlanId`
- `projectionFamilies`
- `sourceEventWindow`
- `expectedLagBudget`
- `rebuildStrategy`
- `successEvidenceRef`

### `ReleaseGateEvidence`

Required fields:

- `evidenceId`
- `releaseRef`
- `environment`
- `gateType`
- `result = pass | fail | waived`
- `evidenceRef`
- `recordedAt`
- `ownerRef`

## Runtime rules

- Browsers terminate only at the public edge and gateway or BFF layer.
- No browser may call GP-system, telephony, messaging, pharmacy, MESH, workflow, or audit services directly.
- All mutations enter through command routes protected by `ScopedMutationGate`.
- All patient and staff list or detail views read from projection contracts, not transactional stores.
- Every storage record, object prefix, cache key, and emitted event must carry `tenantId`; cross-tenant access is allowed only through explicit acting context and immutable audit.
- All service-to-service traffic must use workload identity and mutual authentication.
- Object storage remains private; downloads use short-lived signed URLs created only after authz and visibility checks.
- External dependencies must publish through explicit outbox and inbox boundaries with retry policy and dead-letter handling.
- Each dependency must declare a `DependencyDegradationProfile` so the UI and queue logic know how to fail soft instead of inventing silent partial success.

## Environment ring and promotion contract

Use one promotion path:

- `local`
- `ci-preview`
- `integration`
- `preprod`
- `production`

Rules:

- Every environment must be created from the same infrastructure modules and policy templates.
- Production-only manual configuration is forbidden; environment differences must be declared in versioned manifests.
- Promotion moves immutable artifact digests and approved bundle hashes forward; it does not rebuild from source separately in each environment.
- Tenant rollout may be staged by organisation, cohort, or capability, but the runtime artifact remains identical across waves.
- Emergency changes still create a `ReleaseCandidate`; shell access, SQL consoles, or ad hoc script execution must not become the real change path.

## Frontend and backend integration contract

Use a governed gateway or backend-for-frontend boundary for each audience family:

- patient surface
- workspace surface
- hub surface
- operations and admin surface

Rules:

- Read contracts must be projection-first and audience-safe. The browser never assembles PHI by joining raw services.
- Mutation contracts must require idempotency keys, freshness tokens, and acting context where the action scope demands them.
- Live updates should default to one typed stream contract per surface, with deterministic reconnect, stale-state, and downgrade behavior.
- Every sync route must have a generated schema, typed client, and contract test.
- Every async stream or webhook must have a versioned channel contract and compatibility test.
- Error families must be typed at minimum as `validation`, `auth`, `scope`, `stale_view`, `conflict`, `dependency_degraded`, `safety_blocked`, and `unknown_failure`.

## Data persistence and migration contract

Keep the data model explicit:

- transactional clinical and operational writes in the authoritative relational or FHIR-native store
- immutable events on the event spine
- audience projections in dedicated read stores
- binary artifacts in object storage
- immutable audit in the WORM ledger

Migration rules:

- Use expand-migrate-contract for all schema evolution that touches live traffic.
- Do not drop or repurpose a field in the same release that introduces a new read path.
- Projection schema changes must ship with deterministic rebuild logic from raw event history.
- Backfills run as explicit release work with lag budgets, monitoring, and stop or resume controls; they are not hidden inside request handlers.
- Event schemas are backward-compatible by default. Any intentional break requires a new namespace or explicit version boundary plus replay proof.
- Rollback mode must be declared up front as `binary_safe`, `flag_only`, or `rollforward_only`; unknown rollback posture blocks promotion.

## Security baseline contract

Production hardening rules:

- Public ingress must enforce rate limiting, origin policy, TLS, and attack-surface filtering before traffic reaches the gateway.
- Patient and staff sessions use separate cookie scopes, HTTP-only secure cookies, CSRF protection, and strict session-expiry behavior.
- Browser-delivered surfaces must define CSP, frame-ancestor, referrer, and download-handling policy explicitly.
- Secrets must come from a managed secret store or KMS-backed mechanism, never from source control or long-lived CI variables.
- Encryption at rest must cover transactional stores, backups, object storage, queue persistence where applicable, and audit exports.
- Logs, traces, and metrics must carry correlation IDs but must not emit raw PHI beyond approved redaction policy.
- Service identities must follow least privilege, and egress must be allowlisted per workload family.
- Break-glass, support replay, and tenant-switch actions must emit heightened audit and alerting signals.

## Verification ladder contract

Every release candidate must pass a layered gate set.

### Gate 0 - static and unit

- formatting, linting, types
- unit tests
- policy compilation tests
- design-system snapshot or structural tests

### Gate 1 - contract and component

- OpenAPI and channel schema compatibility
- adapter contract tests
- component tests for shells and workspace primitives
- consumer tests for generated client packages

### Gate 2 - integration and end-to-end

- end-to-end browser journeys
- accessibility checks
- webhook and callback replay tests
- projection freshness and stale-view recovery tests

### Gate 3 - performance and security

- load, soak, and latency-budget tests on critical paths
- dependency, container, and IaC scans
- secret-leak and redaction verification
- abuse, rate-limit, and session-hardening tests

### Gate 4 - resilience and recovery

- projection rebuild from raw events
- backup restore into a clean environment
- dependency degraded-mode rehearsal
- canary rollback rehearsal

### Gate 5 - live wave proof

- synthetic production probes green
- alerting and dashboards attached to the wave
- rollback path verified for the exact migration posture
- post-deploy evidence appended to immutable release history

## CI/CD and supply-chain pipeline contract

The pipeline should run in this order:

1. resolve pinned dependencies and build immutable artifacts
2. run static, unit, and contract gates
3. generate SBOM, dependency report, and vulnerability decision record
4. sign artifacts and attach provenance to the `ReleaseCandidate`
5. create preview environments and run smoke plus accessibility checks
6. deploy to integration and execute simulator-backed flows and webhook tests
7. deploy to preprod, run schema migration dry-runs, projection backfill rehearsal, performance tests, and restore proof
8. promote to production canary wave with synthetic monitoring and guarded feature exposure
9. widen, pause, rollback, or kill-switch according to the declared wave policy
10. append immutable release decision, evidence links, and operator attribution

Rules:

- A `CompiledPolicyBundle` hash and a `ReleaseCandidate` must be approved together when the release changes behavior.
- Artifact signing, provenance, and SBOM generation are mandatory, not optional report attachments.
- No manual hotfix may bypass release recording, migration posture declaration, or rollback evidence.
- If a release is `rollforward_only`, binary rollback is blocked and the approved emergency path is feature disablement or forward corrective release.

## Operational readiness contract

No production capability is complete until it also has:

- named service owner and on-call path
- SLO and alert thresholds for each essential function
- dashboard links for patient, workspace, booking, hub, pharmacy, and communication health
- dependency degradation profile and fallback behavior
- runbook links for deploy, rollback, restore, and incident triage
- synthetic journeys covering at least one patient and one staff path per critical domain

## Linked documents

This blueprint is intended to be used with:

- `phase-0-the-foundation-protocol.md`
- `platform-frontend-blueprint.md`
- `platform-admin-and-config-blueprint.md`
- `phase-7-inside-the-nhs-app.md`
- `phase-8-the-assistive-layer.md`
- `phase-9-the-assurance-ledger.md`
