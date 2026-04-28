# 396 Algorithm Alignment Notes

Task 396 maps the NHS App Sandpit/AOS onboarding package to the Phase 7 release tuple instead of treating onboarding as a detached checklist.

| Artifact | Local object | Binding rule |
| --- | --- | --- |
| `data/config/396_nhs_app_environment_profile_manifest.example.json` | `NHSAppEnvironmentProfile` | Sandpit and AOS must bind the same `manifestVersion`, `configFingerprint`, `releaseApprovalFreezeRef`, `behaviorContractSetRef`, `surfaceSchemaSetRef`, `compatibilityEvidenceRef`, and telemetry contract set. |
| `data/config/396_nhs_app_demo_dataset_manifest.example.json` | `IntegrationDemoDataset` | The demo set must cover start request, request status, booking/manage, and pharmacy, with deterministic reset seeds tied to the manifest tuple. |
| `data/config/396_scal_submission_bundle_manifest.example.json` | `SCALBundle` | Evidence is indexed by requirement, artifact, owner, freshness, redaction class, and export policy before SCAL preparation. |
| `services/command-api/src/phase7-nhs-app-onboarding-service.ts` | Release freeze tuple | Validation fails closed when environment profile fields drift from the promoted tuple from task 374/377 and the telemetry/SCAL substrate from 384/385. |
| `tools/browser-automation/396_*.spec.ts` | `ChannelTelemetryPlan` and browser proof | Playwright runs in dry-run, verify-only, and capture-evidence modes with isolated contexts and redaction-safe trace/screenshot artifacts. |

The implementation consumes the existing 384 `Phase7NHSAppEnvironmentTelemetryAndSCALDeliveryService` for current environment, telemetry, demo, and SCAL truth, then adds 396-specific operational checks: Sandpit/AOS tuple parity, stable demo reset plans, SCAL indexing, and redaction-safe export posture.

No artifact here represents external NHS sign-off. It creates the repeatable package needed to prepare for Sandpit sign-off, AOS repeat, SCAL review, incident rehearsal, and later limited-release control.
