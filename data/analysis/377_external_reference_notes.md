# 377 External Reference Notes

Recorded: 2026-04-27

## Official References Reviewed

- NHS App developer web integration guidance: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/
- NHS App web integration process: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration
- Standards for NHS App integration: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration

## Borrowed Into 377

- Base URLs and journey paths are integration inputs, so the service exposes environment base URL and route inventory as manifest-owned data.
- Jump-off URLs can carry NHS App-specific context and must be resolved from explicit paths, so `JumpOffMapping` resolution is deterministic by placement, cohort, ODS rule, environment, and release tuple.
- The same URLs may serve browser and NHS App traffic, so the manifest service exposes channel truth for downstream context resolution rather than relying on frontend URL heuristics.
- NHS App web integration moves through product assessment, Sandpit, AOS, SCAL, limited release, full release, and post-live obligations, so onboarding and evidence refs are part of the service response.
- Standards and accessibility obligations stay as release and evidence refs; this task does not claim external approval.

## Rejected Or Deferred Claims

- Rejected: environment config hand-edits may add or remove patient-visible routes. Exposure must flow from immutable manifest versions and explicit environment pins.
- Rejected: route code existing in the product makes it NHS App eligible. Routes not in the manifest return `not_in_manifest`.
- Rejected: cohort or ODS differences may be resolved by operator convention. The resolver returns `cohort_blocked`, `environment_mismatch`, or `ods_rule_blocked`.
- Rejected: missing continuity or compatibility prerequisites can be hidden behind normal route copy. The service surfaces `pending_continuity_validation`.
- Deferred: live NHS App team approval, SCAL sign-off, connection agreement, limited release, and full release. The seed remains local deterministic contract evidence only.

## Local Source Of Truth

The local blueprint and frozen outputs from `372`, `373`, and `374` remain authoritative. Official references sharpen terminology and onboarding posture only.
