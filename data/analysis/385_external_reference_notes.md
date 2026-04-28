# 385 External Reference Notes

Checked on 2026-04-27.

## NHS App web integration

Source: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration

Borrowed:

- Sandpit work precedes Assurance of Suppliers work.
- Deployment plan defines limited release users and full release users.
- Limited release starts with a small group of users before full release.
- Post go-live requires monthly data, annual assurance, Service Management incident/remediation protocol, and Integration Manager notification for journey changes.
- Minor user-journey changes require about one month; significant changes and additional service journeys require at least three months.

Rejected:

- The page does not define concrete numeric telemetry thresholds. The implementation therefore uses local `ReleaseGuardrailPolicy` thresholds and keeps them auditable.

## Standards for NHS App integration

Source: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration

Borrowed:

- WCAG 2.2 AA remains a minimum standard.
- Clinical safety and data privacy evidence belong in SCAL.

Rejected:

- The page is standards-level guidance, not live rollout logic. It is used as a freeze precondition source, not as an algorithm.

## SCAL process and user guide

Sources:

- https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services
- https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services/user-guide

Borrowed:

- SCAL is document-based assurance with declarations and evidence for technical conformance, clinical safety, information governance/security, and organisational risks.
- Suppliers must update SCAL for significant product changes or changed service requirements.
- Product go-live follows accepted SCAL and connection agreement.

Rejected:

- SCAL workflow is not used as a runtime storage model. Task 384 owns SCAL bundle assembly; this task consumes it as release evidence.

## NHS App developer web integration guidance

Source: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/

Borrowed:

- NHS App traffic can be identified by environment base URL, journey paths, SSO query parameter handling, and NHS App user-agent/query hints.
- File download and browser print limitations inform route freeze and safe-route degradation.

Rejected:

- Raw `assertedLoginIdentity` examples are never stored or surfaced in telemetry. Task 384 quarantines raw JWT/query payloads.

## NHS login partner service management

Source: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/partner-service-management

Borrowed:

- Partners need incident/problem management capability.
- Incidents include access problems and unavailable reliant services.
- Incident records must avoid patient-identifiable data.
- Higher-severity incidents require prompt cooperation and updates.
- Service reporting is monthly and incident rehearsals/early live support are recognised support activities.

Rejected:

- NHS login SLA values are not copied as NHS App channel thresholds. They are treated as support expectations only.
