# Auth Callback And Recovery Accessibility Notes

Task: `par_195`

## Landmarks And Headings

The production route exposes a banner, navigation rail, main landmark, status live region, and contextual aside. Each auth state has a single focused `h1` after navigation so callback and recovery transitions are announced predictably.

## Keyboard

All state rail entries and recovery actions are native buttons. Playwright covers Tab traversal, route-state activation, back-button recovery, and Enter activation from the static atlas rows.

## Live Updates

`data-testid="auth-live-region"` uses `role="status"` and `aria-live="polite"` for callback holding and route-state changes. Blocking or recovery notices use `role="alert"` only when action has been narrowed or denied.

## Reduced Motion

The app honors `prefers-reduced-motion: reduce` by collapsing transition and animation durations to near zero and removing translate hover/current-state offsets. The static showcase mirrors the same behavior.

## Contrast And Focus

The palette is constrained to the central auth callback tokens. Focus uses `#0B57D0`; blocked and caution states are not communicated by color alone because reason-code proof and summary copy are adjacent to the visual state.

## Privacy

No raw OIDC claims, tokens, provider subject identifiers, signed URLs, or raw NHS numbers are rendered. The identity chip uses masked context only and switches to signed-out copy after sign-out settlement.
