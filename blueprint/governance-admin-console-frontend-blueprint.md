# Governance/Admin console frontend blueprint

## Purpose

Define the complete front-end contract for the Governance and Admin Shell that controls tenant configuration, authority links, access policy, communications governance, compliance evidence, and release promotion.

This shell translates the platform's RBAC plus ABAC model, compiled policy bundle gate, immutable audit spine, and assurance evidence model into calm, high-control operational surfaces. It may configure the canonical rules from `phase-0-the-foundation-protocol.md`, `platform-admin-and-config-blueprint.md`, and `phase-9-the-assurance-ledger.md`, but it may not bypass them.

This specialization governs the shell, route, screen, diff, simulation, evidence, and approval behavior for governance-heavy routes. It complements rather than replaces the live Operations Console in `operations-console-frontend-blueprint.md`; control-room diagnosis stays in the operations shell, while governed mutation and approval work belongs here.

## Governance operating law

The governance shell should make scope, impact, and approval state explicit before any consequential change.

Every high-impact flow should follow the same visible shape:

1. select scope
2. inspect live state, inheritance path, and current evidence
3. open or continue a draft `ChangeEnvelope`
4. review the human-readable diff plus affected tenants, users, routes, and controls
5. run simulation, compile, and policy-invariant checks
6. collect the required approvals
7. promote with an explicit `effectiveAt` boundary
8. monitor post-promotion evidence and rollback readiness

The operating rules are:

- explicit scope before action
- draft before live
- diff before save
- simulate before promote
- evidence before approval
- immutable audit after commit
- no hidden inheritance
- no graph-only admin surfaces without a list or table fallback
- no production mutation without a visible rollback or compensating-change path
- one dominant risk question and one dominant action per screen

## Shell and route topology

The Governance and Admin Shell should own these route families:

- `/ops/governance`
- `/ops/governance/tenants`
- `/ops/governance/tenants/:tenantId`
- `/ops/governance/authority-links`
- `/ops/governance/compliance`
- `/ops/access`
- `/ops/access/users`
- `/ops/access/roles`
- `/ops/access/reviews`
- `/ops/access/elevation`
- `/ops/config`
- `/ops/config/tenants`
- `/ops/config/bundles`
- `/ops/config/promotions`
- `/ops/comms`
- `/ops/comms/templates`
- `/ops/comms/policies`
- `/ops/release`

Cross-shell launches into `/ops/audit`, `/ops/assurance`, `/ops/incidents`, and `/ops/resilience` may open evidence drawers, read-only side stages, or linked detail tabs, but they must not discard the active governance continuity key when the user is still working the same draft, approval, promotion, tenant, or access-review object.

## Primary governance personas

The shell must support at least these personas:

- `platform_root_admin`
- `tenant_governance_admin`
- `organisation_authority_admin`
- `access_reviewer`
- `compliance_officer`
- `release_manager`
- `security_responder`

Role presentation should never begin with raw scope strings or policy IDs alone. The first visible layer must translate access into operational language such as who can act, on what tenant or organisation, against which data audience, under what purpose-of-use, for how long, and with what approval burden.

## Governance-specific interaction primitives

### 1. GovernanceShell

Fields:

- `shellId`
- `entityContinuityKey`
- `routeCluster = governance | access | config | comms | release`
- `selectedTenantRef`
- `selectedOrganisationRef`
- `selectedEnvironmentRef`
- `activeDraftRef`
- `activeApprovalRef`
- `activeEvidenceRef`
- `scopeRibbonState`
- `rightRailMode = none | impact | evidence | audit | simulation | approvals`
- `centerPaneMode = overview | matrix | detail | diff | review`
- `liveContextState = live | draft | compare`

Semantics:

- is the durable shell for one governance task, draft, approval, or investigation lineage
- must default to `two_plane`
- may enter `three_plane` only for compare, diff, or approval-heavy work
- must preserve tenant, organisation, environment, and acting-context selections while the user moves between adjacent governance child views
- must never force a full page swap between matrix, diff, evidence, and approval work that belongs to the same continuity key

### 2. ScopeRibbon

Fields:

