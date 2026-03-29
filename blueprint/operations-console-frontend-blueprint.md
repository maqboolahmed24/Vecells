# Operations console front-end blueprint

## Purpose

This document defines the canonical front-end strategy for the Vecells Operations Console.

It is the source of truth for:

- macro operational oversight
- dynamic resource allocation
- real-time system health monitoring
- continuity-preserving drill-down across `/ops/*`

The console must let an operational leader answer, within seconds:

- what is breaking, slowing, or drifting
- where finite capacity should move next
- which essential functions or dependencies are at risk
- which queue, site, partner, or cohort is absorbing the pressure
- what intervention has the highest safe operational leverage

The console is not a generic BI dashboard. It is a live control surface built on the same continuity, freshness, and projection rules as the rest of the platform.

This specialization governs the shared operations shell, masthead, board composition, live-update pacing, and return-to-board behavior for the live control-room routes under `/ops/*`. It does not replace the domain semantics defined in `phase-9-the-assurance-ledger.md`, and it does not override approval, promotion, or policy-editing rules from `platform-admin-and-config-blueprint.md` or the Governance and Admin Shell contract in `governance-admin-console-frontend-blueprint.md`.

## 1. Operating stance

1. Dense by design, quiet by default.
2. One dominant anomaly, one dominant intervention surface, one preserved board context.
3. Actionability outranks volume.
4. Recommendations may accelerate decisions, but operators remain the allocator of ownership, capacity, and escalation.
5. Every board state must declare freshness, confidence, and scope.
6. Drill-down must preserve filters, horizon, selected anomaly, and return path.
7. Real-time motion must explain change without making the board feel unstable.
8. The console must remain useful during degraded or partially stale states.

## 2. Shell, continuity, and routes

Define `entityContinuityKey = operations + boardScopeRef + timeHorizon + operationalLensGroup`.

`OperationsConsoleShell` extends `PersistentShell` with:

- `opsLens = overview | queues | capacity | dependencies | audit | assurance | incidents | resilience`
- `boardScopeRef`
- `timeHorizon`
- `globalFilterSetRef`
- `selectedAnomalyRef`
- `selectedInterventionRef`
- `selectedHealthNodeRef`
- `investigationDrawerState`
- `interventionWorkbenchState`
- `compareScenarioState`
- `opsReturnTokenRef`
- `pausedDeltaBatchRef`

Rules:

1. `/ops/overview`, `/ops/queues`, `/ops/capacity`, and `/ops/dependencies` should normally reuse one shell when `boardScopeRef` and `timeHorizon` remain stable.
2. Default layout is `two_plane`: anomaly field in the main plane and `InterventionWorkbench` in the secondary plane.
3. `three_plane` is reserved for explicit compare, diagnostic, or incident-command work.
4. Narrow widths must fall back to `mission_stack`.
5. Cross-shell launches into workspace, hub, pharmacy, or governance surfaces must emit an `OpsReturnToken` so the operator can return to the same board state.
6. Governed mutation handoffs from these routes should launch into the Governance and Admin Shell with an `OpsReturnToken`; the operations shell must not grow a second independent config, access, or promotion workflow.

Canonical route family:

- `/ops/overview`
- `/ops/queues`
- `/ops/capacity`
- `/ops/dependencies`
- `/ops/audit`
- `/ops/assurance`
- `/ops/incidents`
- `/ops/resilience`

## 3. Front-end data architecture

Read models must be denormalized, scope-aware, and keyed for in-place live patching. The browser must never build operational truth by joining raw audit feeds, raw event streams, or multi-domain stores client-side.

Create these front-end read contracts:

- `OpsOverviewProjection`: north-star metrics, ranked bottlenecks, dependency summary, equity summary, active interventions, freshness summary
- `OpsQueuePressureProjection`: queue depth, median age, breach risk, arrival and clear rates, ranked entities, constraints
- `OpsResourceAllocationProjection`: capacity by lane, demand by lane, transferable pools, recommended scenarios, policy guardrails
- `OpsDependencyHealthProjection`: essential functions, dependencies, health state, fallback state, restore readiness
- `OpsEquityImpactProjection`: channel variance, cohort variance, access risk, trend drivers
- `OpsInterventionProjection`: candidate actions, predicted relief, confidence band, owner, consequence previews
- `OpsInvestigationProjection`: origin context, causal chain, linked queues and entities, dependency touches, audit pivots, timeline
- `OpsLiveDeltaChannel`: surface ref, scope ref, delta type, severity, patch payload, published time

