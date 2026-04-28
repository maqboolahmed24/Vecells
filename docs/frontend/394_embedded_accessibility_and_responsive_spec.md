# Embedded Accessibility And Responsive Spec

Task: `par_394`

Visual mode: `NHSApp_Embedded_Accessibility_Responsive_Hardening`

## Purpose

This task adds a shared hardening layer around every Phase 7 NHS App embedded route. The layer is intentionally wrapper based: entry, start request, request status, booking, pharmacy, recovery, and embedded shell routes keep their existing model and component ownership while gaining common focus, keyboard, resize, live announcement, target size, reduced motion, and semantic coverage behavior.

The implementation is wired in [App.tsx](/Users/test/Code/V/apps/patient-web/src/App.tsx) before any non-embedded patient routes.

## Route Families

- `entry_corridor`: `/nhs-app/entry?entry=landing&route=request_status&channel=nhs_app`
- `start_request`: `/nhs-app/start-request/:draft/request-type`
- `request_status`: `/nhs-app/requests/:requestRef/status`
- `booking`: `/nhs-app/bookings/:bookingCaseId/offers`
- `pharmacy`: `/nhs-app/pharmacy/:pharmacyCaseId/choice`
- `recovery_artifact`: `/nhs-app/recovery/:journeyRef/:view`
- `embedded_shell`: `/nhs-app/requests/:requestRef/status?phase7=embedded_shell`

Each family is mapped in [embedded-accessibility-responsive.model.ts](/Users/test/Code/V/apps/patient-web/src/embedded-accessibility-responsive.model.ts).

## Components

- `EmbeddedFocusGuard` provides a keyboard-visible skip target and route content focus entry point.
- `EmbeddedFocusRestoreBoundary` records the last focused embedded control and restores only when the host leaves focus on the document body.
- `EmbeddedSafeAreaObserver` measures visual viewport size and keyboard offset, then exposes CSS variables for safe-area padding.
- `StickyActionObscurationGuard` measures each route action reserve and keeps keyboard focus out from under sticky actions.
- `HostResizeResilienceLayer` settles host-driven viewport resize and scrolls the active element back into view.
- `AssistiveAnnouncementDedupeBus` provides a single polite live region and suppresses repeated announcement text.
- `EmbeddedKeyboardParityHooks` records keyboard versus pointer modality, supports Escape dismissal semantics, and activates custom role buttons with Enter or Space.
- `EmbeddedReducedMotionAdapter` mirrors reduced-motion preference into the layer and CSS variables.
- `EmbeddedA11yCoverageReporter` exposes route-family coverage data for Playwright and contract validators.
- `EmbeddedRouteSemanticBoundary` adds one named route boundary without replacing route-owned `main` landmarks.
- `EmbeddedTargetSizeUtilities` measures actionable controls and applies target-size CSS utilities.

## Design Rules

- Do not add visible chrome around route content.
- Preserve one route-owned `main` landmark per embedded route.
- Use `44px` as the local minimum touch target for primary controls and `24px` as the WCAG minimum audit floor.
- Keep sticky action reserves measured, not guessed, because embedded host safe areas and browser UI vary by platform.
- Prefer scroll padding and scroll margins over manually changing each route layout.
- Keep live announcements polite and deduplicated so autosave, route status, and recovery messages do not repeat through the shared layer.

## Source Alignment

- NHS App web integrations run inside the app host and have constrained native APIs: [NHS App web integration guidance](https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/) and [JS API v2](https://nhsconnect.github.io/nhsapp-developer-documentation/js-v2-api-specification/).
- NHS content guidance requires meaningful headings, one main heading pattern, clear control names, labels, and error summaries: [NHS accessibility content guidance](https://service-manual.nhs.uk/accessibility/content).
- WCAG 2.2 focus must not be hidden by author content, especially sticky footers: [Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum).
- WCAG 2.2 pointer targets need minimum size or spacing: [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).
- Playwright ARIA snapshots and emulation are used for route semantics, reduced motion, and viewport checks: [ARIA snapshots](https://playwright.dev/docs/aria-snapshots) and [emulation](https://playwright.dev/docs/emulation).