- `tenantRef`
- `organisationRef`
- `environmentRef`
- `bundleRef`
- `policyPlane = access | routing | visibility | messaging | release | authority_link`
- `actingRoleRef`
- `purposeOfUseRef`
- `elevationState = none | eligible | requested | active | expiring`
- `effectiveAt`
- `dataSensitivitySummary`

Semantics:

- is always visible on governance mutation screens
- must answer six questions without opening another screen: who is acting, under which role, for which tenant or organisation, in which environment, on which policy plane, and whether elevated access is active
- must make draft-versus-live state unmistakable
- must warn when the user is viewing inherited state rather than a local override

### 3. TenantConfigMatrix

Fields:

- `matrixId`
- `tenantRefs[]`
- `environmentRefs[]`
- `policyDomainRefs[]`
- `cellState = inherited | overridden | draft_changed | pending_approval | compile_blocked | promoted`
- `effectiveBundleRefs[]`
- `dependencyWarningRefs[]`
- `simulationState`
- `selectedCellRef`

Semantics:

- is the primary overview for tenant-by-domain configuration
- must default to live state with a clear draft toggle, never the reverse
- must expose inheritance lineage per cell so operators can see whether a value comes from platform default, organisation policy, tenant override, or pending draft
- editing a cell must open a bounded detail stage that keeps the live value and inherited chain visible alongside the proposed change
- matrix coloring may support scanning, but every state must also be text-labelled and keyboard navigable

### 4. AuthorityMap

Fields:

- `authorityMapId`
- `linkRefs[]`
- `sourceOrganisationRef`
- `targetOrganisationRef`
- `linkType = delegation | coverage | support_admin | directory_override | managed_service`
- `policyScopeRefs[]`
- `precedenceOrder`
- `effectiveFrom`
- `effectiveTo`
- `approvalState`
- `conflictRefs[]`
- `dependentGrantRefs[]`

Semantics:

- must render as a sortable list or table first, with an optional graph lens for relationship discovery
- must make source, target, link type, scope, provenance, dates, and approval state visible in one scan line
- must surface overlap, precedence, orphaning, and circular-governance conflicts before save, not after promotion
- unlink or supersede flows must show downstream grants, queues, and visibility rules that would be affected

### 5. RoleScopeStudio

Fields:

- `roleRef`
- `capabilityGroups[]`
- `attributeConstraints[]`
- `visibilityTierRefs[]`
- `tenantScopeRefs[]`
- `organisationScopeRefs[]`
- `purposeOfUseRefs[]`
- `sessionConstraintRefs[]`
- `breakGlassEligibilityState`
- `cloneFromRoleRef`

Semantics:

- is the authoring and review surface for RBAC plus ABAC policy
- must group permissions by operational domain such as intake, booking, messaging, hub, pharmacy, support, and governance rather than presenting one flat scope dump
- must show attribute constraints and visibility tiers beside capability grants so a reviewer can understand the real effective boundary
- cloning or editing a role must always produce a readable diff grouped by domain and risk level

### 6. EffectiveAccessPreview

Fields:

- `subjectRef = user | service_account | group | role`
- `tenantRef`
- `organisationRef`
- `policyPlaneRef`
- `objectTypeRef`
- `purposeOfUseRef`
- `elevationState`
- `decision = allow | deny | conditional`
- `decisionReasonRefs[]`
- `expiringGrantRefs[]`
- `relatedAuditRefs[]`

Semantics:

- must be available on the same screen as any role, grant, or elevation change
- must answer the question "what can this subject do right now and why" without sending the admin to raw audit tables
- denied or conditional access must show the blocking rule, missing attribute, expired grant, or higher-assurance requirement explicitly

### 7. ChangeEnvelope

Fields:

- `changeEnvelopeId`
- `changeType = config | role | grant | authority_link | template | release_gate`
- `scopeRefs[]`
- `reasonCode`
- `riskLevel = low | medium | high | critical`
- `draftState = collecting | validating | awaiting_approval | approved | scheduled | promoted | superseded | cancelled`
- `simulationEvidenceRef`
- `rollbackPlanRef`
- `approverRefs[]`
- `effectiveAt`

Semantics:

- is the canonical unit of admin change
- must keep proposed values, live values, human-readable diff, simulation results, and required approvals together in one object
- must survive route changes inside the same governance continuity key
- must never permit silent live mutation outside its draft and approval path

