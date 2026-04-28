# 392 Embedded Pharmacy Accessibility Notes

## Landmarks

The route exposes a single `main`, one `header[role="banner"]`, a labelled route `nav`, labelled sections, and a labelled sticky action reserve. This follows the embedded shell pattern from 389 to 391 and avoids a second page shell inside the NHS App webview.

## Choice Semantics

The provider list uses `role="list"` and `role="listitem"`. Each provider row has a single explicit button with `aria-pressed` for the current selection. Distance and travel details are in `dl` metadata and never act as the primary selection cue.

## Disclosure

Warned-choice and proof-refresh detail uses a disclosure button with `aria-expanded` and `aria-controls`. The warning acknowledgement checkbox remains visible and labelled inside the same panel.

## Live Regions

Route changes and selection feedback are announced through `EmbeddedPharmacyLiveRegion` with `aria-live="polite"`. Urgent return cards use alert semantics only when the upstream review projection marks the announcement as urgent.

## Reduced Motion and Safe Area

The CSS has `prefers-reduced-motion` parity and keeps the action reserve within the viewport using dynamic viewport and safe-area padding.

