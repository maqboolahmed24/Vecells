# 41 Package Boundary Rules

## Boundary Law

Package and import boundaries are now frozen ahead of scaffolding:

- Apps consume published contracts, design tokens, telemetry vocabulary, and release posture only.
- Runtime services may compose domains only through public package entrypoints and shared contracts.
- Domain packages may not import sibling domain internals.
- Shared code exists only in explicit package families.
- Tooling may read manifests and docs but may not become runtime truth.

## Rule Set

| Rule id | Scope | From | To | Verdict | Description |
| --- | --- | --- | --- | --- | --- |
| `RULE_041_ONE_OWNER_PER_PATH` | `ownership` | `*` | `artifact.repo_path` | `required` | Closes the starter-shape ambiguity by making path ownership machine-checkable before scaffold work begins. |
| `RULE_041_ONE_OWNER_PER_ROUTE_FAMILY` | `shell_ownership` | `route_family_id` | `artifact.repo_path` | `required` | Closes route-family ownership drift before apps are scaffolded. |
| `RULE_041_ONE_OWNER_PER_SHELL_FAMILY` | `shell_ownership` | `shell_type` | `artifact.repo_path` | `required` | Closes the omission of support, pharmacy, governance, and assistive shell representation in the starter shape. |
| `RULE_041_APPS_CONSUME_PUBLISHED_PACKAGES_ONLY` | `imports` | `apps/*` | `packages/api-contracts|packages/design-system|packages/observability|packages/release-controls` | `allow` | No app may import domain package internals, private services, or raw representation mappers. |
| `RULE_041_NO_APP_OWNS_TRUTH` | `ownership` | `apps/*` | `packages/domains/*` | `deny` | Closes the app-owns-truth gap by explicitly reserving write-model ownership to packages and services. |
| `RULE_041_SHARED_CODE_LIVES_ONLY_IN_EXPLICIT_SHARED_PACKAGES` | `imports` | `*` | `packages/domain-kernel|packages/event-contracts|packages/api-contracts|packages/design-system|packages/authz-policy|packages/test-fixtures|packages/observability|packages/release-controls|packages/fhir-mapping` | `required` | Closes the shared-util loophole by freezing the only legal shared namespaces. |
| `RULE_041_GATEWAY_CONSUMES_API_AND_POLICY_CONTRACTS_ONLY` | `imports` | `services/api-gateway` | `packages/api-contracts|packages/authz-policy|packages/observability|packages/release-controls` | `allow` | Prevents the gateway from reaching into domain internals or becoming a hidden truth owner. |
| `RULE_041_COMMAND_API_WRITES_VIA_PUBLISHED_DOMAIN_ENTRYPOINTS` | `imports` | `services/command-api` | `packages/domains/*|packages/domain-kernel|packages/event-contracts|packages/api-contracts|packages/authz-policy|packages/observability|packages/release-controls` | `allow` | Freezes the authoritative mutation seam before feature logic lands. |
| `RULE_041_PROJECTION_WORKER_IS_DERIVED_ONLY` | `imports` | `services/projection-worker` | `packages/domains/*|packages/domain-kernel|packages/event-contracts|packages/api-contracts|packages/fhir-mapping|packages/observability|packages/release-controls` | `allow` | Prevents projection freshness, FHIR mapping, or stale-read posture from becoming hidden write authority. |
| `RULE_041_NOTIFICATION_WORKER_SETTLES_EFFECTS_NOT_DOMAIN_TRUTH` | `imports` | `services/notification-worker` | `packages/domains/communications|packages/domains/identity_access|packages/domains/support|packages/event-contracts|packages/api-contracts|packages/authz-policy|packages/observability|packages/release-controls` | `allow` | Prevents the worker from becoming a convenience vendor wrapper that silently settles business truth. |
| `RULE_041_ADAPTER_SIMULATORS_ARE_NON_AUTHORITATIVE` | `imports` | `services/adapter-simulators` | `packages/api-contracts|packages/event-contracts|packages/fhir-mapping|packages/test-fixtures|packages/observability` | `allow` | Ensures local labs cannot replace live-provider proof or mutate domain truth directly. |
| `RULE_041_DOMAIN_PACKAGES_DO_NOT_IMPORT_SIBLING_DOMAIN_INTERNALS` | `imports` | `packages/domains/*` | `packages/domain-kernel|packages/event-contracts|packages/authz-policy|packages/observability` | `allow` | Sibling domain internals remain forbidden; cross-context seams publish through contracts instead. |
| `RULE_041_CONTRACT_PACKAGES_DEFINE_PUBLISHED_TRUTH` | `publication` | `packages/event-contracts|packages/api-contracts` | `apps/*|services/*|packages/domains/*` | `required` | No ad hoc DTO folder or route-local type may supersede published contracts. |
| `RULE_041_RELEASE_CONTROLS_BIND_RUNTIME_PUBLICATION` | `publication` | `packages/release-controls` | `apps/*|services/*|packages/observability` | `required` | No consumer may restitch route, event, design, and release truth independently. |
| `RULE_041_FHIR_MAPPING_IS_DERIVED_ONLY` | `representation` | `packages/fhir-mapping` | `packages/domains/*` | `allow` | Derived mapping may never write or own canonical lifecycle truth. |
| `RULE_041_DESIGN_AND_ACCESSIBILITY_ARE_FIRST_CLASS` | `design_contract` | `apps/*` | `packages/design-system` | `required` | Closes the placeholder-shell drift where shells look identical or ship without stable markers. |
| `RULE_041_TOOLING_IS_BOUNDED_AND_NON_AUTHORITATIVE` | `tooling` | `tools/*|tests/playwright|docs/architecture` | `data/analysis/*.json|docs/architecture/*.md|tools/analysis|tools/architecture` | `allow` | Scripts, browser tests, and architecture docs may not become hidden runtime truth owners. |
| `RULE_041_PLAYWRIGHT_EXISTS_FROM_DAY_ONE` | `verification` | `tests/playwright` | `docs/architecture/41_repo_topology_atlas.html` | `required` | Freezes Playwright as a baseline deliverable instead of a late smoke-test afterthought. |
| `RULE_041_CONDITIONAL_ASSISTIVE_STANDALONE_STAYS_TOOLS_ONLY` | `conditional_surface` | `tools/assistive-control-lab` | `packages/api-contracts|packages/release-controls|packages/observability|tests/playwright` | `allow` | Prevents a future assistive shell from silently widening into live-care ownership before later prompts publish concrete route contracts. |

