# 394 Embedded Accessibility And Responsive Notes

## Coverage

The shared layer wraps all embedded route families and exposes the same automation hooks on every route:

- `EmbeddedAccessibilityResponsiveLayer`
- `EmbeddedFocusGuard`
- `EmbeddedFocusRestoreBoundary`
- `StickyActionObscurationGuard`
- `EmbeddedSafeAreaObserver`
- `HostResizeResilienceLayer`
- `AssistiveAnnouncementDedupeBus`
- `EmbeddedKeyboardParityHooks`
- `EmbeddedReducedMotionAdapter`
- `EmbeddedA11yCoverageReporter`
- `EmbeddedRouteSemanticBoundary`
- `EmbeddedTargetSizeUtilities`

## Accessibility Behavior

- Focus visibility uses a high contrast yellow focus ring with a blue outer ring.
- Sticky action reserves are measured and written to CSS variables so focused controls receive enough scroll margin.
- The skip link appears only on keyboard focus and moves to the embedded content boundary.
- The focus restore boundary records route-local focus using session storage and restores only when focus would otherwise land on the body.
- The live region bus keeps one polite live region per route wrapper and suppresses duplicate messages.
- Keyboard parity hooks track keyboard modality, support Escape dismissal announcements, and make custom role buttons activate with Enter or Space.
- Reduced motion mode shortens animation and transition duration and disables smooth scroll.
- Target-size utilities enforce `44px` controls while keeping native radio and checkbox controls at a `24px` minimum inside larger labels.

## Manual Review Anchors

- [WCAG Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum): sticky action reserves must not hide keyboard focus.
- [WCAG Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum): controls need minimum target size or spacing.
- [WCAG Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance): the focus indicator must be perceivable.
- [NHS accessibility content guidance](https://service-manual.nhs.uk/accessibility/content): headings, labels, and control names must stay meaningful.
- [Playwright ARIA snapshots](https://playwright.dev/docs/aria-snapshots): semantic coverage is verified through route-local snapshots.

## Test Evidence

The Playwright suite for this task covers:

- keyboard tab flow and sticky action obscuration
- viewport resize and deduped live announcements
- ARIA snapshots and route coverage reporter attributes
- mobile visual screenshots with reduced-motion emulation

