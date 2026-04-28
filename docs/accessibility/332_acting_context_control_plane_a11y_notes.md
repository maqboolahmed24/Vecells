# 332 Acting Context Control Plane Accessibility Notes

## Semantic intent

- `HubActingContextChip` is a real button, not decorative masthead chrome.
- `OrganisationSwitchDrawer` stays same-shell and keeps the underlying route visible; the shell does not fake a page transition.
- `BreakGlassReasonModal` uses modal dialog semantics and explicit close controls.
- `ScopeDriftFreezeBanner` is non-modal and does not steal focus.
- `MinimumNecessaryPlaceholderBlock` explains withheld content instead of leaving silent gaps.

## Keyboard and focus

- the acting-context chip is reachable from the masthead without detouring through account chrome
- switcher rows remain full-width buttons with visible focus treatment
- purpose rows may be `current`, `available`, `pending`, or `blocked`; blocked rows stay visibly blocked and disabled
- the break-glass modal keeps one visible close affordance plus one primary confirmation action
- same-shell scope switching preserves the selected case anchor and route family

## WCAG and APG considerations

- reflow and 400% zoom: summary strip and placeholder grid collapse to one column
- focus not obscured: drawer and modal keep focused elements visible
- target size: acting-context chip, switcher rows, and modal actions stay within touch-safe dimensions
- disclosure and dialog behavior: switcher and modal controls expose explicit state rather than hidden account-menu behavior

## Content rules

- read-only posture remains scannable and explanatory
- denied posture blocks operational detail more strongly than read-only
- break-glass text stays explicit across active, expiring, revoked, and denied states
- placeholder copy names the reason for withholding: audience tier, role, elevation, or out-of-scope
