# 103 Design Token Foundation Publication

`par_103` turns the Phase 0 token blueprint into one published, machine-readable source of truth. The canonical artifact is [design_token_export_artifact.json](/Users/test/Code/V/data/analysis/design_token_export_artifact.json), with shell selection rows in [profile_selection_resolutions.json](/Users/test/Code/V/data/analysis/profile_selection_resolutions.json), contrast evidence in [token_contrast_matrix.csv](/Users/test/Code/V/data/analysis/token_contrast_matrix.csv), and mode coverage in [token_mode_coverage_matrix.csv](/Users/test/Code/V/data/analysis/token_mode_coverage_matrix.csv).

## Scope

- Visual language: `Signal Atlas Live` with the `Quiet Clarity` overlay.
- Token law: four layers only, `ref.* -> sys.* -> comp.* -> profile.*`.
- Publication law: one current `TokenKernelLayeringPolicy`, one current `DesignTokenExportArtifact`, and one published `ProfileSelectionResolution` row per shell family.
- Verification law: contrast floors, full mode-tuple coverage, specimen landmarks, keyboard traversal, and reduced-motion equivalence are all checked.

## Gap Resolutions

- `GAP_RESOLUTION_TOKEN_SEEDS_LIGHT_V1`: the light surface, text, border, and semantic accent seeds are now explicit canonical primitives instead of prose placeholders.
- `GAP_RESOLUTION_TOKEN_SEEDS_DARK_V1`: the dark surface, text, border, and semantic accent seeds are published on the same graph and do not introduce a second token naming system.
- `GAP_RESOLUTION_TOKEN_TONE_DERIVATION_V1`: semantic state containers are derived by blending the semantic accent seed toward the current panel surface at fixed theme/contrast ratios. This preserves one calm tone law while keeping contrast above the blueprint floors.

## Export Surface

- Package source: [token-foundation.ts](/Users/test/Code/V/packages/design-system/src/token-foundation.ts)
- Published stylesheet: [foundation.css](/Users/test/Code/V/packages/design-system/src/foundation.css)
- Schema: [design-token-foundation.schema.json](/Users/test/Code/V/packages/design-system/contracts/design-token-foundation.schema.json)
- Specimen: [103_design_token_specimen.html](/Users/test/Code/V/docs/architecture/103_design_token_specimen.html)
- Brand mark: [signal-atlas-live-mark.svg](/Users/test/Code/V/assets/brand/signal-atlas-live-mark.svg)

The package now exports:

- the canonical token artifact id `DTEA_SIGNAL_ATLAS_LIVE_CANONICAL_V1`
- the canonical layering policy id `TKLP_SIGNAL_ATLAS_LIVE_V1`
- typed shell profile rows for patient, workspace, hub, support, pharmacy, operations, governance, and embedded shells
- deterministic CSS-variable output and specimen metadata from the same token source module

## Compatibility

`par_103` does not fork the earlier `seq_050` and `seq_052` publication plane. It reuses the shell-profile identity rows those tracks already published where possible:

- `PSR_050_PATIENT_V1`
- `PSR_050_STAFF_V1`
- `PSR_050_HUB_V1`
- `PSR_050_SUPPORT_V1`
- `PSR_050_PHARMACY_V1`
- `PSR_050_OPERATIONS_V1`
- `PSR_050_GOVERNANCE_V1`

The only additive row is `PSR_103_EMBEDDED_COMPANION_V1`, because the embedded shell needed an explicit published profile rather than only route-level embedded references.

## Follow-On Boundaries

- `FOLLOW_ON_DEPENDENCY_103_COMPONENT_BINDINGS`: later shell and component tracks must extend `comp.*` or `profile.*`, not invent route-local token branches.
- `FOLLOW_ON_DEPENDENCY_103_SHELL_ROLLOUT_SURFACE_BINDING`: later shell rollout work must consume these published profile-resolution rows and only add new ones by changing the canonical graph here first.
