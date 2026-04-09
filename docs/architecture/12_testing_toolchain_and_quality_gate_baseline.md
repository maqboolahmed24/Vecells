# 12 Testing Toolchain And Quality Gate Baseline

The workspace now binds unit, contract, accessibility, Playwright, migration, and supply-chain checks into one graph-aware quality ladder. Route, event, design, and release tuples are verified by publication-aware tests rather than by convention.

## Test Matrix

| Coverage kind | Toolchain | Primary targets | Contract aware | Blocking gate |
| --- | --- | --- | --- | --- |
| workspace graph and boundary lint | Nx graph checks + boundary lint + export-map enforcement | all packages, apps, and services | yes | yes |
| unit tests | Vitest or equivalent fast TS runner | apps, services, domain packages, shared packages | partial | yes |
| sync route contract tests | generated route contract harness | svc_api_gateway, svc_command_api, pkg_api_contracts, pkg_gen_api_clients | yes | yes |
| event schema compatibility tests | event compatibility validator + generated event fixtures | pkg_event_contracts, pkg_gen_event_bindings, service_runtime | yes | yes |
| component and accessibility smoke | component test runner + DOM/accessibility assertions | app_shell, pkg_design_system, pkg_design_contracts, pkg_accessibility_contracts | yes | yes |
| shell-level end-to-end | Playwright | all baseline shells, preview environments, runtime publication markers | yes | yes |
| schema migration dry-run | migration runner + generated fixtures | pkg_migrations, pkg_gen_migration_fixtures, service_runtime | yes | yes |
| SBOM, provenance, and signed-artifact verification | release verification pipeline | all buildable apps and services | yes | yes |

## Gate Order

1. Boundary and ownership checks.
2. Typecheck and unit suites for affected projects.
3. Route and event contract compatibility suites.
4. Component and accessibility smoke on affected shells and design packages.
5. Playwright shell verification on previewable surfaces.
6. Migration dry-run rehearsal and supply-chain verification before release widening.
