# Governance Role Scope Studio Spec

Task 458 adds `/ops/access/role-scope-studio` to the governance console.

## Surface Contract

The studio renders `GovernanceRoleScopeStudioProjection` and its nested typed projections:

- `GovernanceScopeRibbonProjection`
- `RoleGrantMatrixProjection`
- `EffectiveAccessPreviewProjection`
- `AccessPreviewArtifactMaskProjection`
- `BreakGlassElevationSummaryProjection`
- `ReleaseFreezeCardProjection`
- `DeniedActionExplainerProjection`
- `ScopeTupleInspectorProjection`
- `GovernanceReturnContextStripProjection`

The page is preview-only. It cannot mutate access, break-glass, config, release, or export state. The only permitted live path is to leave the studio through existing authorized change-envelope, revalidation, or return flows.

## Layout

The visual mode is `Role_Scope_Proof_Studio`.

- Top: persistent governance scope ribbon with tenant, organisation, purpose, acting role, elevation, runtime state, and freeze verdict.
- Main desktop split: 7:5 role-scope matrix and access preview.
- Support rail: masking diff, break-glass summary, and release freeze cards.
- Lower band: denied action explainer and tuple inspector.
- Narrow layout: `mission_stack` order preserves scope ribbon, route matrix, preview, freeze cards, denied action, tuple inspector, and return context.

## Role-Scope Matrix

Rows represent route/action families. Columns represent ordinary, elevated, break-glass, recovery-only, export, approval, and admin capabilities. Cells show explicit text plus shape and state:

- `Live`
- `Diagnostic`
- `Recovery`
- `Denied`
- `Frozen`
- `Masked`

Navigation visibility is not authorization. Every cell cites a source authority ref and remains non-mutating inside the studio.

## Access Preview And Masking

Persona switching updates the preview through deterministic fixtures. Sensitive examples are synthetic labels only. Masked fields remain visible as masked, while hidden fields are not rendered into visible text, ARIA names, telemetry payloads, screenshots, or test fixtures.

## Release Freeze Cards

The freeze rail distinguishes:

- channel release freeze
- config freeze
- standards watchlist block
- recovery-only posture
- assurance graph block
- active incident command freeze

Each card exposes when the freeze began, what it affects, what would release it, and which actions are downgraded.

## States

The supported scenario states are `normal`, `empty`, `stale`, `degraded`, `blocked`, `permission_denied`, `settlement_pending`, `frozen`, and `masked`.

Stale, degraded, blocked, permission-missing, pending-settlement, frozen, and masked states are visible and semantic, not just disabled controls.

## Local Commands

- `pnpm test:phase9:role-scope-studio`
- `pnpm validate:458-phase9-role-scope-studio`
