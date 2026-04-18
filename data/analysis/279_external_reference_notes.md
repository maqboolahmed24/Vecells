# 279 External Reference Notes

Reviewed on 2026-04-18. These sources were support material only. When they differed in emphasis or left room for interpretation, the local blueprint remained authoritative.

## Borrowed support

1. NHS England Digital IM1 Pairing integration guidance
   - URL: <https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration>
   - Borrowed: current pairing posture, supplier onboarding shape, and the fact that technical detail arrives through supplier PIP and acceptance stages instead of generic public capability claims.
   - Applied to: fail-closed matrix rows, typed onboarding gaps, and the decision not to hard-code optimistic supplier behavior.

2. NHS England Digital IM1 interface mechanisms guidance
   - URL: <https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/interface-mechanisms-guidance>
   - Borrowed: the split between Patient API and Transaction API, including linkage requirements and the possibility of local consumer components or GP Connect dependencies.
   - Applied to: mandatory integration-mode enum values, local-component-required recovery, and linkage-required posture.

3. NHS England Digital GP Connect developer guidance
   - URL: <https://digital.nhs.uk/developer/api-catalogue/gp-connect-1-2-7>
   - Borrowed: the service should be treated as an explicit integration mode with bounded appointment-management semantics, not a generic vendor synonym.
   - Applied to: separate `gp_connect_existing` mode, staff-first manage posture, and durable-provider-reference confirmation policy.

4. NHS standards guidance for DCB0129 and DCB0160
   - URLs:
     - <https://standards.nhs.uk/published-standards/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems>
     - <https://standards.nhs.uk/published-standards/dcb0160-clinical-risk-management-its-application-in-the-deployment-and-use-of-health-it-systems>
   - Borrowed: configurable capability exposure is a clinical-safety concern and must fail closed on stale or degraded configuration.
   - Applied to: trust/publication gating, blocked-action reason classes, and recovery-only projection rules.

5. HL7 FHIR R4 Appointment and Slot
   - URLs:
     - <https://hl7.org/fhir/R4/appointment.html>
     - <https://hl7.org/fhir/R4/slot.html>
   - Borrowed: slot and appointment resources do not collapse tentative processing into durable booked truth by themselves.
   - Applied to: authoritative-read and confirmation-gate policies, especially the rule that accepted-for-processing is not equivalent to booked.

## Borrowed visual support

1. Playwright docs
   - URL: <https://playwright.dev/docs/test-assertions>
   - Borrowed: selector-driven proof and accessibility-first validation posture for the atlas.

2. Linear changelog
   - URL: <https://linear.app/changelog>
   - Borrowed: low-noise operational board treatment and compact detail inspectors.

3. Vercel Academy nested layouts and Vercel dashboard navigation
   - URLs:
     - <https://vercel.com/academy/nextjs-foundations/nested-layouts>
     - <https://vercel.com/changelog/new-dashboard-navigation-available>
   - Borrowed: stable rail-and-canvas route framing and disciplined lateral navigation.

4. IBM Carbon data-table usage
   - URL: <https://carbondesignsystem.com/components/data-table/usage/>
   - Borrowed: dense but scan-safe table structure for lower parity ledgers.

5. NHS Service Manual typography and content guidance
   - URLs:
     - <https://service-manual.nhs.uk/design-system/styles/typography>
     - <https://service-manual.nhs.uk/content>
   - Borrowed: plain language, restrained emphasis, and accessible text hierarchy.

## Rejected or constrained interpretations

1. Rejected: supplier label implies self-service capability.
   - Why: both the Phase 4 blueprint and current NHS pairing guidance leave supplier-specific capability detail to bounded onboarding packs and prerequisites.

2. Rejected: Transaction API support implies direct patient booking.
   - Why: the public interface-mechanisms guidance is explicit that Transaction API posture can depend on GP Connect or local consumer components.

3. Rejected: accepted-for-processing equals booked.
   - Why: HL7 Appointment semantics and the booking blueprint both require stronger authoritative proof.

4. Rejected: atlas visuals can add semantics not present in the contracts.
   - Why: the atlas is generated from the same tuples, bindings, and policy registries as the validator. Any extra meaning would become drift by design.
