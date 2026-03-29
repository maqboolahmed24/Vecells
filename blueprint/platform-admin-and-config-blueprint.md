# Platform admin and config blueprint

## Purpose

Define a complete, versioned, and auditable platform administration surface for configuration, communications governance, and access administration.

This document is the admin surface for the canonical configuration, visibility, grant, duplicate, reservation, safety, and promotion rules defined in `phase-0-the-foundation-protocol.md`. Admin tooling may configure those rules, but it may not bypass the compiled-bundle gate or create local exceptions outside the canonical model.

The end-to-end shell, route, and screen architecture for these surfaces is defined in `governance-admin-console-frontend-blueprint.md`. This file remains the domain and control-plane contract that shell must honor.

## Governance shell linkage

The Governance and Admin Shell should own these route families:

- `/ops/governance/*`
- `/ops/access/*`
- `/ops/config/*`
- `/ops/comms/*`
- `/ops/release/*`

Deep links into `/ops/audit`, `/ops/assurance`, `/ops/incidents`, and `/ops/resilience` may open evidence drawers or side stages, but they should not sever the active `ChangeEnvelope`, approval review, or tenant continuity context when the user is still working the same governance object.

## Config center contract

`/ops/config` should be expanded into subviews for:

- routing rules
- tenant configuration matrix
- inheritance and override trace
- SLA and ETA policy
- opening hours and service windows
- provider and directory overrides
- waitlist policies
- callback policies
- pharmacy policy overrides
- feature-flag policy
- bundle comparison by tenant and environment
- simulation and compile readiness
- promotion history
- config diff and approvals

## Communication governance contract

Suggested route family:

- `/ops/comms`

Suggested objects:

- `MessageTemplateVersion`
- `TemplateSet`
- `ReusableCopyBlock`
- `ChannelPolicy`
- `QuietHoursPolicy`
- `FallbackRuleSet`
- `PreviewMatrix`
- `TemplateApprovalRecord`

Core capabilities:

- browse templates and versions
- preview by channel and journey state
- approve and promote template changes
- inspect suppression and fallback rules
- track live template state by tenant

## Access administration contract

Suggested route family:

- `/ops/access`

Suggested objects:

- `UserMembershipRecord`
- `RoleAssignmentRecord`
- `ActingContextApprovalRecord`
- `BreakGlassEligibilityRecord`
- `ScopedElevationRequest`
- `EffectivePermissionPreview`
- `AccessReviewDecision`
- `PermissionChangeAuditRecord`

Core capabilities:

- invite or deactivate user
- assign role and scope
- manage organisation membership
- approve acting context
- review break-glass eligibility
- preview effective permissions before commit
- run periodic access reviews and exceptional-access decisions
- inspect permission change history

## Authority-link governance contract

Suggested route family:

- `/ops/governance/authority-links`

Suggested objects:

- `AuthorityLinkRecord`
- `AuthorityDelegationPolicy`
- `DirectoryCoverageRecord`
- `LinkConflictRecord`
- `LinkApprovalRecord`

Core capabilities:

- inspect source and target organisation relationships
- compare current and proposed precedence
- stage `effectiveFrom` and `effectiveTo` changes
- surface impacted grants, memberships, queues, and directory views before approval
- revoke or supersede a link without orphaning dependent grants

## Change control rules

All admin changes should require:

- config versioning
- approval workflow where required
- actor attribution
- reason code
- impact preview
- preflight simulation where required
- rollback path
- immutable audit record

## Release governance contract

Suggested route family:

- `/ops/release`

Suggested objects:

- `ReleaseCandidate`
- `BuildProvenanceRecord`
- `SchemaMigrationPlan`
- `ProjectionBackfillPlan`
- `DeploymentWave`
- `RollbackDecisionRecord`
- `ReleaseGateEvidence`

Core capabilities:

- inspect artifact digests, SBOM references, and provenance state
- bind an approved `CompiledPolicyBundle` hash to a specific release candidate
- approve migration and projection-backfill plans per environment
- pause, widen, rollback, or kill-switch a live deployment wave
- inspect environment drift, release history, and rollback evidence

## Compiled policy bundle contract

Before any production promotion, compile routing rules, SLA or ETA policy, identity and grant policy, duplicate policy, provider overrides, waitlist and booking policy, hub coordination policy, callback and messaging policy, pharmacy rule packs, communications policy, access policy, visibility policy, provider capability matrices, and tenant overrides into a single `CompiledPolicyBundle`.

Suggested object:

- `CompiledPolicyBundle`

Required fields:

- `bundleId`
- `tenantId`
- `policyPackRefs`
- `configVersionRefs`
- `compiledHash`
- `compatibilityState`
- `simulationEvidenceRef`
- `approvedBy`
- `approvedAt`

## Production promotion gate

The compiler must reject any bundle that:

- permits PHI exposure through a public or superseded grant
- permits automatic patient binding below the required assurance level
- permits automatic duplicate merge without same-episode proof
- permits closure with any active lease, pending preemption, or unresolved reconciliation
- permits exclusive slot language without a real `held` reservation
- permits pharmacy auto-close from weakly correlated evidence
- permits callback, message, hub, booking, or pharmacy paths to bypass the universal re-safety rule
- permits a projection to include fields outside the audience-tier visibility policy

The promotion gate must also reject any release that lacks a signed build provenance record, an approved schema migration plan, a verified projection backfill plan for the target environment, or successful canary evidence for the target wave.

Promotion is allowed only after compile success, reference-case simulation, immutable audit of the approved bundle hash, signed build provenance, approved migration and backfill plans, and successful canary evidence for the target wave.

## Dependency and standards hygiene

Admin surfaces should expose:

- standards version map
- dependency lifecycle state
- legacy reference findings
- policy compatibility warnings

No production promotion should bypass declared config and standards checks.
