# 396 NHS App Sandpit, AOS, And SCAL Runbook

This runbook operationalizes the non-production NHS App path for Sandpit, AOS, demo walkthroughs, and SCAL evidence preparation.

## Inputs

- `data/config/396_nhs_app_environment_profile_manifest.example.json`
- `data/config/396_nhs_app_demo_dataset_manifest.example.json`
- `data/config/396_scal_submission_bundle_manifest.example.json`
- `data/contracts/396_nhs_app_onboarding_contract.json`
- prior Phase 7 outputs from tasks 374, 377, 380, 383, 384, 385, and 386-395

## Procedure

1. Validate Sandpit and AOS profile parity against the promoted release tuple.
2. Confirm both profiles expose only the route inventory in the 396 manifest.
3. Validate demo dataset coverage for start request, request status, booking/manage, and pharmacy.
4. Reset demo datasets using deterministic seeds before any rehearsal.
5. Run Playwright dry-run preparation, verify-only readiness, and capture-evidence modes.
6. Index SCAL evidence by requirement, artifact, owner, freshness, and redaction class.
7. Export only redaction-safe artifacts or index-only rows according to `396_redaction_and_artifact_handling_rules.md`.
8. Treat Sandpit/AOS sign-off, SCAL acceptance, incident rehearsal completion, connection agreement, limited release, and full release as external statuses until formal evidence exists.

## Commands

```bash
pnpm validate:396-nhs-app-onboarding-assets
pnpm exec vitest run tests/unit/396_nhs_app_onboarding_assets.spec.ts
pnpm exec vitest run tests/integration/396_nhs_app_onboarding_assets.spec.ts
pnpm exec tsx tools/browser-automation/396_prepare_sandpit_and_aos_environment.spec.ts --run --mode=dry-run
pnpm exec tsx tools/browser-automation/396_verify_demo_environment_readiness.spec.ts --run --mode=verify-only
pnpm exec tsx tools/browser-automation/396_capture_scal_evidence_index.spec.ts --run --mode=capture-evidence
```

## Failure Handling

- Tuple drift blocks onboarding preparation.
- Missing required demo journeys blocks demo walkthroughs.
- Stale SCAL evidence blocks export until refreshed.
- Any sensitive query string, token, identity assertion, or session-bearing artifact blocks raw artifact export.
