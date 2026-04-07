# Canonical design-token foundation

## Purpose

`Signal Atlas Live` and `Quiet Clarity` must render from one token graph rather than shell-local styling. This file is the canonical visual foundation for patient, staff, hub, pharmacy, support, operations, governance, and embedded surfaces.

## Token architecture and inheritance

Use four layers only:

- `ref.*` primitive tokens for spatial quanta, tone steps, durations, radii, and baseline size buckets
- `sys.*` semantic tokens for surface, text, icon, border, focus, state, freshness, trust, and motion meaning
- `comp.*` component tokens for shell, board, card, rail, drawer, form, list, table, task, and artifact surfaces
- `profile.*` shell profiles for patient, workspace, hub, support, pharmacy, operations, and governance routes

Rules:

- route documents may select a `profile.*` plus topology and density posture, but they may not mint local hex values, px values, shadow stacks, or radius ladders
- route documents and shell specializations must resolve one published `ProfileSelectionResolution` against the current `TokenKernelLayeringPolicy`; selecting a `profile.*` token is legal, inventing a fifth token layer or route-local semantic role is not
- component tokens must alias semantic tokens; semantic tokens must alias primitive tokens
- instance overrides are legal only for measured content fit and never for new visual meaning
- theming, contrast, density, and motion are mode resolutions on the same token graph, not alternate naming systems

## Machine-readable export contract

**DesignTokenExportArtifact**
`designTokenExportArtifactId`, `designTokenFoundationRef`, `tokenKernelLayeringPolicyRef`, `modeTupleCoverageRef`, `primitiveTokenGroupRefs[]`, `semanticAliasRefs[]`, `componentAliasRefs[]`, `profileResolutionRefs[]`, `compositeTokenRefs[]`, `exportFormatRefs[]`, `tokenValueDigestRef`, `generatedAt`

`DesignTokenExportArtifact` is the canonical machine-readable export of the token graph. It carries token groups, alias edges, composite tokens, and shell-profile plus mode resolution together so shells, accessibility tooling, automation, telemetry linting, design tools, and release verification consume the same token truth.

**TokenKernelLayeringPolicy**
`tokenKernelLayeringPolicyId`, `designTokenFoundationRef`, `primitiveLayerNamespace = ref.*`, `semanticLayerNamespace = sys.*`, `componentLayerNamespace = comp.*`, `profileLayerNamespace = profile.*`, `requiredAliasOrder = ref_to_sys_to_comp_to_profile`, `allowedShellVariationRefs[]`, `allowedModeVariationRefs[]`, `forbiddenOverrideClasses[]`, `requiredKernelStatePropagationRef`, `layeringDigestRef`, `effectiveAt`

`TokenKernelLayeringPolicy` is the canonical machine-readable law for token layering. It defines exactly which layer may carry raw values, semantic meaning, component posture, and shell specialization so route families cannot bypass the token kernel with shell-local theme packs, route-local CSS variables, or direct primitive-to-profile jumps.

**ProfileSelectionResolution**
`profileSelectionResolutionId`, `designTokenExportArtifactRef`, `tokenKernelLayeringPolicyRef`, `profileTokenRef`, `shellType`, `routeClassRef`, `breakpointCoverageRefs[]`, `densityModeRefs[]`, `motionModeRefs[]`, `allowedTopologyMetricRefs[]`, `allowedSurfaceRoleRefs[]`, `semanticColorProfileRef`, `selectionDigestRef`, `effectiveAt`

`ProfileSelectionResolution` is the published proof that one shell or route class is selecting from the canonical token graph rather than redefining it. It binds the active `profile.*` token to the exact density, motion, topology, surface-role, and semantic-color choices that are legal for that shell or route class.

Rules:

