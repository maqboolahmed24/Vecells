# Phase 7 Accessibility Support Contracts

Task 383 makes accessibility evidence a promotion dependency rather than an advisory note.

## Accessible Content Variant

`AccessibleContentVariant` records the route-specific copy and semantic coverage needed for the NHS App shell:

- `wcagLevel`: currently `WCAG2.2-AA`
- `contentGrade`: NHS service manual aligned
- `mobileReadinessState`: responsive, summary-only, placeholder, or not verified
- `ariaPatternRefs`: WAI-ARIA APG landmarks, names, forms, disclosure, or dialog refs
- `accessibilityAuditRef`: resolved through `AuditEvidenceReferenceResolver`

If a variant is missing, not verified, or points to a failed/missing/stale audit, the route emits `accessibility_audit_missing`.

## UI State Contract

`UIStateContract` records whether the route can safely run inside the NHS App webview:

- embedded shell support
- summary safety and placeholder support
- host resize and native safe-area behavior
- reduced motion support
- semantic coverage
- bridge downgrade behavior
- required bridge actions

The verifier emits `incompatible_ui_state` when semantic coverage, host resize, safe-area handling, or compatible state is not sufficient for embedded promotion. Adaptation-first routes may still return `placeholder_only` when their accessible summary contract is current.

## Audit Evidence

Accessibility audit refs are resolved alongside compatibility, bridge support, and shell semantics evidence. The current seed aligns with NHS service manual WCAG 2.2 guidance, W3C WCAG 2.2, WAI-ARIA APG, and Playwright ARIA snapshot contracts. Automated ARIA snapshots support regression detection, but the verifier still requires an explicit audit state so snapshots are not mistaken for full conformance.