Rules:

1. All board surfaces must bind to one scope-aware BFF contract and one typed live channel.
2. Every tile, row, and chart datum must have a stable identity so updates can patch in place.
3. Live channels must ship grouped settlement batches, not per-event render storms.
4. Filter state must be canonical, serializable, and sharable in the URL.
5. Projection freshness must be first-class data, not inferred from websocket state alone.
6. If one projection goes stale, only that region degrades unless a safe global interpretation is no longer possible.

## 4. Canonical overview composition

The default `/ops/overview` screen must render six disciplined surfaces:

1. `NorthStarBand`
2. `BottleneckRadar`
3. `CapacityAllocator`
4. `ServiceHealthGrid`
5. `CohortImpactMatrix`
6. `InterventionWorkbench`

`InvestigationDrawer` is the canonical drill-down surface across all six.

### 4.1 NorthStarBand

- Show 5 to 7 operator metrics only.
- Every metric tile must show current value, delta, freshness, and direct drill-in.
- Only the single most actionable abnormal metric may elevate its tone above the base band.

### 4.2 BottleneckRadar

- Is the dominant anomaly field for the overview.
- Must default to a ranked list or matrix with optional heat overlay, not a chart wall.
- Must rank by operational consequence and intervention leverage, not raw count alone.
- Selecting a bottleneck pins it across live refresh.
- High-churn items may update values live, but resort only when the operator is idle or explicitly applies queued deltas.

### 4.3 CapacityAllocator

- Is the canonical dynamic resource allocation surface.
- Must show current state, recommended state, and predicted outcome together.
- Must distinguish advisory scenarios from ready-to-commit actions.
- Must surface safety, skill, and ownership guardrails before commit.
- Scenario comparison is explicit; do not auto-open multi-scenario compare by default.

### 4.4 ServiceHealthGrid

- Models essential function health before infrastructure detail.
- Must show whether fallback exists, whether it is active, and whether it is sufficient.
- Must allow drill-down from essential function to dependency chain without losing board context.
- Charts are optional; tabular fallback is mandatory.

### 4.5 CohortImpactMatrix

- Surfaces channel, geography, demographic, or pathway variance that materially changes access or delivery quality.
- Must remain summary-level by default and expand only when variance crosses configured materiality thresholds or the operator opens it.
- May not compete with the active bottleneck and intervention surfaces for primary focus.

### 4.6 InterventionWorkbench

- Is the single promoted action region for the active anomaly.
- Must remain stable while the rest of the board updates.
- Must show why the action is recommended, what it changes, what it costs, and who owns it.
- Commit must use explicit `ConsequencePreview` and reason capture where policy requires it.
- The workbench must retain pre-commit context until authoritative settlement arrives.

### 4.7 InvestigationDrawer

- Opens in place from any overview surface.
- Preserves the selected anomaly and board scope.
- May expand to pinned or split-view mode for deeper diagnosis.
- Is preferred over modal stacks or route-breaking detail pages for same-scope investigation.

## 5. Visual hierarchy and motion rules

1. The masthead owns scope, horizon, search, global filters, live mode, and pause-live controls.
2. `NorthStarBand` communicates the system state in one scan line.
3. `BottleneckRadar` owns the dominant visual weight of the page.
4. `InterventionWorkbench` owns the dominant action weight of the page.
5. `ServiceHealthGrid` and `CohortImpactMatrix` stay calmer unless their state becomes the selected anomaly driver.
6. One escalated region per viewport. If multiple regions are abnormal, escalate the most actionable one and summarize the rest.
7. Use color, iconography, shape, copy, and motion together; never rely on color alone.
8. Prefer compact trend strips, heat cells, and ranked grids over oversized chart walls.
9. Numeric metrics must morph in place; do not animate theatrical count-ups.
10. Threshold crossings may pulse once and then rest in a stable elevated state.
11. Resorting lists or grids while the operator is hovered, keyboard-focused, comparing, or composing is forbidden.
12. When live updates are paused, new deltas must collect in a visible batch queue and apply only on resume or explicit accept.

