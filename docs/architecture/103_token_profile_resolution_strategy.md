# 103 Token Profile Resolution Strategy

`par_103` publishes one `ProfileSelectionResolution` row per shell family so later shell work inherits token law instead of redefining it. The canonical rows live in [profile_selection_resolutions.json](/Users/test/Code/V/data/analysis/profile_selection_resolutions.json) and are emitted from [token-foundation.ts](/Users/test/Code/V/packages/design-system/src/token-foundation.ts).

## Resolution Law

- `ref.*` primitives define seed values, spacing math, breakpoints, typography, elevation, and motion.
- `sys.*` aliases translate those primitives into semantic surfaces, text, border, focus, and state roles.
- `comp.*` aliases bind the semantic layer into reusable shell, card, table, form, layout, and motion tokens.
- `profile.*` rows declare the legal shell posture: default density, default motion, allowed topology metrics, allowed surface roles, and the semantic accent family that should dominate.

The exported `TokenKernelLayeringPolicy` makes this binding order mandatory: `ref.* -> sys.* -> comp.* -> profile.*`. Route families may select a published profile row; they may not publish local hex values, local spacing ramps, or shell-private motion curves.

## Published Shell Rows

- Patient: `PSR_050_PATIENT_V1` keeps the shell calm-first, relaxed by default, and biased toward reduced motion.
- Staff workspace: `PSR_050_STAFF_V1` allows the widest density range but still resolves from the same type and spacing ladder.
- Hub: `PSR_050_HUB_V1` stays queue-first and list-stable with the insight accent family.
- Support: `PSR_050_SUPPORT_V1` keeps review-toned replay and escalation work inside the same token graph.
- Pharmacy: `PSR_050_PHARMACY_V1` uses trust and fulfilment cues without creating a separate palette.
- Operations: `PSR_050_OPERATIONS_V1` allows compact telemetry posture without shrinking below the canonical type scale.
- Governance: `PSR_050_GOVERNANCE_V1` keeps approval and evidence emphasis explicit while still inheriting the same state vocabulary.
- Embedded: `PSR_103_EMBEDDED_COMPANION_V1` is the only additive row, because embedded reuse needed an explicit published profile instead of inheriting an implied browser shell.

## Selection Inputs

Each row resolves from the same contract fields:

- `profileTokenRef`
- `shellType`
- `routeClassRef`
- `breakpointCoverageRefs`
- `densityModeRefs`
- `motionModeRefs`
- `allowedTopologyMetricRefs`
- `allowedSurfaceRoleRefs`
- `semanticColorProfileRef`
- `selectionDigestRef`

That digest is stable for the declared row and gives later shells a direct way to prove they are still consuming the current canonical profile binding.

## Why This Prevents Drift

- The patient shell cannot quietly inherit staff density defaults.
- Workspace and operations shells can go compact only through the published density modes, never through ad hoc type shrink.
- Embedded work can stay dark-biased and motion-constrained without inventing a parallel token namespace.
- Later component and route tracks can add more `comp.*` bindings, but they must still point back to one published artifact id: `DTEA_SIGNAL_ATLAS_LIVE_CANONICAL_V1`.

## Follow-On Contract

- Later shell tracks must consume the published resolution row that matches their audience and route family.
- If a new shell posture is needed, the change belongs in the canonical profile layer here first.
- If a surface needs a local visual exception, that is a defect unless it becomes a documented `comp.*` or `profile.*` token on the shared graph.
