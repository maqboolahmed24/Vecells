# 391 Algorithm Alignment Notes

The embedded booking model imports the existing Phase 4 and Phase 5 frontend projections rather than reconstructing a second scheduler. Offer ordering and selected slot truth come from `OfferSelectionProjection` and `BookingSlotResultsProjection`. Confirmation states come from `BookingConfirmationProjection`. Waitlist states come from `PatientWaitlistViewProjection`. Manage and reminder states come from `PatientAppointmentManageProjection`. Alternative offer provenance and drift handling come from `PatientNetworkAlternativeChoiceProjection`.

The main route law is that UI actionability follows canonical truth. The nonexclusive selected slot can be reviewed but cannot display a hold countdown. The exclusive hold fixture displays hold-expiry posture because `countdownMode` is `hold_expiry` and truth is `exclusive_held`. Stale selection, publication drift, and recovery fixtures suppress live mutation and keep the last safe context visible.

Calendar behavior is centralized by `EmbeddedBookingCalendarBridgeAction`. The action payload uses the NHS App JS API shape, but the UI only exposes it through `EmbeddedBookingCalendarActionCard` after confirmation truth is `confirmed`.