### 8. ImpactPreview

Fields:

- `impactedTenantCount`
- `impactedOrganisationCount`
- `impactedUserCount`
- `impactedRouteCount`
- `impactedObjectTypeRefs[]`
- `controlRiskRefs[]`
- `breakingChangeRefs[]`
- `safeDefaultFallbackRefs[]`

Semantics:

- must describe impact in operator language, not only JSON or policy syntax
- must foreground breakage, scope widening, visibility widening, approval changes, and user lockout risk
- must provide drill-ins to the exact tenants, roles, users, routes, or templates affected

### 9. ApprovalStepper

Fields:

- `compileState`
- `simulationState`
- `peerReviewState`
- `securityReviewState`
- `complianceReviewState`
- `releaseGateState`
- `promotionState`
- `postPromotionWatchState`

Semantics:

- is the visible state machine for high-risk governance change
- must make missing evidence or incomplete approval lanes obvious before the promote action becomes available
- must allow approvers to inspect the same diff, impact preview, and evidence the editor saw

### 10. ComplianceLedgerPanel

Fields:

- `controlRef`
- `controlFamily`
- `status = satisfied | warning | missing | exception | expired`
- `ownerRef`
- `evidenceAge`
- `artifactRefs[]`
- `exceptionRef`
- `nextReviewAt`

Semantics:

- is the audit-friendly control view for compliance and operational governance
- must support control-by-control inspection without forcing the user into a separate BI workflow
- every warning, missing, or exception state must deep-link to the relevant evidence, change envelope, audit trail, or attestation task

## Navigation model and default layout

The left navigation should group work by governance intent, not by technical subsystem names alone:

- Posture
- Tenants
- Authority links
- Access and elevation
- Communications governance
- Compliance and evidence
- Policy bundles and promotions
- Release governance

The default page composition should be:

- left navigation for route family and saved views
- center pane for the dominant task or matrix
- right rail for impact preview, evidence, simulation, or approvals

The right rail should never start with multiple competing panels expanded. The shell must promote only the single most relevant support region for the active governance task.

## Screen contracts

### Governance landing: `/ops/governance`

This is the control posture page, not a vanity dashboard.

It should show:

- pending approvals by risk tier
- compile or simulation failures blocking promotion
- expiring grants, access reviews, and authority links
- compliance controls with missing or stale evidence
- recent production promotions and rollback watch windows
- tenant drift and environment drift summaries

Critical cards must open directly into the relevant `ChangeEnvelope`, `AuthorityMap`, `RoleScopeStudio`, or `ComplianceLedgerPanel` without losing shell context.

### Tenant configuration matrix: `/ops/governance/tenants` and `/ops/config/tenants`

This is the main screen for tenant-by-domain governance.

Rules:

1. start in live-state view with environment and tenant selectors pinned in `ScopeRibbon`
2. expose matrix rows by policy domain and optional subdomain, not by raw key-value store order
3. keep inherited value, current live value, and proposed draft value visible together when editing
4. require a reason code for any override that narrows or widens visibility, routing, messaging, or release behavior
5. block promotion when simulation or compile checks fail and land the user on the failing cells first

### Authority-link management: `/ops/governance/authority-links`

This is the authoritative UI for cross-organisation delegation and coverage relationships.

Rules:

1. default to the table view with filters for source, target, link type, and state
2. allow an optional graph or map lens for discovery, but never as the only interaction mode
3. creating or editing a link must show precedence, overlap, and orphan-risk checks before save
4. retiring a link must preview dependent grants, memberships, directory paths, and tenant views that would change
5. high-risk link changes must require approval before they become effective

### Access and role studio: `/ops/access`, `/ops/access/users`, and `/ops/access/roles`

This is where security policy becomes administratively understandable.

Rules:

1. express every access change through the grammar of subject, capability, scope, condition, expiry, and evidence
2. group capabilities by operational domain and risk instead of alphabetic permission strings
3. pair role editing with `EffectiveAccessPreview` on the same screen
4. show inherited grants, temporary grants, and break-glass eligibility as separate chips with different expiry semantics
5. deactivation, grant removal, and scope narrowing must preview lockout, orphaned ownership, and approval impacts before commit

