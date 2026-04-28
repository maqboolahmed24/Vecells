# 371 External Reference Notes

Reviewed on 2026-04-27.

These references are support only. The local Phase 6, pharmacy console, and accessibility blueprints remain authoritative if there is any conflict.

## Borrowed Guidance

### Playwright browser proof posture

Sources:

- [Playwright Accessibility testing](https://playwright.dev/docs/accessibility-testing)
- [Playwright aria snapshots](https://playwright.dev/docs/aria-snapshots)
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)
- [Playwright emulation](https://playwright.dev/docs/emulation)
- [Playwright isolation](https://playwright.dev/docs/browser-contexts)

Borrowed:

- automated accessibility checks catch only part of the accessibility surface, so the suite combines semantic assertions, keyboard flows, aria snapshots, and explicit status-message checks
- `Locator.ariaSnapshot()` is suitable for generating scoped accessible-tree evidence during a browser run
- screenshot baselines need repeatable capture and comparison discipline
- viewport, media, locale, timezone, and reduced-motion emulation belong in browser context setup
- separate browser contexts keep patient, staff, desktop, tablet, phone, and cross-browser scenarios isolated

Applied in 371:

- each Playwright script starts fresh contexts for the relevant user surface
- reduced-motion contexts assert both bridge activation and collapsed transition durations
- aria snapshots are written for patient and staff degraded states
- visual baselines are captured only after route-state assertions pass
- Firefox smoke verifies critical patient and staff states outside Chromium

### WCAG 2.2 reflow, target size, and status messages

Sources:

- [Understanding WCAG 2.2 SC 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [Understanding WCAG 2.2 SC 2.5.8 Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Understanding WCAG 2.2 SC 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

Borrowed:

- a 320 CSS pixel viewport is the practical equivalent used for 400% reflow checks on horizontally written content
- interactive targets should satisfy at least the 24 by 24 CSS pixel minimum or a qualifying exception
- status messages need roles or properties so assistive technologies can announce updates without moving focus

Applied in 371:

- patient and staff narrow-width checks use 320 CSS pixel contexts and assert no page-level horizontal overflow
- visible patient and staff controls are checked against the 24 CSS pixel minimum
- announcement hubs and review or urgent patient states assert role `status` or `alert` semantics

### NHS accessibility, focus, and calm warning content

Sources:

- [NHS accessibility](https://service-manual.nhs.uk/accessibility)
- [NHS accessibility testing](https://service-manual.nhs.uk/accessibility/testing)
- [NHS design system](https://service-manual.nhs.uk/design-system)
- [NHS focus state](https://service-manual.nhs.uk/design-system/styles/focus-state)
- [NHS warning callout](https://service-manual.nhs.uk/design-system/components/warning-callout)

Borrowed:

- NHS services must meet WCAG 2.2 and should combine automated and manual accessibility practices
- keyboard testing must cover tab, shift-tab, enter, space, focus visibility, and avoiding hidden focus targets
- zoom and text-size testing should look for missing, overlapping, or horizontally scrolling content at 320 CSS pixels
- focus must not be hidden by sticky or overlaid UI
- warning content should be concise, specific, and self-contained instead of frightening or vague

Applied in 371:

- queue peek and referral confirmation drawers assert focus moves inside and returns to the trigger
- sticky decision docks are checked alongside reflow and focus-return behavior
- urgent and review patient branches remain explicit, while completed outcomes are the only calm completion state

### WAI-ARIA APG keyboard and dialog behavior

Sources:

- [WAI-ARIA APG Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [WAI-ARIA APG Dialog Modal Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

Borrowed:

- focus should persist in the interface after UI changes and should not fall back to the document body
- modal dialogs should move focus inside on open and keep tab sequence scoped until the dialog closes
- closing a dialog should return focus to the invoking control when that control remains available

Applied in 371:

- keyboard-only patient chooser completion uses tab, space, and enter
- staff drawer and queue peek flows assert focus is inside opened drawers and restored to their triggers after Escape

## Rejected Or Not Adopted

- We did not use screenshots alone as release proof.
- We did not accept automated accessibility scans as a substitute for explicit keyboard, aria, reflow, and status-message assertions.
- We did not convert urgent return, contact repair, or review states into calm completion language.
- We did not replace local pharmacy-loop truth with generic NHS content examples.
