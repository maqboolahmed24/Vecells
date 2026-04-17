# 41 Repository Topology Rules

## Mission

Freeze the Vecells repo topology before scaffolding begins so `042-045` can implement one authoritative layout instead of re-deciding shell ownership, package homes, or import law.

## Summary

- Visual mode: `Topology_Atlas`
- App count: `7`
- Service count: `5`
- Package count: `22`
- Special workspace count: `5`
- Active topology defect count: `2`
- Route family coverage: `20`
- Shell family coverage: `8`
- Gateway surface coverage: `22`

## Freeze Decisions

- Baseline apps are frozen at `patient-web`, `clinical-workspace`, `hub-desk`, `pharmacy-console`, `support-workspace`, `ops-console`, and `governance-console`.
- `support`, `pharmacy`, and `governance` are first-class shell families in the baseline topology, not later add-ons and not subpanels of `ops-console`.
- `rf_patient_embedded_channel` remains part of `apps/patient-web`; embedded delivery is a patient-shell channel profile, not a separate app family.
- Standalone assistive work is represented as conditional reserved tools-only namespace `tools/assistive-control-lab`; live assistive work remains inside `apps/clinical-workspace`.
- Shared code is legal only in explicit shared packages; there is no generic shared util escape hatch.
- No app owns truth. Apps render projections, preserve continuity, and call published contracts only.

## Artifact Register

