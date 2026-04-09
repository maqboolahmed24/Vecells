# 12 Import Boundary And Codeowners Policy

Package ownership and boundary law are now machine-checkable. The repo no longer relies on naming conventions or reviewer memory to stop shells, adapters, or admin code from becoming hidden truth owners.

## Import Boundary Rules

| Rule | Description | Applies from | Forbidden targets |
| --- | --- | --- | --- |
| RULE_ONE_OWNER_DOMAIN | Every package, app, service, tool, infra path, and generated package resolves to exactly one owner domain and one package-tag class. | app_shell; service_gateway; service_runtime; domain_context; contract_package; design_contract_package; platform_shared_package; generated_contract_package; tooling_package; delivery_control_artifact |  |
| RULE_APP_SHELL_CONSUMES_PUBLISHED_CONTRACTS_ONLY | Apps may import only shared contracts, design contracts, generated client bindings, and platform shared publication packages. | app_shell | domain_context; service_gateway; service_runtime; tooling_package; delivery_control_artifact |
| RULE_GATEWAY_USES_CONTRACTS_NOT_DOMAIN_INTERNALS | Gateway code publishes routes from contract packages and runtime publication bindings, never by importing domain internals. | service_gateway | domain_context; app_shell |
| RULE_RUNTIME_SERVICES_COMPOSE_PUBLISHED_DOMAINS_ONLY | Runtime services may compose multiple domain packages, but only through their published entrypoints and shared contracts. | service_runtime | app_shell |
| RULE_DOMAIN_CONTEXTS_DO_NOT_IMPORT_SIBLING_DOMAIN_INTERNALS | A domain package may depend on the shared kernel and published contracts, but not on sibling domain packages. | domain_context | domain_context; app_shell |
| RULE_CONTRACT_PACKAGES_DEFINE_PUBLISHED_TRUTH | Contract packages are the canonical source for route, live-channel, and event publication inputs; apps and ad hoc DTO files may not replace them. | contract_package | app_shell; service_runtime |
| RULE_RUNTIME_PUBLICATION_BINDS_ROUTE_EVENT_DESIGN_AND_RELEASE_TRUTH | Runtime publication binds route, event, design-contract, topology, and release-control digests into one bundle; no consumer may restitch them independently. | platform_shared_package |  |
| RULE_FHIR_MAPPING_IS_DERIVED_ONLY | FHIR mapping code may consume domain packages, but it remains a one-way derived representation boundary and never canonical truth. | platform_shared_package | app_shell |
| RULE_GENERATED_ARTIFACTS_TRACE_TO_SOURCE_CONTRACTS | Generated artifacts live only in packages/generated or dist/publication and must carry source contract digests and generator manifests. | generated_contract_package; tooling_package | app_shell; service_runtime; service_gateway |
| RULE_GENERATED_PACKAGES_ARE_DERIVATIVE_ONLY | Generated packages never import or own consumer shells or services; they are reviewed outputs, not upstream truth owners. | generated_contract_package | app_shell; service_gateway; service_runtime |
| RULE_DESIGN_AND_ACCESSIBILITY_ARE_FIRST_CLASS | Design-system, design-contract, and accessibility-contract packages are first-class workspace citizens and may not be relegated to docs or test snapshots. | design_contract_package |  |
| RULE_TOOLING_LANGUAGES_ARE_BOUNDED_AND_NON_AUTHORITATIVE | Python is allowed only in tools/analysis and tools/validators; it may inspect, validate, and synthesize but never own canonical runtime truth. | tooling_package |  |
| RULE_ONE_COMMAND_LOCAL_STARTUP | The workspace must support one-command local startup, preview boot, CI builds, contract tests, and Playwright runs from the same graph. | tooling_package; delivery_control_artifact |  |
| RULE_RELEASE_AND_RECOVERY_EVIDENCE_STAY_BOUND | Infra definitions, runbooks, and operational artifacts must stay bound to release controls and runtime publication tuples rather than drifting into detached documentation. | delivery_control_artifact |  |
| RULE_NO_REMOTE_ASSETS_OR_SOURCE_SECRETS | No remote CDN assets, fonts, or browser scripts are allowed in baseline outputs, and secrets may not appear in committed source or generated artifacts. | app_shell; service_gateway; service_runtime; contract_package; design_contract_package; platform_shared_package; generated_contract_package; tooling_package; delivery_control_artifact |  |

## Owner Domains

| Owner domain | Review handle | Atlas color |
| --- | --- | --- |
| Patient Experience | @vecells/patient-experience | #145d7a |
| Clinical Workspace | @vecells/clinical-workspace | #2f6a4f |
| Booking And Network | @vecells/booking-network | #866a16 |
| Pharmacy | @vecells/pharmacy | #7b4d2e |
| Support Operations | @vecells/support-operations | #85527d |
| Operations Control | @vecells/operations-control | #566474 |
| Governance And Assurance | @vecells/governance-assurance | #9c4638 |
| Platform Runtime | @vecells/platform-runtime | #385f94 |
| Design System | @vecells/design-system | #27686d |
| Release And Developer Experience | @vecells/release-devex | #574980 |

## CODEOWNERS Baseline

- Every `apps/*`, `services/*`, `packages/*`, `tools/*`, `infra/*`, and `ops/*` path maps to exactly one owner domain.
- CODEOWNERS is generated from `codeowners_matrix.csv`; manual drift is treated as configuration debt and must fail validation.
- Public entrypoints are limited by package export maps so cross-context code cannot deep import `/src/*`, `/internal/*`, `/workers/*`, or `/repositories/*` paths.
