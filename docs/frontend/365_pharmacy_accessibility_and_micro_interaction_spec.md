# 365 Pharmacy Accessibility And Micro Interaction Spec

## Visual Mode
`Pharmacy_Accessible_Quiet_Polish`

## Scope
- Keep the Phase 6 patient and pharmacy shells visually recognizable.
- Strengthen semantics, keyboard order, focus return, reduced-motion behavior, and calm announcement posture.
- Apply the same shared primitives across both shells and the existing drawers.

## Shared Primitives
- `PharmacyA11yAnnouncementHub`
- `PharmacyFocusRouteMap`
- `PharmacyAccessibleStatusBadge`
- `PharmacyInlineAck`
- `PharmacyTargetSizeGuard`
- `PharmacyReducedMotionBridge`
- `PharmacyDialogAndDrawerSemantics`

## Route Families
- `rf_patient_pharmacy`
- `rf_pharmacy_console`

## Acceptance Shape
- Route buttons stay in same-shell order and advertise active state.
- Drawer and dialog entry moves focus inside the opened surface.
- Escape closes pharmacy drawers and returns focus to the opening trigger.
- Reduced motion collapses transitions and removes smooth support scrolling.
- Mobile and 320px shells stay free of horizontal overflow.
- Warned-choice acknowledgement remains inline with the selected pharmacy rather than becoming a detached page-level warning.
