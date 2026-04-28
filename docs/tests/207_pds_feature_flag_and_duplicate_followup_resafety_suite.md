# 207 PDS Feature-Flag And Duplicate Follow-Up Re-Safety Suite

Task: `seq_207`

Visual mode: `Enrichment_Resafety_Lab`

Mock-now posture: live provider calls are intentionally `not_applicable`; this suite proves the repository-owned PDS adapter seam and phone follow-up re-safety controls with deterministic fixtures, service tests, and Playwright coverage.

## Scope

This suite binds two late-stage safety boundaries:

- PDS enrichment is optional evidence. The feature flag, environment, tenant, onboarding, legal basis, endpoint, route, and circuit gates decide whether the adapter may be attempted. Canonical request handling always proceeds through local matching when PDS is disabled or degraded.
- Phone follow-up evidence is frozen, deduplicated, classified, and either reuses an existing lineage or extends it through material-delta and re-safety records. Duplicate evidence must not create a second receipt or stale calm status.

## Evidence Artifacts

| Artifact                                                      | Purpose                                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `docs/tests/207_pds_enrichment_boundary_matrix.md`            | Human-readable PDS feature flag and enrichment boundary matrix.                               |
| `docs/tests/207_duplicate_followup_and_resafety_matrix.md`    | Human-readable duplicate follow-up and late evidence re-safety matrix.                        |
| `data/test/207_pds_mode_cases.csv`                            | Machine-checked PDS boundary fixture rows.                                                    |
| `data/test/207_followup_duplicate_cases.csv`                  | Machine-checked duplicate and late follow-up fixture rows.                                    |
| `data/test/207_expected_enrichment_and_resafety_chains.json`  | Expected counters and chain semantics for validator and Playwright.                           |
| `data/test/207_suite_results.json`                            | Mock-now result summary, including targeted command-api service evidence.                     |
| `docs/frontend/207_enrichment_resafety_lab.html`              | Static premium provenance / late-evidence atlas for Playwright and visual review.             |
| `tests/playwright/207_enrichment_resafety_lab.spec.ts`        | Browser coverage for screenshots, ARIA snapshots, keyboard, mobile, zoom, and reduced motion. |
| `tools/test/validate_phase2_enrichment_and_resafety_suite.py` | Repo validator for all 207 artifacts and validation-chain wiring.                             |

## Scenario Families

PDS boundary scenarios are all represented in `data/test/207_pds_mode_cases.csv`:

- Feature flag off.
- Feature flag on with successful enrichment.
- PDS no match.
- Ambiguous match / parse drift requiring fallback.
- Degraded upstream.
- Feature flag toggled while a request is active.
- Feature flag off after a prior enriched case exists.
- Legal-basis or environment guard absent.
- Conflicting contact details.
- Late enrichment after a user changed communication preferences.

Duplicate and late follow-up scenarios are all represented in `data/test/207_followup_duplicate_cases.csv`:

- Exact replay of the same phone follow-up.
- Same audio or attachment retried after provider failure.
- Same underlying facts restated later.
- Later phone follow-up adding material symptoms.
- Later phone follow-up adding material risk factors.
- Later phone follow-up adding only admin metadata.
- Duplicate attachment that must not re-trigger safety.
- Late evidence that must re-trigger safety.
- Late evidence attached to a closed or resolved request.
- Late evidence attached while identity hold is active.

## Service Evidence

Focused command-api service tests passed on `2026-04-15`:

```text
pnpm --filter @vecells/command-api exec vitest run tests/pds-enrichment.integration.test.js tests/phone-followup-resafety.integration.test.js

Test Files  2 passed (2)
Tests       13 passed (13)
```

The PDS file proves disabled mode, guard denial, successful normalized enrichment, timeout fallback, stale cache posture, and queued change signals. The follow-up file proves exact replay collapse, semantic replay reuse, duplicate attachment handling, witness-required same-request attach, degraded evidence fail-closed behavior, material re-safety, and urgent review without stale calm status.

## Visual And Interaction Research

The lab uses a ledger-style provenance layout rather than a settings surface. The design follows:

- Carbon dashboard guidance for scanning dense operational state in structured regions: https://carbondesignsystem.com/data-visualization/dashboards/
- Carbon status-indicator guidance for compact state truth instead of decorative badges: https://carbondesignsystem.com/patterns/status-indicator-pattern/
- GOV.UK summary-list guidance for clear key/value truth rows: https://design-system.service.gov.uk/components/summary-list/
- GOV.UK tabs guidance for scenario switching that remains keyboard operable: https://design-system.service.gov.uk/components/tabs/
- NHS typography guidance for clinical-service readability: https://service-manual.nhs.uk/design-system/styles/typography
- Playwright screenshot guidance: https://playwright.dev/docs/screenshots
- Playwright ARIA snapshot guidance: https://playwright.dev/docs/aria-snapshots
- Playwright reduced-motion emulation guidance: https://playwright.dev/docs/emulation#reduced-motion
- WCAG 2.2 focus appearance guidance: https://www.w3.org/TR/WCAG22/#focus-appearance
- NHS PDS FHIR boundary reference: https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir

## Result Vocabulary

The suite uses the shared status vocabulary:

- `passed`
- `failed`
- `blocked_external`
- `not_applicable`

Live PDS provider evidence remains `not_applicable` in mock-now. No repository-owned defect was found for this boundary; external live-provider validation is blocked until live credentials and approvals exist.
