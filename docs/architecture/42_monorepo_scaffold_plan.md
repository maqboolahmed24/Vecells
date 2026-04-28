# 42 Monorepo Scaffold Plan

        `seq_042` wires the canonical Phase 0 workspace baseline chosen in task `012`: `pnpm + Nx`.

        ## What landed

        - Root workspace config now exists with `pnpm-workspace.yaml`, `nx.json`, root TypeScript and ESLint config, a deterministic codegen command, and a local bootstrap helper.
        - Canonical workspace graph is scaffolded now rather than deferred: `7` apps, `5` services, `22` packages, and `2` tool/test workspaces.
        - `docs/architecture/42_foundation_shell_gallery.html` makes shell identity, ownership, automation markers, and parity posture visible without external assets.
        - The scaffold manifest records both package-manager workspaces and non-package canonical artifacts so the topology remains explicit.

        ## Workspace table

        | Project | Repo path | Type | Owner | Scripts |
        | --- | --- | --- | --- | --- |
        | `app-clinical-workspace` | `apps/clinical-workspace` | `app` | `triage_workspace` | `dev, build, lint, test, typecheck, preview` |
| `app-governance-console` | `apps/governance-console` | `app` | `governance_admin` | `dev, build, lint, test, typecheck, preview` |
| `app-hub-desk` | `apps/hub-desk` | `app` | `hub_coordination` | `dev, build, lint, test, typecheck, preview` |
| `app-ops-console` | `apps/ops-console` | `app` | `operations` | `dev, build, lint, test, typecheck, preview` |
| `app-patient-web` | `apps/patient-web` | `app` | `patient_experience` | `dev, build, lint, test, typecheck, preview` |
| `app-pharmacy-console` | `apps/pharmacy-console` | `app` | `pharmacy` | `dev, build, lint, test, typecheck, preview` |
| `app-support-workspace` | `apps/support-workspace` | `app` | `support` | `dev, build, lint, test, typecheck, preview` |
| `package-api-contracts` | `packages/api-contracts` | `package` | `shared_contracts` | `build, lint, test, typecheck` |
| `package-authz-policy` | `packages/authz-policy` | `package` | `identity_access` | `build, lint, test, typecheck` |
| `package-design-system` | `packages/design-system` | `package` | `design_system` | `build, lint, test, typecheck` |
| `package-domain-kernel` | `packages/domain-kernel` | `package` | `shared_domain_kernel` | `build, lint, test, typecheck` |
| `package-domains-analytics-assurance` | `packages/domains/analytics_assurance` | `package` | `analytics_assurance` | `build, lint, test, typecheck` |
| `package-domains-audit-compliance` | `packages/domains/audit_compliance` | `package` | `audit_compliance` | `build, lint, test, typecheck` |
| `package-domains-booking` | `packages/domains/booking` | `package` | `booking` | `build, lint, test, typecheck` |
| `package-domains-communications` | `packages/domains/communications` | `package` | `communications` | `build, lint, test, typecheck` |
| `package-domains-governance-admin` | `packages/domains/governance_admin` | `package` | `governance_admin` | `build, lint, test, typecheck` |
| `package-domains-hub-coordination` | `packages/domains/hub_coordination` | `package` | `hub_coordination` | `build, lint, test, typecheck` |
| `package-domains-identity-access` | `packages/domains/identity_access` | `package` | `identity_access` | `build, lint, test, typecheck` |
| `package-domains-intake-safety` | `packages/domains/intake_safety` | `package` | `intake_safety` | `build, lint, test, typecheck` |
| `package-domains-operations` | `packages/domains/operations` | `package` | `operations` | `build, lint, test, typecheck` |
| `package-domains-pharmacy` | `packages/domains/pharmacy` | `package` | `pharmacy` | `build, lint, test, typecheck` |
| `package-domains-release-control` | `packages/domains/release_control` | `package` | `release_control` | `build, lint, test, typecheck` |
| `package-domains-support` | `packages/domains/support` | `package` | `support` | `build, lint, test, typecheck` |
| `package-domains-triage-workspace` | `packages/domains/triage_workspace` | `package` | `triage_workspace` | `build, lint, test, typecheck` |
| `package-event-contracts` | `packages/event-contracts` | `package` | `shared_contracts` | `build, lint, test, typecheck` |
| `package-fhir-mapping` | `packages/fhir-mapping` | `package` | `shared_contracts` | `build, lint, test, typecheck` |
| `package-observability` | `packages/observability` | `package` | `analytics_assurance` | `build, lint, test, typecheck` |
| `package-release-controls` | `packages/release-controls` | `package` | `release_control` | `build, lint, test, typecheck` |
| `package-test-fixtures` | `packages/test-fixtures` | `package` | `test_fixtures` | `build, lint, test, typecheck` |
| `service-adapter-simulators` | `services/adapter-simulators` | `service` | `platform_integration` | `build, lint, test, typecheck, dev` |
| `service-api-gateway` | `services/api-gateway` | `service` | `platform_runtime` | `build, lint, test, typecheck, dev` |
| `service-command-api` | `services/command-api` | `service` | `platform_runtime` | `build, lint, test, typecheck, dev` |
| `service-notification-worker` | `services/notification-worker` | `service` | `platform_integration` | `build, lint, test, typecheck, dev` |
| `service-projection-worker` | `services/projection-worker` | `service` | `platform_runtime` | `build, lint, test, typecheck, dev` |
| `tool-playwright` | `tests/playwright` | `tools-only` | `analysis_validation` | `build, lint, test, typecheck, e2e` |
| `tool-assistive-control-lab` | `tools/assistive-control-lab` | `tools-only` | `assistive_lab` | `build, lint, test, typecheck, dev` |

        ## Canonical artifacts kept outside the pnpm workspace

        | Artifact | Repo path | Type | Owner | Reason |
        | --- | --- | --- | --- | --- |
        | `docs_architecture` | `docs/architecture` | `docs-only` | `analysis_validation` | Existing validated docs and Python control roots stay outside pnpm workspace while remaining canonical. |
