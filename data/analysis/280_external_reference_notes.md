# 280 External Reference Notes

Reviewed on 2026-04-18. These sources were support material only. When they differed in emphasis or left room for interpretation, the local blueprint remained authoritative.

## Borrowed support

1. HL7 FHIR R4 Slot
   - URL: <https://hl7.org/fhir/R4/slot.html>
   - Borrowed: slot state alone does not imply transactional exclusivity or final booking truth.
   - Applied to: canonical-slot identity, truthful-nonexclusive offer posture, and the rejection of raw slot presence as commit proof.

2. HL7 FHIR R4 Appointment
   - URL: <https://hl7.org/fhir/R4/appointment.html>
   - Borrowed: appointment resources are outcome-carrying records, but they still need stronger confirmation discipline than simple local acknowledgement or detached object presence.
   - Applied to: `BookingConfirmationTruthProjection`, authoritative proof classes, and reminder or artifact gating.

3. NHS England Digital GP Connect developer guidance
   - URL: <https://digital.nhs.uk/developer/api-catalogue/gp-connect-1-2-7>
   - Borrowed: appointment-management and booking integrations have explicit bounded capability and confirmation rules, not generic success semantics.
   - Applied to: typed adapter-binding refs, capability-safe manage exposure, and same-shell pending or reconciliation posture.

4. NHS App appointments guidance
   - URL: <https://digital.nhs.uk/services/nhs-app/nhs-app-features/appointments>
   - Borrowed: booking and appointment posture must stay calm, summary-first, and explicit about what the patient can actually do next.
   - Applied to: booked-summary exposure, manage-entry wording, and reminder or artifact suppression before confirmation truth is live.

5. NHS App hospital and specialist appointments help
   - URL: <https://www.nhs.uk/nhs-app/help/appointments/hospital-and-other-appointments/>
   - Borrowed: straight-language appointment help and recovery cues when online pathways are incomplete.
   - Applied to: support-fallback copy, same-shell recovery posture, and typed waitlist or fallback seams.

6. NHS Service Manual content guidance
   - URL: <https://service-manual.nhs.uk/content>
   - Borrowed: calm, direct wording with no inflated certainty.
   - Applied to: patient and staff narrative rules in recovery, pending-confirmation, and support-fallback states.

7. NHS Service Manual error-message guidance
   - URL: <https://service-manual.nhs.uk/design-system/components/error-message>
   - Borrowed: visible recovery cues should explain what changed and what the user can do next without collapsing into generic failure.
   - Applied to: stale-refresh, revalidation-failure, and manage recovery rules.

8. Playwright screenshots, trace viewer, and aria snapshots
   - URLs:
     - <https://playwright.dev/docs/screenshots>
     - <https://playwright.dev/docs/trace-viewer>
     - <https://playwright.dev/docs/aria-snapshots>
   - Borrowed: interactive proof should validate selection sync, keyboard traversal, screenshots, and aria-backed atlas parity.
   - Applied to: the 280 atlas proof and deterministic output artifact naming.

## Borrowed visual support

1. Linear changelog
   - URL: <https://linear.app/changelog>
   - Borrowed: low-noise operational and transactional framing.

2. Vercel Academy nested layouts
   - URL: <https://vercel.com/academy/nextjs-foundations/nested-layouts>
   - Borrowed: persistent rail-plus-canvas hierarchy.

3. Vercel dashboard navigation
   - URL: <https://vercel.com/changelog/new-dashboard-navigation-available>
   - Borrowed: restrained navigation with stable route context.

4. IBM Carbon data-table usage
   - URL: <https://carbondesignsystem.com/components/data-table/usage/>
   - Borrowed: dense but scan-safe lower ledgers and matrices.

5. NHS Service Manual typography
   - URL: <https://service-manual.nhs.uk/design-system/styles/typography>
   - Borrowed: calm hierarchy and accessible line lengths.

## Rejected or constrained interpretations

1. Rejected: the booking UI can talk directly to live supplier lists.
   - Why: the local blueprint is explicit that search resolves to governed snapshots with freshness and recovery posture.

2. Rejected: selected means held.
   - Why: `ReservationTruthProjection` is the sole authority for exclusivity and hold countdowns.

3. Rejected: appointment record presence or accepted-for-processing equals booked.
   - Why: `BookingConfirmationTruthProjection` requires authoritative outcome plus durable proof or same-commit read-after-write.

4. Rejected: async or disputed confirmation can still look calm.
   - Why: pending and reconciliation are first-class same-shell states.

5. Rejected: manage can infer capability or safety from page shape.
   - Why: manage exposure must bind current capability, continuity evidence, route writability, and safety-preemption law.

6. Rejected: waitlist or fallback is somebody else’s problem later.
   - Why: search, offer, and commit already depend on typed continuation truth.
