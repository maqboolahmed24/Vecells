# 394 Algorithm Alignment Notes

## Measurement Model

The layer does not hard-code sticky footer height. `StickyActionObscurationGuard` measures the configured action reserve for each route family and writes:

- `--embedded-a11y-sticky-reserve`
- `--embedded-a11y-scroll-clearance`
- `data-sticky-reserve-px`

Focused controls use scroll margins that include the measured reserve and the safe-area inset. This aligns with WCAG guidance that scroll padding can prevent sticky content from hiding focused controls.

## Host Resize Model

`EmbeddedSafeAreaObserver` reads `visualViewport` dimensions when available and falls back to `window.innerHeight`. `HostResizeResilienceLayer` stores the active selector before resize, marks the route as `resizing`, then settles after a short debounce and scrolls the active element into view.

## Announcement Model

`AssistiveAnnouncementDedupeBus` accepts `embedded-a11y-announce` events. If the next message matches the last message, it increments duplicate telemetry but does not rewrite the live region. This avoids repeated screen reader output during autosave or repeated route status events.

## Route Boundary Model

The shared wrapper adds `EmbeddedRouteSemanticBoundary` as a named region outside the route-owned `main`. It does not replace route headings or landmarks, which keeps the NHS content rule of one page-level main heading and route-specific labels under existing route ownership.

## Playwright Alignment

The Playwright suite checks the same runtime contracts as the model:

- route family coverage reporter attributes
- keyboard focus style and input modality
- sticky action obscuration geometry
- live announcement dedupe counters
- viewport resize settlement
- ARIA snapshots for representative route semantics

