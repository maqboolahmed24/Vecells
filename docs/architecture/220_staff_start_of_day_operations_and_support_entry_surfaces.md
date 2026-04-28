# 220 Staff Start-of-Day Operations and Support Entry Surfaces

Task: `par_220_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_staff_start_of_day_operations_and_support_entry_surfaces`

Visual mode: `Staff_Entry_Quiet_Control`  
Style system: `Quiet_Internal_Control`

## Mission

Build one quiet entry shell for:

- `/workspace`
- `/workspace/queue/:queueKey`
- `/ops/overview`
- `/ops/support`
- `/ops/support/inbox/:viewKey`

The surface is intentionally not a metric wall. It starts from one dominant next-safe action, one interrupt digest, one support-first launch path, and explicit same-shell continuity. This follows:

- `prompt/220.md`
- `prompt/shared_operating_contract_220_to_227.md`
- `blueprint/staff-operations-and-support-blueprint.md#Staff start-of-day model`
- `blueprint/staff-operations-and-support-blueprint.md#Staff landing requirements`
- `blueprint/staff-operations-and-support-blueprint.md#Suggested support objects`
- `blueprint/operations-console-frontend-blueprint.md#Canonical overview composition`
- `blueprint/operations-console-frontend-blueprint.md#NorthStarBand`
- `blueprint/operations-console-frontend-blueprint.md#BottleneckRadar`
- `blueprint/operations-console-frontend-blueprint.md#Shell continuity`

## Consumed Outputs

The entry shell consumes prior outputs rather than re-deriving its own truth:

- `seq_209_crosscutting_open_patient_account_and_support_surface_tracks_gate`
- `par_210_crosscutting_track_backend_build_patient_spotlight_decision_projection_and_quiet_home_logic`
- `par_211_crosscutting_track_backend_build_request_browsing_detail_and_typed_patient_action_routing_projections`
- `par_218_crosscutting_track_backend_build_support_lineage_binding_ticket_projection_and_subject_history_queries`
- `par_219_crosscutting_track_backend_build_controlled_resend_delivery_repair_and_support_replay_foundations`

The shell intentionally stops at entry and governed launch posture. Deeper ticket semantics, masking panels, and read-only ticket-side playbooks stay deferred to `par_221` and `par_222`.

## Route Model

### `/workspace`

- Contract: `SupportEntryRouteContract` with `continuityKey = staff.workspace.queue`
- Dominant surface: `RecommendedQueueCard`
- Supporting surfaces:
  - `InterruptDigestStack`
  - `PinnedWorkResumeCard`
  - `CrossDomainTaskStrip`
- Law: one dominant next-safe action always remains visible unless dependency truth blocks launch

### `/workspace/queue/:queueKey`

- Contract: `SupportEntryRouteContract` with `continuityKey = staff.workspace.queue`
- Dominant surface: selected queue continuity plus same recommended queue law
- Supporting surfaces:
  - `QueueSummaryList`
  - `InterruptDigestStack`
  - `PinnedWorkResumeCard`
- Law: queue switching morphs inside one shell and preserves continuity metadata

### `/ops/overview`

- Contract: `SupportEntryRouteContract` with `continuityKey = ops.overview.control`
- Dominant surfaces:
  - `OpsNorthStarRibbon`
  - `BottleneckRadarLite`
- Supporting surfaces:
  - `SupportDeskEntryPanel`
  - `CrossDomainTaskStrip`
- Law: calm posture stays sparse; healthy states do not expand into decorative density

### `/ops/support`

- Contract: `SupportEntryRouteContract` with `continuityKey = support.workspace.tickets`
- Dominant surface: `SupportDeskEntryPanel`
- Supporting surfaces:
  - `InterruptDigestStack`
  - `OpsNorthStarRibbon`
- Law: support entry is ticket-oriented and launch-oriented without pretending the 221 ticket shell is already here

### `/ops/support/inbox/:viewKey`

