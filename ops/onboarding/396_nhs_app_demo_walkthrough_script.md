# 396 NHS App Demo Walkthrough Script

Use this script for internal rehearsal before any Sandpit or AOS demo call. It is not an external sign-off claim.

1. Confirm `pnpm validate:396-nhs-app-onboarding-assets` passes.
2. Run `pnpm exec tsx tools/browser-automation/396_prepare_sandpit_and_aos_environment.spec.ts --run --mode=dry-run`.
3. Run `pnpm exec tsx tools/browser-automation/396_verify_demo_environment_readiness.spec.ts --run --mode=verify-only`.
4. Confirm the demo reset plan is deterministic for Sandpit and AOS.
5. Walk through start request, request status, booking/manage, and pharmacy using the synthetic scenarios in `data/config/396_nhs_app_demo_dataset_manifest.example.json`.
6. Check that visible route state, manifest tuple, and route inventory all match the promoted tuple.
7. Capture only redaction-safe evidence with `pnpm exec tsx tools/browser-automation/396_capture_scal_evidence_index.spec.ts --run --mode=capture-evidence`.
8. Review `output/playwright/396_scal_evidence_index_report.json` before including any artifact in a SCAL-supporting bundle.

Stop the rehearsal if tuple parity, demo coverage, reset determinism, or redaction checks fail.
