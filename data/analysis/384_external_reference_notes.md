# 384 External Reference Notes

Reference material checked on 2026-04-27:

- NHS England Digital, NHS App web integration: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration
  - Borrowed the step order: expression of interest, product assessment, Solution Design, Sandpit, AOS, incident rehearsal, SCAL, limited release, full release, monthly data, annual assurance, and change lead time.
  - Rejected prose-only evidence handling; the repository implements these as executable profiles, datasets, telemetry contracts, and SCAL bundle assembly.
- NHS England Digital, NHS App standards for integration: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration
  - Borrowed WCAG 2.2 AA evidence, NHS service standard, DCB0129/DCB0160, GDPR, PECR, and SCAL certification expectations.
- NHS England Digital, SCAL user guide: https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services/user-guide
  - Borrowed the expectation that SCAL is tailored to the service, includes compliance declarations, clinical risk, information governance, technical conformance, and connection agreement evidence.
- NHS App developer documentation, Web Integration Overview: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-overview/
  - Borrowed the webview, custom user-agent, NHS App JS API, and jump-off context for environment profiles and telemetry route events.
- NHS App developer documentation, Web Integration Guidance: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/
  - Borrowed base URL per environment, journey path, asserted login identity risk, site link environment differences, and webview limitation posture.
- NHS England Digital, Patient Care Aggregator design/build/test: https://digital.nhs.uk/services/patient-care-aggregator/additional-further-features-to-your-integration-with-the-patient-care-aggregator/design-build-and-test-your-software
  - Borrowed Sandpit as non-live development/demo and AOS as more production-representative assurance. Rejected PCA-specific details that do not apply to Phase 7 NHS App web integration.

Local blueprint precedence: these sources support the current process posture, but release tuple, route readiness, telemetry minimization, and SCAL bundle behavior are governed by the Phase 7 local blueprint.
