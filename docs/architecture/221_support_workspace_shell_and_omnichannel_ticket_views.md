# 221 Support Workspace Shell and Omnichannel Ticket Views

Task: `par_221_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_support_workspace_shell_and_omnichannel_ticket_views`

Visual mode: `Support_Ticket_Omnichannel_Shell`

## Mission

Build the core support workspace shell for:

- `/ops/support/tickets/:supportTicketId`
- `/ops/support/tickets/:supportTicketId/conversation`
- `/ops/support/tickets/:supportTicketId/actions/:actionKey`

This is the main support product surface. It is not a detached set of read-only pages and it is not a clone of the 220 entry surface. The product posture is one quiet, premium, chronology-first casework shell that keeps the active ticket, active lineage, active anchor, and active action boundary visible together.

## Source Trace

Primary local sources used:

- `prompt/221.md`
- `prompt/shared_operating_contract_220_to_227.md`
- `blueprint/staff-operations-and-support-blueprint.md#SupportTicketWorkspaceProjection`
- `blueprint/staff-operations-and-support-blueprint.md#SupportOmnichannelTimelineProjection`
- `blueprint/staff-operations-and-support-blueprint.md#SupportReachabilityPostureProjection`
- `blueprint/staff-operations-and-support-blueprint.md#SupportActionLease`
- `blueprint/staff-operations-and-support-blueprint.md#SupportActionSettlement`
- `blueprint/staff-operations-and-support-blueprint.md#SupportContinuityEvidenceProjection`
- `blueprint/staff-operations-and-support-blueprint.md#SupportSurfaceRuntimeBinding`
- `blueprint/staff-operations-and-support-blueprint.md#Support workspace contract`
- `blueprint/staff-operations-and-support-blueprint.md#Support responsive and narrow-screen contract`
- `data/contracts/218_support_lineage_ticket_subject_history_contract.json`
- `data/contracts/219_support_repair_and_replay_contract.json`
- `services/command-api/src/support-lineage-ticket-subject-history.ts`
- `services/command-api/src/support-repair-and-replay.ts`

## Architectural Decision

221 is implemented inside the same clinical SPA host that 220 uses. That is deliberate.

Reason:

1. 220 already owns `/ops/support` and `/ops/support/inbox/:viewKey`.
2. Those entry routes already launch to `/ops/support/tickets/:supportTicketId`.
3. Keeping 221 inside the same routed app means that moving from inbox entry to active ticket work now stays in one real browser shell, not just one conceptual route family.

The app root now switches between:

- `StaffEntrySurfaceApp` for 220 routes
- `SupportWorkspaceApp` for 221 routes

Both expose the same shell family metadata and both react to the same route-change event, so same-host transitions no longer fall back to `/workspace`.

## Product Anatomy

### Left contextual rail

Desktop uses the expanded `248px` contextual rail variant described in the prompt. It contains:

- return to inbox
- route switch between ticket, conversation, and action child state
- timeline anchor navigation
- scenario switcher for calm, active, provisional, degraded, and blocked browser proof

### Center chronology plane

The center plane owns:

1. `SupportTicketHeader`
2. `TicketLineageStrip`
3. `SupportSegmentTabs`
4. `OmnichannelTimeline`
5. `ContinuityStubBar`

The timeline stays chronology-first. Channel labels are secondary. Causality, status, and next-action meaning are primary.

### Right action plane

The right plane is `392px`, sticky on desktop, and contains:

- `ActionWorkbenchDock`
- `Subject360SummaryPanel`

It never turns into an empty disabled form wall. In degraded or blocked states it collapses to bounded, honest preview posture.

## Core Projection Mapping

The UI binds directly to the same named support objects already defined by 218 and 219:

- `SupportTicketWorkspaceProjection`
- `SupportOmnichannelTimelineProjection`
- `SupportActionWorkbenchProjection`
- `SupportReachabilityPostureProjection`
- `SupportActionLease`
- `SupportActionSettlement`
- `SupportContinuityEvidenceProjection`
- `SupportSurfaceRuntimeBinding`

The frontend fixture model mirrors those names so 222 can extend the same shell rather than replace it.

## Route Behavior

### `/ops/support/tickets/:supportTicketId`

- base ticket shell
- header, lineage strip, timeline, and continuity stub visible
- action dock shows the default bounded action for the active lease

### `/ops/support/tickets/:supportTicketId/conversation`

- same shell family and same continuity key
- same timeline anchor preserved through route change
- conversation posture emphasized without splitting timeline away from the action dock

### `/ops/support/tickets/:supportTicketId/actions/:actionKey`

- same shell family and same continuity key
- one bounded action at a time in the dock
- child route placeholder copy stays lawful and route-aware

## Chronology Rules

The timeline unifies:

- secure message
- email failure evidence
- callback promise
- controlled resend preview
- support settlement

The shell intentionally does not split these into per-channel widgets. That follows the local rule that chronology beats channel siloing.

Each row communicates:

- actor
- time
- state: authoritative, provisional, or blocked
- masking level
- next-action implication

## Action Workbench Rules

The workbench stays bounded:

- one active action key
- one concise preview region
- one concise confirmation/settlement region
- one sticky CTA

