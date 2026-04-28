# 328 Patient Network Alternative Choice A11y Notes

## Landmarks and structure

- keep the same booking-shell `banner`, `nav`, and single `main`
- render the live option stack as one `radiogroup`
- keep callback fallback as a separate article beneath the radiogroup
- keep provenance and repair surfaces as plain content panels, not disabled pseudo-dialogs

## Keyboard behavior

- the option stack uses radio-style keyboard movement with arrow keys plus `Home` and `End`
- first entry lands on the first option when nothing is selected
- after selection, only the selected option remains in the tab order
- tab order continues through callback, decline-all where present, and the decision rail without requiring hover

## Live updates and status

- route announcements publish through a `role="status"` live region
- selection, decline-all, callback request, and recovery navigation each update the live region
- recovery panels keep the last safe option context in text, not color alone

## Focus visibility and sticky content

- focusable controls inherit the shell scroll padding and sticky reserve
- folded layouts keep the sticky tray above the bottom safe area
- focused controls must remain visible with sticky tray or embedded host ribbon present

## Reflow and mobile

- no horizontal scrolling at `320px` width
- option cards collapse from multi-column facts to one-column facts on small screens
- embedded NHS App presentation suppresses browser chrome without changing route semantics

## Non-color cues

- recommendation, warn, blocked, and callback states always include text labels
- read-only provenance is explained with headings and factual rows, not disabled color alone

## Reduced motion

- motion is non-essential
- reduced-motion mode removes transition dependence while preserving order, emphasis, and recovery context
