# 369 External Reference Notes

Task `seq_369` reviewed current official references before coding. The local Phase 6 blueprint remains authoritative; the references below only shaped testing posture, external terminology, and failure evidence expectations.

## Borrowed

- Playwright assertions: use web-first auto-retrying locators and explicit attributes for stable state checks. Source: https://playwright.dev/docs/test-assertions
- Playwright traces: retain traces on failure and treat DOM, console, network, and action timelines as failure-debug evidence, not routine PHI artifacts. Source: https://playwright.dev/docs/trace-viewer-intro
- Playwright accessibility: automated accessibility scans are useful but partial; browser-visible proof should still assert semantic states directly. Source: https://playwright.dev/docs/next/accessibility-testing
- Playwright visual comparisons: screenshots are environment-sensitive, so this suite records matrix coverage and uses existing deterministic root attributes instead of adding brittle new baselines. Source: https://playwright.dev/docs/next/test-snapshots
- DoHS and Service Search: provider lookup should preserve ODS-code search, service-code filtering, and source-freshness evidence. Source: https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services/guide-to-search-identifiers-and-service-codes
- ODS ORD: ODS codes are unique organisation identifiers and UAT supports integration testing, so directory drift tests keep ODS identity explicit. Source: https://digital.nhs.uk/developer/api-catalogue/organisation-data-service-ord
- GP Connect Update Record: Update Record is a community-pharmacy structured update sent through GP Connect messaging, MESH, and ITK3. Source: https://digital.nhs.uk/developer/api-catalogue/gp-connect-update-record
- GP Connect data items: Pharmacy First Update Record evidence may include consultation information, medications, presenting complaint, observations, and free-text entries, so outcome proof distinguishes observation from completion. Source: https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/transparency-notice/appendix-2
- MESH API: MESH is the official secure transfer API surface for large files and messages across health and care organisations. Source: https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api
- MESH service behavior: sender upload, recipient acknowledgement, delivery-status tracking, and non-delivery reporting shaped dispatch proof and timeout cases. Source: https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh
- MESH workflow IDs: workflow group direction and initiator or responder semantics shaped the dispatch and outcome transport-matrix wording. Source: https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids

## Rejected

- No official reference was allowed to soften the blueprint rule that dispatch acceptance is not outcome truth.
- No external source was used to claim live sandbox, mailbox, GP Connect, or pharmacy onboarding approval.
- No browser-testing recommendation was used to replace backend reconciliation tests where only backend state can prove the truth chain.
