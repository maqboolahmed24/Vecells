# 348 External Reference Notes

Date reviewed: 23 April 2026

## Sources used

1. NHS England Digital, Directory of Healthcare Services (Service Search) API
   URL: https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services
   Borrowed:
   - DoHS / Service Search remains the current NHS service-discovery API family.
   - Version 1 and 2 were deprecated on 2 February 2026 and migration is to version 3.
   Adapted:
   - 348 treats `dohs_service_search` as the strategic adapter mode and prefers it over legacy data
     unless an authoritative local override is present.

2. NHS England Digital, Migrating from the EPS DoS API to the Directory of Healthcare Services
   (Service Search) API
   URL: https://digital.nhs.uk/developer/api-catalogue/electronic-prescription-service-directory-of-services/migrating-from-the-eps-dos-api-to-the-service-search-api
   Borrowed:
   - EPS DoS is deprecated.
   - New integrations are not allowed.
   - NHS recommends migration to DoHS / Service Search.
   Rejected:
   - The migration page’s example-specific search constraints were not imported into the domain
     model; the local freeze pack remains authoritative on ranking and visibility law.

3. NHS England Digital, Electronic Prescription Service Directory of Services API
   URL: https://digital.nhs.uk/developer/api-catalogue/electronic-prescription-service-directory-of-services
   Borrowed:
   - EPS DoS still exists as a supported read surface for dispensing-service lookup as of
     19 March 2026.
   Adapted:
   - 348 keeps `eps_dos_legacy` as a typed adapter with explicit `legacy` trust posture rather than
     deleting it from the runtime.

4. NHS England, Practices referring patients to Pharmacy First for lower acuity minor illnesses
   and clinical pathway consultations
   URL: https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/
   Borrowed:
   - referral is to a community pharmacist of the patient’s choice
   - patient consent is required before sending the referral message
   Adapted:
   - 348 makes recommendation advisory only and binds consent to the exact selected provider and
     proof tuple.

5. NHS England, Community pharmacy advanced service specification: NHS Pharmacy First Service
   URL: https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/
   Borrowed:
   - Pharmacy First is the service envelope for the seven clinical pathways
   - referrals and follow-up require safe digital handoff and outcome visibility
   Adapted:
   - 348 keeps pathway-aware capability and consent surfaces ready for later dispatch and
     outcome tracks.

6. Stripe API Reference, Idempotent requests
   URL: https://docs.stripe.com/api/idempotent_requests?api-version=2024-11-20.acacia
   Borrowed:
   - retry safety should bind to a stable idempotency key and the original request parameters
   - replay should return the original result after execution starts
   Adapted:
   - 348 persists command replay rows for selection, warned-choice acknowledgement, consent, and
     revocation.

## Local blueprint precedence

The local blueprint remained authoritative for:

- the ranking formula
- the full-visible-set law
- the exact warning and suppression semantics
- `PharmacyChoiceTruthProjection`
- `PharmacyConsentCheckpoint`

No external source was allowed to weaken the frozen 343 contract.
