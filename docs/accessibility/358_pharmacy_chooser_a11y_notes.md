# 358 Pharmacy Chooser Accessibility Notes

## Interaction model

- The provider comparison surface uses interactive cards with explicit buttons, not an ARIA `listbox`.
- This follows the APG guidance that `listbox` is not an accessible fit for options containing multiple interactive elements.
- The map is secondary and every marker is mirrored by a normal button row in the map list.

## Focus rules

- The chooser page root is focusable for same-shell recovery jumps.
- The warning acknowledgement panel is focusable and used as the recovery target when the shell `DecisionDock` needs the patient to acknowledge a warned choice.
- Drift recovery sends focus back to the chooser root instead of silently moving to a new provider.

## Keyboard coverage

- Filters are ordinary buttons in tab order.
- The map toggle is an ordinary pressed button.
- Provider selection is button-based, so list and map selection both work with keyboard alone.
- The warning acknowledgement step is a checkbox plus confirm button.

## Content posture

- Recommended and warned states are visible at the same time.
- Later or manual-route providers are not hidden; they are explained.
- Prior selections affected by proof drift stay visible as read-only provenance.

## Reduced motion and reflow

- Motion is limited to short transform and emphasis transitions.
- Reduced motion removes those transitions.
- Mobile proof checks must confirm no horizontal overflow at narrow widths.
