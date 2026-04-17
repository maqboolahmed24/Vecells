# Design System

## Purpose

Single legal shared home for tokens, automation markers, accessibility vocabulary, and shell-inheritance law.

## Ownership

- Package: `@vecells/design-system`
- Artifact id: `package_design_system`
- Owner lane: `Design System` (`design_system`)
- Canonical object families: `20`
- Shared contract families: `1`
- Versioning posture: `workspace-private published contract boundary with explicit public exports`

## Source Refs

- `docs/architecture/14_frontend_stack_decision.md`
- `blueprint/platform-frontend-blueprint.md#DesignContractPublicationBundle`
- `prompt/044.md`

## Consumers

- Boundary contracts: CBC_041_SHELLS_TO_DESIGN_SYSTEM
- Consumer selectors: apps/\*

## Allowed Dependencies

- none

## Forbidden Dependencies

- `packages/domains/*`
- `services/*`

## Public API

- `ownedContractFamilies`
- `ownedObjectFamilies`
- `eventFamilies`
- `policyFamilies`
- `projectionFamilies`
- `bootstrapSharedPackage()`
- `VecellLogoIcon`
- `VecellLogoWordmark`
- `VecellLogoLockup`
- `formatVecellTitle(surface, detail?)`
- `applyVecellBrowserBranding({ surface, detail?, document?, faviconHref? })`

## Contract Families

- `Design tokens, accessibility vocabulary, and automation markers`

## Family Coverage

- Dominant kinds: contract=2, descriptor=4, other=10, policy=2, record=1, token=1
- Representative object families: AccessibilityEquivalenceCheck, AccessibilitySemanticCoverageProfile, AccessibleContentVariant, AmbientStateRibbon, AppPageIntent, AssistiveCompositionPolicy, AssistiveTextPolicy, AutomationAnchorMap, AutomationAnchorProfile, BreakpointInterpolationRule, FieldAccessibilityContract, FreshnessAccessibilityContract

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through documented public package names only and never reaches through sibling internals.

## Vecell Branding

- The canonical `vecell` logo geometry lives in `src/vecell-branding.tsx`.
- `VecellLogoIcon`, `VecellLogoWordmark`, and `VecellLogoLockup` are all derived from that one source SVG path. They are cropped variants, not separate redraws.
- Use `VecellLogoIcon` for favicon or tab chrome and other compact emblem slots.
- Use `VecellLogoWordmark` for compact in-flow brand bands where the full lockup would crowd the layout.
- Use `VecellLogoLockup` for mastheads, hero brand rows, and other top-level shell chrome.
- Browser title and favicon chrome must be applied through `applyVecellBrowserBranding(...)` from each app entrypoint.
- Routed detail titles must use `formatVecellTitle(surface, detail?)` so browser chrome stays in the form `vecell | <surface>` or `vecell | <surface> | <detail>`.
- Route-local inline SVG logos, pseudo-mark brand shapes, and ad hoc favicon data URIs are not legal substitutes for the shared exports.