## 6. Drill-down, allocation, and degraded-mode algorithms

For any board interaction:

1. Selecting a metric, bottleneck, health node, or cohort slice must open `InvestigationDrawer` or deepen the existing split view inside the same shell.
2. The originating board state must be serialized into `OpsReturnToken`.
3. The selected anomaly must remain pinned while related surfaces refresh.
4. Cross-filtering is allowed only when it is reversible in one step and visible in the masthead.
5. Launching from the operations console into workspace, hub, pharmacy, audit, or incident detail must preserve the originating `OpsReturnToken`.
6. Returning from a child surface must restore filters, horizon, pinned anomaly, selected tab, and scroll position where still valid.
7. Compare mode is explicit. Opening a second or third scenario, queue, or dependency path must not happen automatically.
8. When the reason for expanded diagnosis resolves, the shell must return to its prior quiet posture unless the operator pinned the richer layout.

For capacity and allocation work:

1. Start from the active bottleneck or lane, not from a blank planner.
2. Show current demand, current capacity, and predicted shortfall before any recommendation.
3. Rank candidate reallocations by expected safe relief, time-to-effect, confidence, and policy compatibility.
4. Distinguish human staffing moves, automation fallback, routing changes, supplier failover, and threshold adjustments as separate action types.
5. Every candidate action must show target scope, expected relief, implementation lag, owner, downside or displaced risk, and applicable guardrails.
6. Scenario compare must use `current | proposed | impact` with a shared metric basis.
7. Committing an allocation plan must show `pending_effect` until authoritative telemetry confirms the change.
8. Low-confidence recommendations must stay advisory and may not inherit the same visual weight as ready-to-commit interventions.

For real-time system health and degraded mode:

1. Essential function health outranks infrastructure detail on the default board.
2. Every health state must express both severity and operability: `healthy`, `degraded_but_operating`, `fallback_active`, `blocked`, or `unknown_or_stale`.
3. Shell-level freshness must reflect whether the operator can trust the whole board.
4. Component-level staleness must remain local where safe.
5. Entering degraded mode must preserve the last stable board and annotate affected regions rather than replacing the whole console with an outage page.
6. Incident command may temporarily promote the relevant health or bottleneck surface, but it must not erase allocation or queue context that operators still need.
7. The resilience lens is a specialist child view of the same shell, not a separate disconnected admin product.

## 7. Accessibility, responsiveness, and verification

1. The console is desktop-first, but all views must remain operable on laptop widths and readable in `mission_stack`.
2. Every visual matrix, chart, or heat surface must have a keyboard-accessible table or list fallback.
3. Hotkeys are encouraged for scope changes, pause-live, search, and return-to-board, but every action must also be available through standard controls.
4. Use virtualization for large worklists and entity tables.
5. First stable overview render must prefer summary projections first, then hydrate deeper boards progressively without layout thrash.
6. Live updates must be rate-limited at the surface level so render cost stays bounded during event spikes.
7. Automation selectors must key off stable semantic identifiers such as `data-surface`, `data-scope`, and `data-entity-ref`.

Ship the console with verification for:

- stable shell reuse across `/ops/overview`, `/ops/queues`, `/ops/capacity`, and `/ops/dependencies`
- pause-live with buffered batch apply
- pinned anomaly preservation during live patching
- one dominant anomaly and one dominant intervention region at a time
- scenario compare without auto-resort or focus theft
- return-from-drill restoration via `OpsReturnToken`
- degraded-mode preservation of the last stable board
- accessible table fallback for every chart or heat surface
- performance under high-churn metric updates

## Linked documents

This blueprint is intended to be used with:

- `platform-frontend-blueprint.md`
- `phase-9-the-assurance-ledger.md`
- `staff-operations-and-support-blueprint.md`
- `governance-admin-console-frontend-blueprint.md`
- `platform-admin-and-config-blueprint.md`
- `ux-quiet-clarity-redesign.md`
