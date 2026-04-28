# 119 Governance Shell Seed Routes

`par_119` seeds the first real `shellType = governance` audience surface in `apps/governance-console`.

## Outcome

- establishes one governed shell family over `/ops/governance/*`, `/ops/access/*`, `/ops/config/*`, `/ops/comms/*`, and `/ops/release`
- keeps `ScopeRibbon`, the shared status strip, one same-shell continuity frame, and one promoted support region visible through every seeded route
- proves calm but explicit writable, read-only, blocked, and recovery-only governance posture without collapsing into generic CRUD admin pages

## Seed route family

- `/ops/governance`
- `/ops/governance/tenants`
- `/ops/governance/authority-links`
- `/ops/governance/compliance`
- `/ops/governance/records`
- `/ops/access`
- `/ops/access/users`
- `/ops/access/roles`
- `/ops/access/reviews`
- `/ops/config`
- `/ops/config/bundles`
- `/ops/config/promotions`
- `/ops/comms`
- `/ops/comms/templates`
- `/ops/release`

## Shell law

The seed keeps one `GovernanceShellConsistencyProjection` and one `governance.review` continuity key active across the whole route family.

- `ScopeRibbon` is persistent and carries tenant, organisation, environment, purpose-of-use, current review object, freeze posture, and write state.
- `GovernanceFreezeDisposition` is the only authority for writable versus review-only versus blocked versus recovery-only posture.
- `GovernanceReturnIntentToken` is minted when a diff surface promotes into an approval-heavy route such as `/ops/access/reviews`, `/ops/config/promotions`, or `/ops/release`.
- selected-anchor replacement from `governance-diff` to `governance-approval` requires acknowledgement before the promoted review becomes dominant

## Surface set

- governance foyer: release tuple, urgent review queue, compliance drift, and safe-next-step copy
- `TenantConfigMatrix`: inherited, live, and draft values shown together with guardrail burden
- `AuthorityMap`: overlap, orphan-risk, and delegation retirement preview
- `EffectiveAccessPreview` and `RoleScopeStudio`: operational language over raw permission strings
- `ChangeEnvelope`: config and comms diff views that keep baseline and impact context attached
- `ApprovalStepper`: ordered approval burden with no-self-approval and watch-tuple gating
- `ComplianceLedgerPanel`: summary-first evidence bundle and continuity proof posture
- `ReleaseFreezeTupleCard`: publication, compatibility, blast radius, and watch posture in one lane

## Distinctive design choices

- “Quiet Governance Studio” visual identity with a monoline scope-band/lock-step insignia
- sticky header stack limited to `ScopeRibbon` plus shared status strip
- restrained graphite and neutral palette with analytical spacing instead of stat-card dashboards
- only one promoted support region at once: `impact`, `approval`, `evidence`, `release`, or `access`

## Gap records

- `GAP_FUTURE_GOVERNANCE_DEPTH_*` for later deeper legal, export, or workflow depth
- `GAP_SCOPE_TOKEN_DETAIL_*` when Phase 0 scope tuples must remain read-only instead of inventing authority
- `GAP_APPROVAL_TUPLE_DETAIL_*` when approval or watch tuple members remain intentionally bounded in the seed

## Traceability

- shell runtime: `apps/governance-console/src/governance-shell-seed.model.ts`
- UI document: `apps/governance-console/src/governance-shell-seed.tsx`
- route seed contract: `data/analysis/governance_route_contract_seed.csv`
- mock examples: `data/analysis/governance_mock_projection_examples.json`
- route topology: `docs/architecture/119_governance_shell_route_map.mmd`
