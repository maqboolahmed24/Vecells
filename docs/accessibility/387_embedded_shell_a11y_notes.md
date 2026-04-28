# 387 Embedded Shell Accessibility Notes

## Landmarks And Regions

Standalone mode keeps a portal header and footer. Embedded mode suppresses duplicate supplier chrome and keeps one compact banner-like header frame, one labelled route region, one state ribbon, one continuity banner, one recovery frame, and one dominant action reserve.

`EmbeddedRouteContextBoundary` carries the canonical DOM markers from the UI contract kernel and exposes a labelled region for the current route.

## Status And Recovery

`EmbeddedShellStateRibbon` uses `role="status"` and `aria-live` from the recovery posture. `EmbeddedRecoveryFrame` uses `role="status"` for ordinary recovery and `role="alert"` for blocked wrong-patient or eligibility states.

The recovery frame explains reason, actionability, and next safe step without relying on color. Mutating controls are disabled when `data-mutation-state="frozen"`.

## Focus

On route changes, focus returns to the selected anchor in the shared route content. The sticky action reserve keeps minimum 44px targets and uses visible focus rings with outline offset so focus is not clipped by fixed chrome.

## Narrow Webview

At narrow widths, the embedded shell stays the same shell and folds to a single column. The sticky action reserve moves from three columns to stacked controls and preserves safe-area padding.

## Playwright Coverage

The Playwright proof captures:

- standalone and embedded contexts separately
- narrow device emulation
- ARIA snapshots for `EmbeddedShellStateRibbon` and `EmbeddedRecoveryFrame`
- screenshots for standalone, embedded, narrow embedded, and reduced motion
- traces for refresh recovery, deep-link recovery, and safe browser handoff return
- assertions that `standalone-shell-header`, `standalone-shell-footer`, `patient-shell-masthead`, and `patient-shell-footer` are absent in embedded mode
