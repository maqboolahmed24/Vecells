# 89 Secrets, KMS, And Rotation Design

## Purpose

`par_089` provisions the Phase 0 secret-management and key-hierarchy baseline for Vecells so runtime services, simulators, CI jobs, and preview control flows consume governed secret classes rather than source-controlled values or long-lived CI variables.

The authoritative artifacts are:

- `data/analysis/secret_class_manifest.json`
- `data/analysis/key_hierarchy_manifest.json`
- `data/analysis/rotation_policy_matrix.csv`
- `infra/secrets-kms/`
- `packages/runtime-secrets/`

## Runtime Law

- Secrets never appear in source, build output, browser payloads, public diagnostics, or normal logs.
- Every runtime secret resolves through a named `secret_class_ref`, one access policy, one key-branch ref, and one rotation row.
- Environment loading is no longer ad hoc `.env` folklore; runtime services derive secret refs from the published manifest.
- Startup fails closed if a required secret is missing, overdue, expired, revoked, or inaccessible.
- Rotation is reloadable through the shared service bootstrap seam. `SIGHUP` refresh is the no-code-change path where the service binding allows it.
- Break-glass reads remain separate from normal runtime access and are tied to `BREAK_GLASS_AUDIT_HMAC_REF` plus explicit audit streams.

## Control Surfaces

### Shared Package

`packages/runtime-secrets` provides:

- manifest loaders for secret classes, key hierarchy, and rotation policy
- a file-backed secret-store emulator for local, test, and CI
- deterministic envelope encryption for non-production bootstrap and replayable tests
- service and CI secret adapters
- rotation, revocation, and audit-safe read logging
- leak detection helpers that prove plaintext never reaches emitted summaries

### Infrastructure

`infra/secrets-kms` publishes:

- Terraform views for the secret namespace, KMS hierarchy, secret-class bindings, and access policies
- environment overlays for `local`, `ci-preview`, `integration`, `preprod`, and `production`
- a local bootstrap script that creates `master-key.json`, `secret-store.json`, and `access-audit.jsonl`
- local break-glass and access-log redaction policies

## Key Hierarchy

The hierarchy is deliberately purpose-split:

- `KMS_SESSION_SEAL` for session and CSRF rotation material
- `KMS_RUNTIME_SIGNING` for runtime signing and mutation-gate material
- `KMS_PROVIDER_CREDENTIAL_WRAP` for provider and simulator callback credentials
- `KMS_DATA_PLANE_WRAP` for data-store, object-store, broker, and transport credentials
- `KMS_CI_ATTESTATION_WRAP` for CI provenance and preview reset flows
- `KMS_BREAK_GLASS_WRAP` for heightened audit and emergency access control

Each environment carries its own root key ref:

- `KMS_ROOT_LOCAL`
- `KMS_ROOT_CI_PREVIEW`
- `KMS_ROOT_INTEGRATION`
- `KMS_ROOT_PREPROD`
- `KMS_ROOT_PRODUCTION`

That closes the "one master key is enough" gap by keeping session, provider, data-plane, CI, and break-glass blast radii separate.

## Service Consumption

The current runtime services bind to the manifest-driven secret seams as follows:

- `api-gateway` loads `AUTH_EDGE_SESSION_SECRET_REF` and `AUTH_EDGE_SIGNING_KEY_REF`
- `command-api` loads `COMMAND_IDEMPOTENCY_STORE_REF` and `COMMAND_MUTATION_GATE_SECRET_REF`
- `projection-worker` loads `PROJECTION_CURSOR_STORE_REF` and `PROJECTION_DEAD_LETTER_STORE_REF`
- `notification-worker` loads `NOTIFICATION_PROVIDER_SECRET_REF`, `NOTIFICATION_WEBHOOK_SECRET_REF`, and `NOTIFICATION_SIGNING_KEY_REF`
- `adapter-simulators` already has its secret-class seam published for later runtime consumption without redefining the class law

## Audit And Break-Glass

Normal runtime reads and emergency access are intentionally different postures.

- Normal runtime reads emit only actor ref, secret class ref, version ref, access mode, and fingerprint.
- Break-glass posture is represented as a dedicated secret class plus a dedicated access-policy mode.
- Break-glass remains ticket-bound, second-approver-bound, and audit-HMAC-bound through `infra/secrets-kms/local/break-glass-policy.json`.

## Follow-On Boundaries

- `FOLLOW_ON_DEPENDENCY_088_CACHE_TRANSPORT_SECRET_CONSUMPTION`: later cache/live transport work consumes the published token class without changing its rotation law.
- `FOLLOW_ON_DEPENDENCY_090_GATEWAY_SESSION_RUNTIME_CONSUMPTION`: later gateway-surface work consumes the already-published gateway secret classes.
- `FOLLOW_ON_DEPENDENCY_091_CI_PIPELINE_SECRET_EXECUTION`: later provenance and signed-build work consumes the CI binding, not raw CI variables.
- `FOLLOW_ON_DEPENDENCY_092_PREVIEW_RESET_SECRET_EXECUTION`: later preview reset work consumes the published preview-reset and break-glass classes.