### Elevation and access review: `/ops/access/reviews` and `/ops/access/elevation`

This is the exceptional-access surface.

Rules:

1. break-glass, just-in-time elevation, and periodic recertification must be separate workflows with separate evidence burdens
2. every exceptional access request must show reason code, duration, requesting context, affected scope, and prior usage history
3. reviewers must be able to approve, narrow, or deny without leaving the current shell
4. active elevation must remain visible in `ScopeRibbon` until expiry or revocation

### Communications governance: `/ops/comms` and `/ops/comms/templates`

This is the policy-aware communications control room.

Rules:

1. template editing must always show channel, audience, fallback, suppression, and tenant scope together
2. preview must be matrix-based by tenant, channel, journey state, and quiet-hours policy
3. content diff, approval, and promotion should reuse the same `ChangeEnvelope` and `ApprovalStepper` pattern as config changes

### Compliance and evidence: `/ops/governance/compliance`

This is the operational compliance surface for auditors and governance leads.

Rules:

1. controls must render as a list with status, owner, last attestation, evidence age, and exception state
2. evidence drill-ins must open in a side stage or right rail, not in a shell-breaking tab maze
3. pack generation should start from visible controls and evidence links, not a separate export-only workflow
4. exceptions must carry owner, expiry, mitigation, and linked approvals

### Policy bundles and release gate: `/ops/config/bundles`, `/ops/config/promotions`, and `/ops/release`

This is where draft governance becomes live system behavior.

Rules:

1. show compile status, policy diff, simulation evidence, migration plan, and rollout wave on one continuous screen
2. the promote action must remain unavailable until compile, simulation, and required approvals are complete
3. post-promotion watch state must remain attached to the same shell with evidence of drift, failures, or rollback need
4. rollback should be represented as a compensating change or governed wave action, never as a silent hidden button that bypasses audit

## Error-proofing rules

The governance shell must bias toward safe configuration under pressure.

Mandatory safeguards:

- no direct live edit in a matrix cell
- no hidden inherited value that only appears after save
- no destructive unlink, deactivation, or scope widening without an impact preview
- no production promotion without visible environment, tenant, and `effectiveAt` context
- no approval checkbox without access to the same diff, evidence, and simulation seen by the editor
- no exception record without owner, expiry, and mitigation
- no graph or heatmap without a filterable list or table fallback
- no role change without immediate effective-access preview
- no time-bound grant without displayed expiry and renewal posture
- no cross-tenant action without an explicit tenant or platform-level scope badge

## Read and mutation contract

Suggested read projections:

- `GovernanceOverviewProjection`
- `TenantConfigMatrixProjection`
- `AuthorityLinkProjection`
- `RoleCatalogProjection`
- `EffectiveAccessPreviewProjection`
- `ComplianceControlProjection`
- `ChangeEnvelopeProjection`
- `PromotionGateProjection`
- `GovernanceEvidenceProjection`

Suggested mutation contracts:

- `AdminDraftMutationCommand`
- `AuthorityLinkMutationCommand`
- `RoleAssignmentMutationCommand`
- `ScopedElevationDecisionCommand`
- `TemplatePromotionCommand`
- `PolicyBundlePromotionCommand`

The browser should read only from audience-safe governance projections. It must not bind directly to raw transactional stores or raw audit append logs.

## Accessibility and comprehension rules

Governance screens are high-risk productivity surfaces, so accessibility is also a safety property.

Required rules:

- every matrix, graph, and heat map must have a semantic table or list fallback
- scope, risk, and status may not rely on color alone
- sticky headers, side rails, and drawers must preserve keyboard focus order
- diff views must support screen-reader-friendly before and after summaries
- all dangerous actions must use explicit verb labels rather than ambiguous `save` or `apply` text

## Linked documents

This blueprint is intended to be used with:

- `platform-frontend-blueprint.md`
- `platform-admin-and-config-blueprint.md`
- `operations-console-frontend-blueprint.md`
- `phase-0-the-foundation-protocol.md`
- `phase-9-the-assurance-ledger.md`
- `staff-operations-and-support-blueprint.md`
- `platform-runtime-and-release-blueprint.md`