| `tool_analysis` | `tools/analysis` | `tools-only` | `analysis_validation` | Existing validated docs and Python control roots stay outside pnpm workspace while remaining canonical. |
| `tool_architecture` | `tools/architecture` | `tools-only` | `analysis_validation` | Existing validated docs and Python control roots stay outside pnpm workspace while remaining canonical. |

        `docs/architecture`, `tools/analysis`, and `tools/architecture` stay outside the package-manager workspace on purpose. They already hold validated generated documents, Python validators, and architecture control payloads. Seq_042 references them from root commands instead of sweeping them into a synthetic JS package.

        ## Legacy directories intentionally excluded from the canonical workspace graph

        - `apps/mock-evidence-gate-lab`
- `apps/mock-im1-pairing-studio`
- `apps/mock-mesh-mailroom`
- `apps/mock-nhs-app-onboarding-studio`
- `apps/mock-nhs-app-site-link-studio`
- `apps/mock-nhs-login`
- `apps/mock-nhs-login-onboarding`
- `apps/mock-notification-studio`
- `apps/mock-pds-access-studio`
- `apps/mock-telephony-lab`
- `services/mock-artifact-scan-gateway`
- `services/mock-mesh`
- `services/mock-notification-rail`
- `services/mock-pds-fhir`
- `services/mock-telephony-carrier`
- `services/mock-transcription-engine`

        These existing mock apps and mock services remain in the repository but are not absorbed into the canonical monorepo graph. The scaffold manifest records them as legacy exclusions so task `041` stays authoritative.

        ## Shell placeholder rules implemented now

        - Each app imports the shared design system package and uses a unique root `data-testid` marker from day one.
        - Each shell has a visibly different composition while staying inside the shared canvas, token, and motion law.
        - Every visual section has adjacent parity text or table rows so accessibility and automation can inspect the same state.
        - No placeholder shell claims live domain truth it does not own.