## Context Boundary Contracts

| Contract id | From owners | To owners | Transport | Notes |
| --- | --- | --- | --- | --- |
| `CBC_041_SHELLS_TO_API_CONTRACTS` | `patient_experience, triage_workspace, hub_coordination, pharmacy, support, operations, governance_admin` | `shared_contracts` | `published_contract_package` | This seam carries typed browser/runtime contracts, never canonical domain objects. |
| `CBC_041_SHELLS_TO_DESIGN_SYSTEM` | `patient_experience, triage_workspace, hub_coordination, pharmacy, support, operations, governance_admin` | `design_system` | `design_contract_package` | Keeps placeholder shells visually distinct while preserving one product family and one marker graph. |
| `CBC_041_SHELLS_TO_RELEASE_CONTROLS` | `patient_experience, triage_workspace, hub_coordination, pharmacy, support, operations, governance_admin` | `release_control` | `runtime_publication_bundle` | Binds route, release, parity, and recovery truth into one publication seam. |
| `CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS` | `platform_runtime` | `shared_contracts, release_control` | `gateway_contract_publication` | The gateway stays contract-first and release-aware instead of calling domain internals directly. |
| `CBC_041_API_GATEWAY_TO_IDENTITY_POLICY` | `platform_runtime` | `identity_access` | `policy_contract` | This keeps the browser edge fenced by declared policy tuples instead of route-local shortcuts. |
| `CBC_041_COMMAND_API_TO_DOMAIN_PUBLIC_ENTRYPOINTS` | `platform_runtime` | `intake_safety, identity_access, triage_workspace, booking, hub_coordination, pharmacy, communications, support, operations, governance_admin, analytics_assurance, audit_compliance, release_control` | `published_domain_entrypoint` | Cross-context writes remain explicit and reviewable instead of spreading across apps or sibling services. |
| `CBC_041_COMMAND_API_TO_EVENT_CONTRACTS` | `platform_runtime` | `shared_contracts` | `event_publication` | Keeps mutation, settlement, and projection replay aligned to one published event catalogue. |
| `CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS` | `platform_runtime` | `intake_safety, identity_access, triage_workspace, booking, hub_coordination, pharmacy, communications, support, operations, governance_admin, analytics_assurance, audit_compliance, release_control` | `projection_rebuild` | All read models stay downstream of immutable events and published contracts. |
| `CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING` | `platform_runtime` | `shared_contracts` | `derived_representation` | This seam is explicit so partner exchange scaffolds cannot bypass the canonical event spine later. |
| `CBC_041_NOTIFICATION_WORKER_TO_COMMUNICATIONS_SUPPORT_IDENTITY` | `platform_integration` | `communications, support, identity_access, release_control` | `effect_settlement` | Ties notification scaffolding back to the manual checkpoint and retry law from seq_039 and seq_040. |
| `CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES` | `platform_integration` | `shared_contracts, test_fixtures, analytics_assurance` | `local_simulator_contract` | Closes the mock-now vs live-later drift by giving simulators an explicit contract-only seam. |
| `CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_KERNEL` | `intake_safety, identity_access, triage_workspace, booking, hub_coordination, pharmacy, communications, support, operations, governance_admin, analytics_assurance, audit_compliance, release_control` | `shared_domain_kernel` | `shared_kernel` | This seam is the only legal shared primitive path across domain packages. |
| `CBC_041_DOMAIN_PACKAGES_TO_EVENT_CONTRACTS` | `intake_safety, identity_access, triage_workspace, booking, hub_coordination, pharmacy, communications, support, operations, governance_admin, analytics_assurance, audit_compliance, release_control` | `shared_contracts` | `event_contract` | Creates one machine-readable seam for every cross-context event handoff. |
| `CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY` | `intake_safety, identity_access, triage_workspace, booking, hub_coordination, pharmacy, communications, support, operations, governance_admin, analytics_assurance, audit_compliance, release_control` | `identity_access, analytics_assurance` | `policy_and_telemetry` | Explicitly blocks the informal shared-utils path for policy helpers or telemetry wrappers. |
| `CBC_041_RELEASE_CONTROL_TO_OBSERVABILITY` | `release_control` | `analytics_assurance` | `watch_tuple_parity` | Binds publication parity to watch tuples and assurance evidence before later release scaffolding lands. |
| `CBC_041_TOOLING_TO_MANIFESTS_AND_DOCS` | `analysis_validation` | `analysis_validation, shared_contracts, release_control` | `machine_readable_manifest` | Keeps validation and browser coverage first-class without widening tooling into business logic. |
| `CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS` | `assistive_lab` | `shared_contracts, release_control, analytics_assurance` | `conditional_assistive_surface` | Makes the assistive shell decision explicit without prematurely scaffolding a baseline app. |

## Package Freeze

- Shared packages: `domain-kernel`, `event-contracts`, `api-contracts`, `fhir-mapping`, `design-system`, `authz-policy`, `test-fixtures`, `observability`, `release-controls`
- Domain package namespace: `packages/domains/<context-code>`
- Frozen context codes: `intake_safety, identity_access, triage_workspace, booking, hub_coordination, pharmacy, communications, support, operations, governance_admin, analytics_assurance, audit_compliance, release_control`
- Tools-only reserved namespace for conditional assistive work: `tools/assistive-control-lab`

## Why This Exists

The repo now has one machine-readable answer for:

- where a shell lives
- where a domain lives
- where shared truth is legal
- which seams are allowed
- which imports are forbidden
- how later tasks must scaffold without reopening topology debates
