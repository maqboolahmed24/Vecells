# 392 Algorithm Alignment Notes

## Local Sources

- `blueprint/phase-6-the-pharmacy-loop.md`: pharmacy choice, dispatch proof, patient instructions, outcome, bounce-back, urgent return, and reopen laws.
- `blueprint/patient-account-and-communications-blueprint.md`: pharmacy child routes remain in the patient account route family.
- `blueprint/phase-0-the-foundation-protocol.md`: continuity, freeze, provenance, and artifact laws.
- `blueprint/phase-7-inside-the-nhs-app.md`: NHS App is a runtime shell over canonical flows, not a workflow fork.
- `blueprint/accessibility-and-content-system-contract.md`: semantic, content, and recovery copy obligations.
- Validated 387, 388, 389, and 391 outputs: embedded route detection, one-main shell behavior, safe-area action reserve, and route-family continuity.

## Implementation Mapping

- `EmbeddedPharmacyContext.choicePreview` binds to `resolvePharmacyChoicePreview`.
- `EmbeddedPharmacyContext.dispatchPreview` binds to `resolvePharmacyDispatchPreview`.
- `EmbeddedPharmacyContext.patientStatusPreview` binds to `resolvePharmacyPatientStatusPreview`.
- `EmbeddedPharmacyContinuityEvidence` records chosen provider provenance and source projection references.
- `actionabilityFor` suppresses provider-change controls after proof refresh, dispatch drift, contact repair, outcome repair, or urgent return.

## Gap Result

No `PHASE7_BATCH_388_395_INTERFACE_GAP_EMBEDDED_PHARMACY.json` was required. The existing Phase 6 preview projections cover the embedded route family.