- Contract: `SupportEntryRouteContract` with `continuityKey = support.workspace.tickets`
- Dominant surfaces:
  - `SupportInboxViewSwitcher`
  - `SupportInboxProjection`
- Supporting surfaces:
  - `BlockingDependencyBanner`
  - route continuity ledger
- Law: inbox views switch inside the same support shell; deeper ticket destinations remain governed placeholders

## Projection Inventory

The route layer publishes and consumes these named projections so validators and later tasks can bind to typed names instead of prose:

- `WorkspaceHomeProjection`
- `StaffInboxProjection`
- `PersonalWorklistProjection`
- `TeamQueueSummaryProjection`
- `InterruptionDigestProjection`
- `ApprovalInboxProjection`
- `CallbackWorklistProjection`
- `EscalationInboxProjection`
- `ChangedSinceSeenProjection`
- `CrossDomainTaskSummaryProjection`
- `DependencyDigestProjection`
- `PharmacyConsoleSummaryProjection`
- `SupportDeskHomeProjection`
- `SupportInboxProjection`
- `SupportEntryRouteContract`

## Reusable Primitives

This task contributes the reusable primitives required by the prompt:

- `StaffEntryShell`
- `RecommendedQueueCard`
- `InterruptDigestStack`
- `PinnedWorkResumeCard`
- `OpsNorthStarRibbon`
- `BottleneckRadarLite`
- `SupportDeskEntryPanel`
- `SupportInboxViewSwitcher`
- `BlockingDependencyBanner`
- `CrossDomainTaskStrip`

These primitives deliberately keep the deeper ticket workspace out of scope. The launch affordances route into the future support shell family without inventing `SupportTicketWorkspaceProjection` controls prematurely.

## Continuity Rules

Shared shell continuity is explicit in the DOM, contract JSON, and Playwright checks:

- `data-shell-family="staff_entry_same_shell"`
- `data-continuity-key`
- `data-selected-anchor-policy`
- `data-route-path`
- `data-read-only-posture`
- `data-motion-mode`

Continuity expectations:

1. Workspace home and queue routes preserve `staff.workspace.queue`.
2. Support home and inbox preserve `support.workspace.tickets`.
3. `/ops/overview` stays its own continuity key but still shares the same shell family and same-shell launch contract.
4. Scenario switches never fork a different shell. They only rewrite `state=` query posture.
5. Blocking or degraded states preserve place and swap only action eligibility, never the shell.

## State and Degradation Model

The entry shell supports four explicit route-wide postures:

- `quiet`
- `busy`
- `blocking`
- `degraded`

Operational consequences:

- `quiet`: sparse overview, single dominant queue, compact interrupt digest
- `busy`: higher queue pressure, changed-since-seen emphasis, more support launch pressure
- `blocking`: dependency banner freezes launches and makes chronology hold explicit
- `degraded`: actions move to guarded or read-only posture while last stable context stays visible

This follows the same-shell degradation law from `prompt/shared_operating_contract_220_to_227.md`: preserve place, preserve chronology clues, and make fallback posture honest.

## Accessibility and Interaction

The surface is keyboard-first and zoom-safe:

- skip link before the masthead
- route navigation uses `aria-current`
- support inbox view switcher uses `role="tablist"`
- support table keeps explicit headers and launch buttons
- counts always include text labels, never color alone
- focus rings stay visible on all interactive controls
- reduced-motion mode is reflected in DOM state and CSS

Playwright proves:

- desktop, tablet, and mobile screenshots
- keyboard traversal and same-shell launches
- ARIA snapshots for `/workspace`, `/ops/overview`, and `/ops/support`
- reduced-motion parity
- degraded and blocking states

## Design Research

The visual system is not copied from any one vendor. It borrows proven interaction ideas from three reference groups and adapts them to the repo’s staff/support rules.

### 1. Regulated service layouts