The dock reads from `SupportActionLease`, `SupportActionSettlement`, and `SupportReachabilityPostureProjection`, so action authority, settlement hint, and delivery posture cannot drift apart visually.

## Continuity

The shell publishes explicit DOM continuity markers:

- `data-shell-family="staff_entry_same_shell"`
- `data-continuity-key="support.workspace.tickets"`
- `data-selected-anchor`
- `data-selected-anchor-policy`
- `data-route-key`
- `data-route-path`
- `data-motion-mode`

Anchor retention is URL-based through `anchor=`. Scenario proof is URL-based through `state=`.

That gives deterministic refresh and browser-proof behavior without storing ticket truth in local browser persistence.

## State Model

221 publishes five ticket workspace proof states:

- `calm`
- `active`
- `provisional`
- `degraded`
- `blocked`

They map to the shell this way:

- `calm`: live shell, trusted continuity, authoritative timeline emphasis
- `active`: live shell, action dock dominant, repair or channel-change flow staged
- `provisional`: timeline highlights preview and provisional settlement
- `degraded`: runtime binding falls to recovery-only; dock becomes read-only preview
- `blocked`: continuity or runtime drift blocks mutating posture but preserves the ticket anchor

## Accessibility

Implemented and Playwright-checked:

- heading hierarchy across header, timeline, and dock
- keyboard traversal for tabs, anchor buttons, and action affordances
- route tabs with tab semantics
- explicit labels for channel, status, and masked state
- reduced-motion mode
- no color-only meaning for row state

## Design Research

The shell structure is informed by a small set of official references and translated into the Vecells support rules rather than copied visually.

### Zendesk

- [About the Zendesk Agent Workspace](https://support.zendesk.com/hc/en-us/articles/4408821259930-About-the-Zendesk-Agent-Workspace)

Structural ideas reused:

- one ticket interface across channels
- channel change without a dashboard/context swap
- agent-first ticket anatomy around the active issue

### Intercom

- [Take calls from the Inbox](https://www.intercom.com/help/en/articles/8488917-take-calls-from-the-inbox)
- [Assign conversations to teammates and teams](https://www.intercom.com/help/en/articles/6561699-assign-conversations-to-teammates-and-teams-in-the-next-gen-inbox)
- [Side conversations](https://www.intercom.com/help/en/articles/8398956-side-conversations)

Structural ideas reused:

- active conversation work should retain call and teammate context in one shell
- ownership and assignment belong in persistent chrome, not buried metadata
- secondary collaboration stays attached to the current ticket rather than opening a second tool

### Atlassian

- [Navigation system](https://atlassian.design/components/navigation-system)
- [Lozenge](https://atlassian.design/components/lozenge/)

Structural ideas reused:

- compact contextual rail rather than stacked dashboard cards
- restrained state chips
- stable shell chrome with dense but readable operational information

Inference from those sources: the useful shared pattern is a stable shell with a strong primary work plane and a bounded secondary plane, not a proliferation of equal-priority widgets.

## Reusable Primitives

221 contributes:

- `SupportWorkspaceShell`
- `SupportTicketHeader`
- `TicketLineageStrip`
- `OmnichannelTimeline`
- `TimelineEventCard`
- `Subject360SummaryPanel`
- `ActionWorkbenchDock`
- `TimelineAnchorNavigator`
- `ContinuityStubBar`
- `GovernedChildRoutePlaceholder`

These are designed so 222 can slot masking, read-only fallback, knowledge, and observe/replay states into the same anatomy.

## Artifacts

- [apps/clinical-workspace/src/support-workspace-shell.tsx](/Users/test/Code/V/apps/clinical-workspace/src/support-workspace-shell.tsx)
- [apps/clinical-workspace/src/support-workspace-shell.css](/Users/test/Code/V/apps/clinical-workspace/src/support-workspace-shell.css)
- [docs/frontend/221_support_workspace_shell_atlas.html](/Users/test/Code/V/docs/frontend/221_support_workspace_shell_atlas.html)
- [docs/frontend/221_support_workspace_visual_grammar.html](/Users/test/Code/V/docs/frontend/221_support_workspace_visual_grammar.html)
- [docs/frontend/221_support_workspace_route_anatomy_map.mmd](/Users/test/Code/V/docs/frontend/221_support_workspace_route_anatomy_map.mmd)
- [data/contracts/221_support_workspace_ui_contract.json](/Users/test/Code/V/data/contracts/221_support_workspace_ui_contract.json)
- [data/analysis/221_support_timeline_and_action_states.json](/Users/test/Code/V/data/analysis/221_support_timeline_and_action_states.json)
- [data/analysis/221_support_workspace_responsive_layout_matrix.csv](/Users/test/Code/V/data/analysis/221_support_workspace_responsive_layout_matrix.csv)
- [tools/analysis/validate_support_workspace_ui.py](/Users/test/Code/V/tools/analysis/validate_support_workspace_ui.py)
- [tests/playwright/221_support_workspace_shell_and_omnichannel_ticket_views.spec.js](/Users/test/Code/V/tests/playwright/221_support_workspace_shell_and_omnichannel_ticket_views.spec.js)
