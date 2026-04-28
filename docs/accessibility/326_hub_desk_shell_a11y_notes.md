# 326 Hub Desk Shell Accessibility Notes

## Landmarks and structure

- The shell renders one `header`, one route-level `nav`, one `main`, and route-local `aside` regions.
- Queue, case, alternatives, exceptions, and audit remain in the same shell family, so focus restoration never depends on cross-app redirects.

## Focus and keyboard order

- Keyboard order is `navigation -> primary stage -> digest -> route host`.
- The shell publishes one focus-restore marker through `HubShellContinuityBinder`.
- `scroll-padding-top` is applied on the root document so the sticky masthead and status strip do not obscure focused content.

## Read-only and recovery posture

- Observe-only and audit routes stay visibly distinct from claimed-active routes through shell posture, ownership chips, and disabled dominant-action semantics.
- Recovery-required routes stay in the same shell and do not fall back to generic error or support pages.

## Reduced motion

- Reduced-motion mode collapses transitions to near-zero rather than removing structure or changing information order.
- The same saved-view, queue-row, and case-anchor hierarchy remains visible in reduced-motion layouts.

## Responsive behavior

- Wide queue entry uses `two_plane`.
- Wide case and child routes use `three_panel`.
- Narrow layouts fold to `mission_stack` without horizontal scroll.
- The queue rail, digest, and route host reorder vertically but preserve the same shell and anchor markers.

## Assistive proof surface

- Playwright accessibility checks cover default, read-only, and recovery-required shell states.
- ARIA snapshots are used only for broad structural checks; targeted assertions still verify the dominant region, shell posture, and route host semantics.
