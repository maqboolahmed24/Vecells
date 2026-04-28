# 302 Algorithm Alignment Notes

## Local blueprint alignment

- `patient-portal-experience-architecture-blueprint.md`
  - keep one route family
  - use `mission_stack` as the only compact fold
  - preserve return and selected-anchor continuity
- `canonical-ui-contract-kernel.md`
  - fold and unfold without semantic drift
  - publish breakpoint and continuity markers
- `accessibility-and-content-system-contract.md`
  - cover compact, narrow, medium, expanded, wide, host resize, safe-area shifts, reduced motion, and 400% zoom
- `phase-7-inside-the-nhs-app.md`
  - embedded hosting may suppress chrome but not capability truth

## Coverage mapping

- Workspace shell
  - summary rail -> drawer on folded mission stack
  - return continuity -> drawer on folded mission stack
  - dominant action -> shared sticky tray on folded mission stack
- Offer selection
  - selected slot remains pinned on folded mission stack
  - compare and refine stay sheet-based
- Confirmation
  - selected slot provenance and booked summary remain pinned
  - artifact actions narrow lawfully in embedded host mode
- Manage
  - booked summary remains pinned
  - deeper summary moves into `ManageCompactSummarySheet`
- Waitlist
  - active offer or provenance stays pinned
  - `ResponsiveWaitlistCard` keeps one compact card language across states

## Machine-readable markers

- `data-breakpoint-class`
- `data-mission-stack-state`
- `data-safe-area-class`
- `data-sticky-action-posture`
- `data-embedded-mode`

## Proof shape

- Playwright desktop and mobile viewports
- Playwright reduced-motion emulation
- Embedded host query parameters
- Overflow assertions
- Axe and accessibility snapshots