- NHS digital service manual: [Design and accessibility guidance](https://service-manual.nhs.uk/accessibility/design)
- NHS digital service manual: [Focus state styles](https://service-manual.nhs.uk/design-system/styles/focus-state)
- GOV.UK Design System: [Service navigation](https://design-system.service.gov.uk/components/service-navigation/)
- GOV.UK Design System: [Navigate a service](https://design-system.service.gov.uk/patterns/navigate-a-service/)
- GOV.UK Design System: [Complete multiple tasks](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)

Applied here:

- strong, consistent service-level navigation
- obvious focus treatment and keyboard progression
- task-first labeling instead of decorative dashboard framing
- minimal top-level choices

### 2. Persistent-shell quiet control surfaces

- Atlassian Design: [Navigation system](https://atlassian.design/components/navigation-system)
- Atlassian Design: [Lozenge](https://atlassian.design/components/lozenge/)
- Atlassian Design: [Badge usage](https://atlassian.design/components/badge/badge/usage)

Applied here:

- one stable shell family with route-local switches
- lightweight status chips instead of noisy severity banners everywhere
- compact numeric posture tiles with readable labels

### 3. Unified omnichannel support workspaces

- Zendesk help: [About the Zendesk Agent Workspace](https://support.zendesk.com/hc/en-us/articles/360024218473)
- Zendesk help: [Agent Workspace for messaging](https://support.zendesk.com/hc/en-us/articles/4408821905434-Agent-Workspace-for-messaging)
- Zendesk help: [Migrating to the Zendesk Agent Workspace](https://support.zendesk.com/hc/en-us/articles/4583448479514-Migrating-to-the-Zendesk-Agent-Workspace)

Applied here:

- one inbox-centric support entry
- unified status and omnichannel context before launch
- support launch without cross-console context loss

Inference from those sources: the strongest shared trait is not visual chrome, but a stable shell with compact, high-trust state labels and a controlled way to widen context only when needed.

## Assumptions

- `par_221` will own the deeper `/ops/support/tickets/:supportTicketId` workspace.
- `par_222` will own masking/read-only contextual panels inside the ticket shell.
- Support launch targets are allowed to remain governed placeholders as long as the entry shell does not fake deeper authority.
- Route state may be represented in query params for deterministic browser proof, but never in local browser persistence.

## Delivered Artifacts

- [apps/clinical-workspace/src/staff-entry-surfaces.tsx](/Users/test/Code/V/apps/clinical-workspace/src/staff-entry-surfaces.tsx)
- [apps/clinical-workspace/src/staff-entry-surfaces.css](/Users/test/Code/V/apps/clinical-workspace/src/staff-entry-surfaces.css)
- [docs/frontend/220_staff_entry_atlas.html](/Users/test/Code/V/docs/frontend/220_staff_entry_atlas.html)
- [docs/frontend/220_staff_entry_visual_grammar.html](/Users/test/Code/V/docs/frontend/220_staff_entry_visual_grammar.html)
- [docs/frontend/220_staff_entry_route_continuity_map.mmd](/Users/test/Code/V/docs/frontend/220_staff_entry_route_continuity_map.mmd)
- [data/contracts/220_staff_entry_surface_contract.json](/Users/test/Code/V/data/contracts/220_staff_entry_surface_contract.json)
- [data/analysis/220_staff_entry_layout_matrix.csv](/Users/test/Code/V/data/analysis/220_staff_entry_layout_matrix.csv)
- [data/analysis/220_staff_entry_state_and_interrupt_cases.json](/Users/test/Code/V/data/analysis/220_staff_entry_state_and_interrupt_cases.json)
- [tools/analysis/validate_staff_entry_surfaces.py](/Users/test/Code/V/tools/analysis/validate_staff_entry_surfaces.py)
- [tests/playwright/220_staff_start_of_day_operations_and_support_entry_surfaces.spec.js](/Users/test/Code/V/tests/playwright/220_staff_start_of_day_operations_and_support_entry_surfaces.spec.js)
