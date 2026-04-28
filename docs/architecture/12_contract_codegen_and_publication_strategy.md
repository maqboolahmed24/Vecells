# 12 Contract Codegen And Publication Strategy

Generated artifacts are reproducible and versioned, but they are never hand-maintained sources of truth. Every generated set traces back to one canonical contract package plus one generator manifest and digest.

## Codegen Flows

| Contract family | Source package | Generator | Output | Publication artifact | Drift gate |
| --- | --- | --- | --- | --- | --- |
| sync_route_contracts | pkg_api_contracts | tool_codegen | dist/publication/route-specs/*.openapi.json | AudienceSurfaceRouteContract + OpenAPI spec bundle | Every route spec digest must match RuntimePublicationBundle and contract test fixtures. |
| typed_route_clients | pkg_api_contracts | tool_codegen | pkg_gen_api_clients | typed client bundle + generated-manifest.json | Generated API clients fail validation if source route contract digest or publication manifest hash changes without regeneration. |
| live_channel_contracts | pkg_live_channel_contracts | tool_codegen | pkg_gen_live_channel_clients | live update binding bundle + compatibility fixtures | Any live-channel contract without a generated manifest and compatibility fixture fails publication. |
| canonical_event_contracts | pkg_event_contracts | tool_codegen | pkg_gen_event_bindings | event envelope bindings + schema compatibility fixtures | Backward-compatibility failure or missing provenance digest blocks release verification. |
| design_contract_publication | pkg_design_contracts | tool_codegen | pkg_gen_design_contract_bindings | DesignContractPublicationBundle + DesignContractLintVerdict + marker bindings | Blocked lint verdict, stale accessibility coverage, or marker vocabulary drift fails publication and shell write posture. |
| schema_migration_and_fixtures | pkg_migrations | tool_codegen | pkg_gen_migration_fixtures | migration dry-run fixtures + compatibility window manifests | Expand-migrate-contract windows, route compatibility rows, and fixture digests must align or CI fails. |

## Publication Law

- Sync routes publish OpenAPI-style route specs and generated clients from `packages/api-contracts`.
- Live channels publish versioned bindings and compatibility fixtures from `packages/live-channel-contracts`.
- Canonical events publish schema compatibility fixtures from `packages/event-contracts`.
- Design token exports, automation anchors, telemetry vocabulary, and accessibility coverage publish together as one design-contract bundle and lint verdict.
- Migration and fixture generation stay tied to expand-migrate-contract windows and production-like snapshots.
- Any generated output that cannot cite its source contract digest, generator manifest, and publication artifact fails validation.
