# 91 CI/CD And Build Provenance Design

- Task: `par_091`
- Captured on: `2026-04-13`
- Generated at: `2026-04-13T14:51:09+00:00`
- Visual mode: `Build_Provenance_Pipeline_Atlas`

`par_091` provisions the release-control delivery spine for deterministic build packaging, SBOM generation, dependency-policy checks, signed provenance, quarantine, revocation, supersession, and non-production promotion hooks.

## Frozen Outcomes

- Workflows: `2`
- Build families: `8`
- Pipeline runs in the atlas: `8`
- Gate definitions: `8`
- Gate evidence rows: `64`
- Quarantine rules: `6`
- Publish hooks: `16`

## Delivery Law

- The active CI attestation secret class is `RELEASE_PROVENANCE_SIGNING_KEY_REF` from `par_089`. The rehearsal path loads it through `@vecells/runtime-secrets`; it is never checked into source or emitted into browser payloads.
- `BuildProvenanceRecord.runtimeConsumptionState` is authoritative for publish eligibility. `verified + publishable` is required before publication or non-production promotion may proceed.
- Quarantine, revocation, and supersession are first-class artifact states with machine-readable triggers and operator actions.
- The release-control package exports deterministic signing, verification, and publish-decision helpers so workflows and local rehearsal code read the same law.

## Build Families

- `bf_foundation_monorepo_full`: Foundation monorepo bundle (ci-preview, integration, preprod)\n- `bf_published_gateway_bundle`: Published gateway bundle (ci-preview, integration, preprod)\n- `bf_command_runtime_bundle`: Command orchestration bundle (ci-preview, integration, preprod)\n- `bf_projection_runtime_bundle`: Projection rebuild bundle (ci-preview, integration, preprod)\n- `bf_notification_runtime_bundle`: Notification dispatch bundle (ci-preview, integration, preprod)\n- `bf_adapter_simulator_bundle`: Adapter simulator bundle (local, ci-preview, integration)\n- `bf_browser_contract_bundle`: Browser contract bundle (ci-preview, integration, preprod)\n- `bf_release_control_bundle`: Release-control bundle (local, ci-preview, integration, preprod, production)\n

## Dependency Policy

- Policy id: `dependency_policy_091_foundation_v1`
- Root package manager: `pnpm@10.23.0`
- Lockfile: `pnpm-lock.yaml`
- Internal dependency specifier: `workspace:*`

## Gap Closures

- Green CI is no longer treated as publishable by itself; publication requires verified provenance plus the machine-readable publish decision.
- Signing is no longer a timestamp-only gesture; provenance now has signature digest, quarantine triggers, revocation handling, and supersession history.
- Manual deployment bypass is modeled explicitly and fails closed to `blocked`.
- Dependency policy drift is bound to SBOM generation and publish gating instead of living as advisory commentary.
- Local rehearsal uses the same secret class, gate sequence, record shape, and publish refusal logic the CI workflows use.

## Follow-on Boundaries

- `FOLLOW_ON_DEPENDENCY_094_RUNTIME_PUBLICATION_BUNDLE_FINAL_BINDING` owned by `par_094`: The mock-now promotion hook pins current runtime publication refs, but the final bundle publication and parity lift remains owned by par_094.\n- `FOLLOW_ON_DEPENDENCY_097_WATCH_TUPLE_WAVE_ACTIONING` owned by `par_097`: par_091 publishes gate evidence and promotion hooks only; live-wave widening, pause, rollback, and watch tuple actioning remains owned by par_097.\n