- one current `TokenKernelLayeringPolicy` is required for every current `DesignTokenExportArtifact`; token exports without explicit layer law are incomplete
- every exported `ref.*`, `sys.*`, `comp.*`, and `profile.*` token must appear in one current `DesignTokenExportArtifact`; screenshots, handwritten token tables, or CSS variable dumps are not sufficient authority
- alias refs must preserve exact upstream lineage; a semantic or component token may not hide a raw px, hex, radius, or motion override behind a familiar token name
- `profile.*` selections may specialize only through published `ProfileSelectionResolution` rows from the same artifact; shell-local theme files, route-local CSS bundles, and ad hoc semantic-color remaps are invalid substitutes
- profile selection may not skip semantic or component meaning; direct primitive-to-profile shortcuts that introduce new state, trust, freshness, or surface-role meaning are blocked
- composite tokens must serialize both the resolved value and the alias lineage that produced it so lint and snapshot tools can detect silent meaning drift
- `modeTupleCoverageRef` must enumerate `theme`, `contrast`, `density`, and `motion` resolution on the same graph; route families may not publish separate mode vocabularies or partially resolved token exports
- `profileResolutionRefs[]` must show how patient, workspace, hub, support, pharmacy, operations, governance, and embedded shells inherit from the same graph rather than forking local ladders
- any new visible state that changes tone, motion, prominence, or surface-role selection must first add or extend `sys.*` or `comp.*` tokens here and then regenerate the affected `ProfileSelectionResolution`; route families may not patch meaning downstream
- any change to primitive groups, alias lineage, composite token resolution, or profile resolution invalidates dependent `DesignContractPublicationBundle` and `DesignContractLintVerdict` outputs until they are regenerated against the new `tokenValueDigestRef`

## Modes

All tokens resolve under one mode tuple:

- `theme = light | dark`
- `contrast = standard | high`
- `density = relaxed | balanced | compact`
- `motion = full | reduced | essential_only`

`dense_data` is a component-only density override allowed for non-editable operations and governance tables, matrices, and telemetry boards. It may never shrink editable controls or patient-facing hit targets below the shell minimum.

## Mathematical base

Let the atomic spatial quantum be `q = 4px`.

Let the structural grid quantum be `g = 8px = 2q`.

Rules:

- all spacing, padding, icon sizes, radii, and control heights are integer multiples of `q`
- all gutters, macro region gaps, pane widths, and breakpoint-snapped values are integer multiples of `g`
- vertical rhythm snaps to `q`; structural region rhythm snaps to `g`

For fluid values between two breakpoint anchors, use:

`token(w) = clamp(v_min, v_min + (v_max - v_min) * ((w - w_min) / (w_max - w_min)), v_max)`

Only shell gutters, non-critical pane widths, and display/headline typography may use fluid interpolation. Core control sizes, row heights, icon buckets, and focus indicators stay discrete.

## Breakpoints and layout lattice

Use these canonical breakpoint classes:

- `xs = 320-479`
- `sm = 480-767`
- `md = 768-1023`
- `lg = 1024-1439`
- `xl = 1440-1919`
- `2xl = 1920+`

Grid contract:

- `xs` and `sm`: 4 columns, 16px gutters, `mission_stack` by default for narrow shells
- `md`: 8 columns, 24px gutters
- `lg`: 12 columns, 24px gutters
- `xl` and `2xl`: 16 columns, 32px gutters

Pane tokens:

- `rail.collapsed = 72`
- `rail.expanded = 280`
- `support.peek = 320`
- `support.open = clamp(320px, 28vw, 400px)`
- `drawer.inline = clamp(360px, 33vw, 480px)`
- `dialog.sm = 480`
- `dialog.md = 640`
- `dialog.lg = 800`

## Typography

Base font families:

- `font.sans = system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- `font.mono = ui-monospace, "SFMono-Regular", "SF Mono", Consolas, monospace`

Type roles are snapped to a 2px size cap and a 4px line-height grid:

- `display = 40 / 48 / 600 / -0.01em`
- `headline = 32 / 40 / 600 / -0.01em`
- `title = 24 / 32 / 600 / -0.005em`
- `section = 20 / 28 / 600 / 0`
- `body.lg = 18 / 28 / 400 / 0`
- `body = 16 / 24 / 400 / 0`
- `body.sm = 14 / 20 / 400 / 0`
- `label = 12 / 16 / 600 / 0.02em`
- `mono.sm = 12 / 16 / 500 / 0`

Format is `fontSize / lineHeight / fontWeight / letterSpacing`.

Line-height rule:

`lineHeight = round_up_to_4(fontSize * ratioRole)`

Where `ratioRole = 1.5` for body copy up to 16px, `1.4` for 18-20px, `1.33` for 24px, and `1.25` for 32px+.

Additional rules:

- long-form reading measure: `60-72ch`
- form and task copy measure: `36-56ch`
- numbers, times, dates, queues, and IDs use tabular numerics by default
- uppercase labels are allowed only for scan aids and never below 12px

## Spacing and component rhythm

Canonical space ramp:

- `0, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128`

Usage bands:

- inline micro gaps: `4, 8, 12`
- control and label gaps: `8, 12`
- card and section padding: `16, 24, 32`
- region separation: `24, 32, 48, 64`

Rhythm rules:

- `gap.inline = pad.inline / 2`, snapped to `q`
- `gap.section = pad.block`
- `gap.region = round_to_8(pad.block * 1.5)`
- list rows and table headers inherit the same inner padding as their parent container
- helper text, validation copy, and provenance notes sit one space step below their control or summary, never detached by arbitrary margins

## Sizing and density

Define `densityStep(relaxed) = -1`, `densityStep(balanced) = 0`, and `densityStep(compact) = 1`.

Interactive control height:

- patient and public: `controlHeight = max(44, 48 - 4 * densityStep)`
- staff and professional: `controlHeight = max(40, 44 - 4 * densityStep)`

Passive data row height:

- balanced default: `40`
- compact: `36`
- `dense_data`: `32` for non-editable board cells, ranked grids, and telemetry rows only

Padding rules:

- `pad.inline = max(12, 16 - 4 * densityStep)`
- `pad.block = max(8, 12 - 2 * densityStep)`

No density mode may reduce type below the canonical type roles, remove required helper or error copy, or shrink focus treatment below the shared focus token.

## Iconography and stroke hierarchy

Icon buckets:

- inline and data: `16`
- standard: `20`
- primary and touch: `24`

Stroke tokens:

- `stroke.subtle = 1px`
- `stroke.default = 1px`
- `stroke.strong = 2px`
- `focus.ring = 2px`
- `focus.offset = 2px`
- `icon.stroke = 1.5px` at 16 and 20, `2px` at 24

Rules:

- icons align optically to cap height or control center, not arbitrary box center
- icon-only controls use the same minimum target rules as text buttons
- separators are for grouping only; state emphasis uses border plus background plus icon plus copy, never border alone

## Radius and elevation

Radius tokens:

- `radius.none = 0`
- `radius.sm = 4`
- `radius.md = 8`
- `radius.lg = 12`
- `radius.xl = 16`
- `radius.pill = 999`

Usage:

- tables, dense lists, and input wells: `0-4`
- cards, work panels, and task surfaces: `8`
- drawers, dialogs, and promoted support panes: `12`
- patient spotlight and high-comfort highlight surfaces may use `16`, but only when not stacked inside another rounded surface

Elevation model:

`offsetY = 2z`, `blur = 8z`, `alpha = min(0.12, 0.04 + 0.02z)` for `z ∈ {0, 1, 2, 3}`

Apply as:

- `z0`: flat surface plus boundary stroke
- `z1`: raised row, popover seed, or hover lift
- `z2`: drawer, side stage, or sticky dock
- `z3`: blocking dialog or high-priority overlay

Rules:

- use the lowest effective elevation
- elevated surfaces also require boundary contrast; shadow alone is not a layer signal
- boards, tables, and shell planes default to `z0` or `z1`, not floating-card stacks

## Color, contrast, and semantic state

Color tokens must be defined in perceptually uniform ramps such as OKLCH and then exposed through semantic roles rather than raw hue names.

Tone ladder:

`98, 96, 92, 88, 80, 72, 64, 52, 40, 28, 20, 12`

Families:

- neutral / graphite
- signal / info
- caution / triage
- critical / exception
- success / confirmation
- assistive / resolution

Role tokens:

- `surface.canvas`, `surface.shell`, `surface.panel`, `surface.inset`, `surface.overlay`
- `text.strong`, `text.default`, `text.muted`, `text.inverse`
- `border.subtle`, `border.default`, `border.strong`
- `state.info`, `state.success`, `state.warning`, `state.critical`, `state.assistive`
- `freshness.live`, `freshness.buffered`, `freshness.stale`, `freshness.provisional`, `freshness.blocked`
- `trust.trusted`, `trust.degraded`, `trust.unknown`, `trust.blocked`

Rules:

- neutral chroma stays low; semantic chroma escalates only with state consequence
- state containers use tonal background plus high-contrast text plus icon plus copy plus boundary
- patient and staff shells share the same semantic families; only density, topology, and allowed prominence differ
- no component may hardcode route-local "red", "green", or "brand" values outside semantic tokens

Contrast floors:

- body text and essential numerics: `>= 4.5:1`
- large text: `>= 3:1`
- icons, borders, charts, focus rings, and control boundaries essential to understanding: `>= 3:1`

## Surface-role tokens

All major components must inherit one surface role:

- `shell`: persistent frame, status strips, and mastheads
- `board`: multi-card operational overview with tight separators and low elevation
- `card`: bounded summary or comparison surface with `radius.md`
- `task`: active working surface with balanced padding and strongest local hierarchy
- `rail`: vertical navigation or checkpoint region; flat or lightly raised
- `drawer`: temporary contextual plane with `radius.lg`
- `form`: field clusters with stable label, control, and helper rhythm
- `list`: ranked or grouped rows with separator-first structure
- `table`: dense structured data with row-height and numeric alignment tokens
- `artifact`: summary-first document or preview surface

A component may switch posture, but it may not change surface role without updating its component tokens. "Card" is not the default answer for every bounded box.

## Motion

Duration tokens:

- `0`
- `120ms`
- `180ms`
- `240ms`
- `320ms` for overlay transitions only

Distance tokens:

- `4px`
- `8px`
- `12px`

Rules:

- animate opacity and translation first; scale is reserved for subtle emphasis and must remain within `0.98-1.0`
- live deltas animate in place and declare cause before movement
- focus, error, pending, and blocked states must have a non-motion equivalent
- reduced and essential-only motion modes preserve sequencing and prominence without spatial travel

## Shell profiles

Use these project-wide default profiles:

- `profile.patient_portal`: relaxed shell, balanced lists, 48 default controls, 44 minimum targets
- `profile.staff_workspace`: compact shell, balanced decision regions, compact queue and table surfaces
- `profile.hub_desk`: balanced shell, compact routing and booking lists, balanced patient-contact and handoff surfaces
- `profile.support_desk`: balanced shell, compact ticket lists and knowledge rails, balanced recovery and response surfaces
- `profile.pharmacy_console`: balanced shell, compact lane lists, balanced checkpoint and decision surfaces
- `profile.operations_console`: balanced shell, balanced action workbench, `dense_data` allowed for non-editable telemetry surfaces
- `profile.governance_admin`: compact analytical shell, balanced diff, evidence, and approval surfaces
- `profile.embedded_companion`: balanced constrained shell, patient-safe targets, reduced chrome, and no alternate semantic-color or state vocabulary

## Implementation law

- all shell, board, card, rail, drawer, form, list, table, task, and artifact tokens must resolve through this file and the owning shell profile
- local route documents may define information hierarchy and route-specific state logic, but not route-specific type scales, spacing ramps, radius ladders, shadow stacks, or semantic-color systems
- every shell and route class must publish one current `ProfileSelectionResolution`; shell-local styling is legal only when it is already represented as a profile-level selection on the canonical graph
- when a surface needs a new visual role, add or extend a `comp.*` token set here first, then consume it downstream
- when a surface needs new visible state meaning, add or extend the necessary `sys.*` and `comp.*` tokens here before any downstream `SurfaceStateSemanticsProfile`, accessibility, automation, or telemetry contract is updated
- any implementation artifact should be exportable to a token format that supports groups, aliases, composite tokens, and mode resolution
