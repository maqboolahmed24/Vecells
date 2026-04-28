# Task 458 Algorithm Alignment Notes

The Governance Role Scope Studio is aligned to the Phase 0 acting-context and scoped-mutation rules, the Phase 9 governance/release proof rules, and the platform admin `/ops/access/*` contract.

## Source Alignment

- `GovernanceScopeRibbonProjection` exposes tenant, organisation, purpose-of-use, acting role, elevation, `GovernanceScopeToken`, `ActingScopeTuple`, policy plane, runtime publication state, and release-freeze verdict.
- `RoleGrantMatrixProjection` uses route/action families and capability columns only as a preview of canonical authorization decisions. Side navigation is never treated as authorization.
- `EffectiveAccessPreviewProjection` is fed by canonical refs from the acting-context/visibility kernel and is marked with the required task 458 interface-gap artifact until a dedicated service read model exists.
- `AccessPreviewArtifactMaskProjection` uses deterministic synthetic labels only. Hidden fields are not rendered by the frontend, and telemetry uses safe descriptor hashes.
- `BreakGlassElevationSummaryProjection` separates eligibility, reason adequacy, scope widening, expiry, follow-up burden, and review state.
- `ReleaseFreezeCardProjection` separates live, diagnostic-only, recovery-only, blocked, and frozen authority for channel freeze, config freeze, standards watchlist, recovery posture, assurance graph, and incident command freeze.
- `DeniedActionExplainerProjection` always includes source object, failed predicate, consequence, and next safe action.
- `GovernanceReturnContextStripProjection` preserves operations, audit, assurance, incident, resilience, records, and tenant-governance handoff context without browser-history assumptions.

## Gap Closure

The repository has a canonical acting-context/visibility kernel but no dedicated frontend `EffectiveAccessPreviewProjection` read model. The gap is recorded in `data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_458_ACCESS_PREVIEW_READ_MODEL.json`.

The temporary adapter preserves the algorithm by staying preview-only, disabling live mutation and export controls, redacting telemetry, downgrading stale/frozen/degraded states, and binding every visible decision to canonical source refs.

## Fail-Closed States

- `normal`: inspection is live, mutation still requires an authorized change envelope.
- `empty`: no role-scope rows are admitted under the current tuple.
- `stale`: live-looking cells downgrade to diagnostic and require tuple revalidation.
- `degraded`: the studio stays readable but diagnostic-only.
- `blocked`: decisions deny or freeze in place.
- `permission_denied`: only metadata and denied predicates are visible.
- `settlement_pending`: revalidation/return are available, approval and export remain blocked.
- `frozen`: export, approval, and admin columns freeze.
- `masked`: visible preview fields are semantically masked and telemetry-safe.

## Verification Intent

Unit, integration, validator, and Playwright suites assert matrix coverage, tenant isolation/audience-tier visibility, break-glass display, release-freeze downgrade behavior, stale supersession, denied outbound actions, telemetry redaction, keyboard operation, responsive layouts, reduced motion, and screenshot/ARIA evidence.
