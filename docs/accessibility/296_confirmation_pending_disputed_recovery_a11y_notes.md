# 296 Accessibility notes

## Status messaging

- The confirm surface uses a polite live region with `role="status"` and `aria-atomic="true"` so state changes announce without stealing focus.
- Review, in-progress, pending, recovery, and confirmed states all update the same live region instead of spawning multiple alert stacks.

## Focus and continuity

- Refresh-safe confirm states keep the route and selected-slot anchor stable instead of moving focus away from the chosen slot.
- The selected-slot card stays in DOM order ahead of the recovery and artifact regions on narrow screens.
- Browser history returns from the confirm child route back to the slot results route without dropping the patient into a detached page family.

## Read-only, frozen, and confirmed posture

- Route-freeze and identity-repair cases suppress live action while preserving safe context in the same shell.
- Summary-only artifact posture remains readable without pretending to be interactive.
- Confirmed state unlocks manage and artifact buttons only when the route exposes `manageExposureState=writable` and `artifactExposureState=handoff_ready`.

## WCAG 2.2 checks

- Focus treatment remains high contrast on progress steps, state actions, and artifact buttons.
- Buttons and chip-like controls stay above touch-friendly minimum sizes.
- Reduced-motion mode removes animated loader emphasis and keeps state meaning in text, outline, and structural changes.