| Repo path | Type | Owner | Status | Shells | Route families | Defect state |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/patient-web` | `app` | `patient_experience` | `baseline_required` | `patient` | `rf_intake_self_service, rf_intake_telephony_capture, rf_patient_secure_link_recovery, rf_patient_home, rf_patient_requests, rf_patient_appointments, rf_patient_health_record, rf_patient_messages, rf_patient_embedded_channel` | `watch` |
| `apps/clinical-workspace` | `app` | `triage_workspace` | `baseline_required` | `staff` | `rf_staff_workspace, rf_staff_workspace_child` | `resolved` |
| `apps/hub-desk` | `app` | `hub_coordination` | `baseline_required` | `hub` | `rf_hub_queue, rf_hub_case_management` | `resolved` |
| `apps/pharmacy-console` | `app` | `pharmacy` | `baseline_required` | `pharmacy` | `rf_pharmacy_console` | `resolved` |
| `apps/support-workspace` | `app` | `support` | `baseline_required` | `support` | `rf_support_ticket_workspace, rf_support_replay_observe` | `resolved` |
| `apps/ops-console` | `app` | `operations` | `baseline_required` | `operations` | `rf_operations_board, rf_operations_drilldown` | `resolved` |
| `apps/governance-console` | `app` | `governance_admin` | `baseline_required` | `governance` | `rf_governance_shell` | `resolved` |
| `services/api-gateway` | `service` | `platform_runtime` | `baseline_required` | `none` | `none` | `clean` |
| `services/command-api` | `service` | `platform_runtime` | `baseline_required` | `none` | `none` | `clean` |
| `services/projection-worker` | `service` | `platform_runtime` | `baseline_required` | `none` | `none` | `clean` |
| `services/notification-worker` | `service` | `platform_integration` | `baseline_required` | `none` | `none` | `clean` |
| `services/adapter-simulators` | `service` | `platform_integration` | `baseline_required` | `none` | `none` | `clean` |
| `packages/domain-kernel` | `package` | `shared_domain_kernel` | `baseline_required` | `none` | `none` | `resolved` |
| `packages/event-contracts` | `package` | `shared_contracts` | `baseline_required` | `none` | `none` | `resolved` |
| `packages/api-contracts` | `package` | `shared_contracts` | `baseline_required` | `none` | `none` | `resolved` |
| `packages/fhir-mapping` | `package` | `shared_contracts` | `baseline_required` | `none` | `none` | `resolved` |
| `packages/design-system` | `package` | `design_system` | `baseline_required` | `none` | `none` | `resolved` |
| `packages/authz-policy` | `package` | `identity_access` | `baseline_required` | `none` | `none` | `resolved` |
| `packages/test-fixtures` | `package` | `test_fixtures` | `baseline_required` | `none` | `none` | `resolved` |
| `packages/observability` | `package` | `analytics_assurance` | `baseline_required` | `none` | `none` | `resolved` |
| `packages/release-controls` | `package` | `release_control` | `baseline_required` | `none` | `none` | `resolved` |
| `packages/domains/intake_safety` | `package` | `intake_safety` | `baseline_required` | `none` | `none` | `clean` |
| `packages/domains/identity_access` | `package` | `identity_access` | `baseline_required` | `none` | `none` | `clean` |
| `packages/domains/triage_workspace` | `package` | `triage_workspace` | `baseline_required` | `none` | `none` | `clean` |
| `packages/domains/booking` | `package` | `booking` | `baseline_required` | `none` | `none` | `clean` |
| `packages/domains/hub_coordination` | `package` | `hub_coordination` | `baseline_required` | `none` | `none` | `clean` |
| `packages/domains/pharmacy` | `package` | `pharmacy` | `baseline_required` | `none` | `none` | `resolved` |
| `packages/domains/communications` | `package` | `communications` | `baseline_required` | `none` | `none` | `clean` |
| `packages/domains/support` | `package` | `support` | `baseline_required` | `none` | `none` | `resolved` |
| `packages/domains/operations` | `package` | `operations` | `baseline_required` | `none` | `none` | `clean` |
| `packages/domains/governance_admin` | `package` | `governance_admin` | `baseline_required` | `none` | `none` | `resolved` |
| `packages/domains/analytics_assurance` | `package` | `analytics_assurance` | `baseline_required` | `none` | `none` | `clean` |
| `packages/domains/audit_compliance` | `package` | `audit_compliance` | `baseline_required` | `none` | `none` | `clean` |
| `packages/domains/release_control` | `package` | `release_control` | `baseline_required` | `none` | `none` | `clean` |
| `docs/architecture` | `docs-only` | `analysis_validation` | `baseline_required` | `none` | `none` | `clean` |
| `tools/analysis` | `tools-only` | `analysis_validation` | `baseline_required` | `none` | `none` | `clean` |
| `tools/architecture` | `tools-only` | `analysis_validation` | `baseline_required` | `none` | `none` | `clean` |
| `tests/playwright` | `tools-only` | `analysis_validation` | `baseline_required` | `none` | `none` | `clean` |
| `tools/assistive-control-lab` | `tools-only` | `assistive_lab` | `conditional_reserved` | `assistive` | `rf_assistive_control_shell` | `watch` |

## Defect Register

| Defect id | State | Severity | Title |
| --- | --- | --- | --- |
| `DEFECT_041_LATER_SHELLS_OMITTED_FROM_STARTER_SHAPE` | `resolved` | `high` | Support, pharmacy, and governance shell families were omitted from the starter shape |
| `DEFECT_041_SHARED_UTIL_LOOPHOLE` | `resolved` | `high` | A generic shared-utils escape hatch would have allowed cross-context truth drift |
| `DEFECT_041_APP_OWNS_TRUTH_AMBIGUITY` | `resolved` | `high` | App shell ownership could have been confused with write-model ownership |
| `DEFECT_041_DERIVED_PATIENT_ENTRY_ROUTES` | `watch` | `medium` | Patient intake and secure-link entry route families are still inventory labels rather than final URL contracts |
| `DEFECT_041_STANDALONE_ASSISTIVE_REMAINS_CONDITIONAL` | `watch` | `medium` | Standalone assistive work remains conditional until later prompts publish concrete routes and live-control fences |

## Source Precedence

- `prompt/041.md`
- `prompt/042.md`
- `prompt/043.md`
- `prompt/044.md`
- `blueprint/phase-0-the-foundation-protocol.md`
- `blueprint/platform-frontend-blueprint.md`
- `blueprint/platform-runtime-and-release-blueprint.md`
- `data/analysis/shell_ownership_map.json`
- `data/analysis/route_family_inventory.csv`
- `data/analysis/gateway_surface_matrix.csv`
