# UI/UX Design Skill for Vecells

## Mission
Design Vecells as an **operational instrument**, not a generic dashboard, CRM, or form app. The interface must make invisible workflow state visible so users can instantly understand:

- what is happening
- what is blocked
- who owns it
- what evidence supports it
- what action is safest and fastest next

The product spans intake, identity, safety review, triage, booking, network coordination, pharmacy coordination, and communications. The UI must therefore feel like a **continuous case system** rather than a collection of unrelated screens.

## Forensic Hardening Priorities
This iteration closes five high-priority defects in this design-governance layer:

1. the skill had drifted from the canonical platform interaction model and risked creating a second naming system
2. shell continuity, layout topology, and attention-budget rules were implied but not bound to the actual `PersistentShell` contract
3. truth, audience tier, and projection-consistency constraints were under-specified, which could permit contradictory or overexposed UI states
4. live queue and active-selection behavior must enforce `QueueChangeBatch` buffering and `SelectedAnchor` preservation
5. the pharmacy archetype could be misread as a generic dispensing or PMR surface instead of staying within the referral-first and policy-bounded pharmacy scope

## Design Philosophy
Create a bespoke visual language called **Signal Atlas Live** with the **Quiet Clarity** overlay applied.

Signal Atlas Live with Quiet Clarity should feel:

- precise, clinical, and calm
- intentionally low-noise: only the information needed for the current decision is foregrounded
- high-trust and high-legibility under operational stress
- spatially memorable across dense workflows
- expressive through structure, light, state, and motion rather than decoration
- modern without looking like a template library
- conservative with motion, badges, and color so the interface never feels louder than the care task

Do **not** imitate default enterprise SaaS patterns such as:

- anonymous cards everywhere
- endless accordion stacks
- flat CRUD tables with detached detail pages
- generic kanban-only workflows
- consumer-app gradients with no semantic meaning
- permanently open side rails, duplicated status banners, or dashboard wallpaper

The UI should look like a **quiet operational instrument for care logistics**.

## Canonical Compatibility Bridge
This skill is a design-governance layer over the canonical platform interaction contract. It must not redefine the front-end primitives or shell laws already fixed in `platform-frontend-blueprint.md`, `phase-0-the-foundation-protocol.md`, and `canonical-ui-contract-kernel.md`.

Use these canonical names and compatibility mappings consistently:

- `CasePulse` is the canonical case header truth layer
- `StateBraid` is the canonical timeline surface
- `DecisionDock` is the canonical action surface
- the shared status strip is implemented through `AmbientStateRibbon` plus `FreshnessChip`
- `InlineSideStage`, `QueueLens`, and `SelectedAnchor` keep comparison and local detail inside the same shell

Governing laws:

- same object, same shell
- one screen, one question, one dominant action, one promoted support region
- adjacent lifecycle states of the same continuity key must morph in place inside one `PersistentShell`
- patient-visible top-level state must come from the shared `MacroStateMapper`, not a screen-local label set
- routine surfaces must default to `clarityMode = essential` and let `AttentionBudget` decide what support region may auto-promote

If this skill conflicts with the canonical platform shell rules, the canonical shell rules win.

## Control priorities
This iteration closes five high-priority defects in the UI design-governance layer:

1. live UI proposals were still not forced to name one published `AudienceSurfaceRouteContract`, `surfacePublicationRef`, and `RuntimePublicationBundle`, so calm or writable posture could be designed on unpublished contracts
2. degraded, frozen, or blocked states must not allow generic error handling, because `TransitionEnvelope`, `RouteFreezeDisposition`, and `ReleaseRecoveryDisposition` must be mandatory design objects
3. artifact rendering and external handoff behavior were under-specified, which left booking summaries, records, calendar exports, print flows, and browser handoff vulnerable to raw-file or detached-page design shortcuts
4. assistive surfaces were discussed as interaction patterns, but not yet bound to runtime publication, trust, freeze, and same-shell governance
5. UI telemetry and settlement visibility were still treated as implementation detail, which risked PHI-leaky instrumentation and success states that could not be causally verified

## Core Experience Principles

### 1. Show causality, not just status
Every important object should reveal its lineage: origin, evidence, decisions, dependencies, and awaiting-external confirmations when those confirmations still govern visible truth.

### 2. Default to progressive revelation
Users should see the next meaningful layer of detail without being overwhelmed by everything at once.

### 2A. Quiet by default
Only one dominant status, one dominant action, and one promoted support region should compete for attention at a time. Secondary status, history, and explanation should stay collapsed until requested or required for safe action.

### 2B. List first, visualization second
Use plain lists, summaries, and comparison tables as the default operating surfaces. Orbit, atlas, and other spatial views should be optional comparison modes when they measurably improve sensemaking.

### 2C. Budget attention explicitly
Every screen must define an attention budget: one dominant question, one dominant action, and one promoted support region. History, evidence, assistive signals, and policy context may remain available, but only one of them should auto-promote at a time unless a blocker, compare task, or explicit user pin justifies more.

### 3. Preserve spatial memory
Global navigation, queue posture, case summary, and contextual intelligence should live in stable regions so users can build muscle memory.

### 4. One dominant action per moment
Each view should clearly express the single best next action. Secondary actions should remain available but visually subordinated or moved into a quiet overflow.

### 5. Dense where needed, breathable overall
High-priority density gaps in this layer:

1. density is described aesthetically, but not yet governed per route class, so teams can still produce chart walls, card sprawl, or overcompressed expert screens
2. the shell does not yet define where density is allowed to concentrate, which risks cluttering mastheads, action regions, and support regions simultaneously
3. dense data expansion lacks an explicit budget, so compare panes, helper text, and history clusters can all remain open and silently defeat `clarityMode = essential`
4. responsive compression is under-specified, so dense desktop layouts can collapse into unreadable mobile or zoomed states instead of choosing a different operating posture
5. high-density recovery states are not yet disciplined, so stale, blocked, or degraded conditions can add chrome faster than they remove noise

Use explicit density contracts:

**DensityProfile**
- `routeClass`
- `defaultInformationDensity = sparse | balanced | dense`
- `maxSimultaneousDenseRegions`
- `primaryScanDepth`
- `supportsTableFirst`

**RegionBreathingMap**
- `mastheadDensity`
- `primaryWorkRegionDensity`
- `supportRegionDensity`
- `spacingBands`
- `collapseOrder`

**ExpansionBudget**
- `clarityMode`
- `maxExpandedRecords`
- `maxExpandedHelpers`
- `maxExpandedHistoryClusters`
- `compareModeAllowed`

**CompressionFallbackPlan**
- `breakpointClass = compact | narrow | medium | expanded | wide`
- `effectiveInlineFormula`
- `zoomOrTextScaleBand`
- `fallbackTopology = focus_frame | two_plane | three_plane | mission_stack | embedded_strip`
- `requiredPinnedElements`
- `collapsePriority`
- `compareFallbackRef`
- `stickyActionPolicyRef`
- `deferOrCollapseRules`

**DensityRecoveryMode**
- `triggerState = stale | blocked | degraded | reconciliation_required`
- `removeFirst`
- `preserveFirst`
- `announceFirst`
- `operatorRecoveryAnchor`

Design rules:

- put density in the working surface first: queue bodies, evidence tables, comparison grids, and row-level detail may be dense; mastheads, status strips, and dominant action regions must stay short and scannable
- every major screen must declare one `DensityProfile` and one `ExpansionBudget`; if a design cannot name which regions are dense and which remain quiet, it is not production-ready
- in `clarityMode = essential`, density may deepen inside the current primary work region, but helper content, history, compare state, and support detail must collapse according to `ExpansionBudget` before the shell adds another promoted region
- when width, zoom, or text scale reduces safe scanability, apply `CompressionFallbackPlan` by changing topology or collapsing secondary detail; never preserve desktop density by shrinking type, hit areas, or semantic spacing below safe thresholds
- measure responsive state from the owning shell container first, not from a raw device label, so embedded and constrained-browser surfaces compress from the space they actually have
- when the product enters stale, blocked, or degraded posture, use `DensityRecoveryMode` to remove decorative or duplicative chrome first and preserve the operator's current anchor, explanation, and next safe action

### 6. Evidence before commitment
Any irreversible or externally consequential action must surface confidence, source quality, and downstream consequences before confirmation.

### 7. Keyboard-first professionalism
The experience should be fast for expert operators who navigate with keyboard, search, command palettes, and quick actions.

### 8. Edge-case integrity
Conflict, invalidation, stale data, connection loss, and reopen flows must become calmer and clearer, not visually louder. Failure handling should preserve context first and introduce more detail only as needed.

### 9. Truth before polish
No surface may render persuasive reassurance, mutating CTAs, or patient-safe summaries unless the underlying projections are causally consistent for that audience tier.

Design consequences:

- `patient_public` and `patient_authenticated` are different UI contracts, not styling variants
- the header, timeline, next action, and shared status strip must agree on governing-object version before live CTAs remain enabled
- freshness, disconnected transport, paused live updates, command-following pending, stale review, and read-only recovery are distinct user-facing states; do not collapse them into one generic sync badge
- shell-level and region-level freshness must both derive from the same `ProjectionFreshnessEnvelope`; live socket state or recent polling is transport only, not proof of fresh truth
- if projections diverge, the same shell should switch to a bounded updating, awaiting-external, or recovery posture rather than showing contradictory truth
- blocked reachability, identity hold, or unresolved confirmation gates must appear as first-class blockers when they govern the current action
- patient home, spotlight, and section-entry cards must derive spotlight ownership, urgency, and CTA enablement from `PatientSpotlightDecisionProjection`, `PatientSpotlightDecisionUseWindow`, `PatientQuietHomeDecision`, and `PatientNavUrgencyDigest`, and preserve same-shell return through `PatientNavReturnContract`
- record-origin follow-up actions must carry `RecordActionContextToken` and `RecoveryContinuationToken` so step-up, release drift, or recovery never drops the original record anchor
- message previews, unread badges, and reply affordances must derive from `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, and `ConversationCommandSettlement`, not from transport or local acknowledgement alone
- support replay exit, observe return, and support deep-link restore must remain read-only or recovery-bound until `SupportReplayRestoreSettlement` explicitly returns the shell to live posture and proves the same replay checkpoint, mask scope, selected anchor, and held-draft disposition

### 9A. Published truth only
No UI proposal may assume a live, calm, or writable state without naming the published runtime contract that allows it.

Design rules:

- every patient, staff, embedded, or support surface with live status or mutating controls must identify one `AudienceSurfaceRouteContract`, one `surfacePublicationRef`, and one `RuntimePublicationBundle`
- if the active contract is `stale`, `conflict`, or `withdrawn`, the design must degrade to read-only, placeholder, or governed recovery posture in the same shell; it may not leave routine success copy or enabled CTAs visible
- public, authenticated, NHS App embedded, and staff variants are separate route contracts; a shared layout treatment does not make them one operational contract
- dense, calm, or minimal UI is valid only after the published runtime contract proves that the required trust, freeze, and embedded posture are satisfied

### 9B. Recovery is designed, not improvised
Pending, blocked, frozen, and downgraded states must be first-class design surfaces, not implementation leftovers.

Design rules:

- every mutating or operationally consequential route must declare the expected `TransitionEnvelope` plus one bounded `RouteFreezeDisposition` or `ReleaseRecoveryDisposition`
- adjacent lifecycle states of the same governing object must remain in the same `PersistentShell` while they move between pending, reconcile-required, read-only, placeholder, or redirected recovery posture
- generic full-page error views, detached retry pages, and success-to-failure jumps that lose the user's current anchor are design failures unless a route-family boundary explicitly requires them
- the dominant action region, shared status strip, and receipts must all agree on the declared transition and recovery posture before success language appears

### 9C. Artifact and external handoff discipline
Documents, letters, records, appointment outputs, exports, print flows, and browser handoff are part of the product experience and must be designed as governed surfaces.

Design rules:

- any screen that renders or launches an artifact must identify one `ArtifactPresentationContract`
- any external browser, print, download, calendar, or cross-app handoff must identify one `OutboundNavigationGrant`
- summary-first, same-shell review is the default; raw file URLs, opaque attachments, or detached success pages are not valid primary designs
- if a channel cannot safely support the handoff contract, the design must show the bounded placeholder, read-only summary, or recovery route instead of pretending the artifact is available

### 9D. Assistive surfaces inherit runtime and trust posture
Assistive UI is not a special exemption from shell, publication, or trust law.

Design rules:

- any assistive badge, draft, recommendation, explanation, or provenance footer must bind to `AssistiveSurfaceBinding`
- live assistive posture must also name the governing `AudienceSurfaceRouteContract`, `surfacePublicationRef`, and `RuntimePublicationBundle`
- live assistive posture must also expose the current `AssistiveCapabilityRolloutVerdict` so shadow, summary-visible, insert-enabled, governed-commit, frozen, and recovery-bound states are distinguishable on the surface that the user is actually in
- any visible assistive state must expose its linked `AssistiveCapabilityWatchTuple`, `AssistiveCapabilityTrustEnvelope`, and `AssistiveFreezeDisposition` so operators can see whether the capability is renderable, shadow-only, quarantined, frozen, observe-only, blocked-by-policy, or recovery-bound
- assistive surfaces must stay inside the owning shell continuity envelope, using `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, the current `WorkspaceTrustEnvelope`, and one current `AssistiveCapabilityTrustEnvelope` for current staff routes; a floating copilot panel that bypasses route, trust, interruption-pacing, or assistive actionability posture is not valid

### 9E. Observability without leakage
Design quality includes proving what changed, when it settled, and what may safely be disclosed.

Design rules:

- any surface that can show local acknowledgement before authoritative settlement must expose one `UITransitionSettlementRecord` and one visible settlement marker rather than relying on toast timing or animation alone
- PHI-bearing or identity-bearing route state must emit one `UIEventEnvelope` and prove redaction through `UITelemetryDisclosureFence`
- analytics, replay, and Playwright hooks must observe published route posture, transition posture, and disclosure posture without leaking protected content into locators, traces, or event payloads
- if a team cannot explain what will be emitted, redacted, and asserted for a critical workflow, the design is not ready for implementation

## Overarching Design Language

`design-token-foundation.md` remains the canonical primitive visual-token source for Signal Atlas Live. `canonical-ui-contract-kernel.md` binds those primitives to state-severity, breakpoint, artifact-mode, automation-anchor, and telemetry semantics. This skill may shape information architecture, promotion posture, and shell topology, but it may not invent a second spacing, type, color, radius, elevation, motion, or state-vocabulary scale.

### Token law
Use one four-layer token stack:

- `ref.*` primitives for spatial quanta, tone ladders, size steps, durations, and radii
- `sys.*` semantic roles for surface, text, icon, border, focus, state, freshness, and trust
- `comp.*` component tokens for shell, board, card, rail, drawer, form, list, table, and task surfaces
- `profile.*` shell profiles for patient, workspace, hub, support, pharmacy, operations, and governance

### Visual identity
Use restrained neutral surfaces with semantic accents that resolve through semantic roles rather than local hex values.

- neutral surfaces carry most of the interface weight
- semantic accents appear only where state, actionability, freshness, or trust changes consequence
- separation should come from surface role, spacing, boundary contrast, and typography before shadow

### Geometry and rhythm
Use the canonical dual lattice:

- 4px atomic spacing for local alignment and component rhythm
- 8px structural grid for gutters, regions, and pane widths
- shell and support-plane widths should snap to canonical pane tokens rather than route-local percentages
- "card" is a surface role, not a default layout pattern
- responsive shell tokens: `shellInsetInline = clamp(16px, 2vi, 32px)`, `shellInsetBlock = clamp(12px, 1.5vb, 24px)`, `regionGap = clamp(12px, 2vi, 32px)`

### Typography
Use the canonical editorial-operational scale from `design-token-foundation.md`.

- tabular numerics for time, IDs, and queue metrics
- no uppercase metadata below the canonical label role
- readable measures for patient copy and tighter measures for task copy
- line-height and spacing must snap to the shared rhythm grid

### Motion
Motion must explain causality within the shared motion tokens.

- soft directional motion for state progression and anchored state recovery
- pulse only for truly live or expiring events and never beyond a bounded pending window
- no ornamental looping animation, bounce, or multi-axis flourish
- transitions should communicate ownership changes, lock states, invalidation, settlement, recovery, new evidence, or queue movement

The precise numeric scale for spacing, sizing, typography, semantic color roles, breakpoint classes, artifact modes, state precedence, and automation anchors now lives in `canonical-ui-contract-kernel.md`. The labels in this skill are descriptive aliases; production-ready proposals must declare the exact kernel profiles they use.

## Conceptual Layout Strategy
Use the canonical `PersistentShell` layout topology and let route class plus `AttentionBudget` choose the posture.

Measure breakpoint state from the shell container, safe area, and current zoom or text scale before mapping width to layout. The canonical topology thresholds are:

- `focus_frame` for patient and lightweight work when `usableInlinePx >= 600` and no lawful split-plane promotion is active
- `two_plane` for staff, hub, support, and operations work only when `usableInlinePx >= 960`
- `three_plane` only when blocker-heavy, compare-heavy, or explicitly pinned context states require it and `usableInlinePx >= 1280`
- `mission_stack` below split-plane thresholds or whenever zoom, text scale, or focus protection makes multi-plane layouts unsafe
- `embedded_strip` only for embedded or constrained-browser contexts whose host chrome or capability budget requires the owning shell to compress, especially below `usableInlinePx = 840`

Promotion rules:

- start in `clarityMode = essential` unless a blocker, compare task, or diagnostic route contract requires more
- only one support region may auto-promote at a time on routine surfaces
- when blocker or compare posture resolves, the shell should restore the last quiet posture unless the user explicitly pinned a richer layout

### Plane 1: Global Signal Rail
A slim rail or drawer for:

- work domains: Intake, Triage, Booking, Network, Pharmacy, Communications
- saved views
- command search
- alerts and handoff inbox

This rail should feel more like an air-traffic sector index than a website nav.

### Plane 2: Case Spine
The center canvas is the working heart of the system.

It contains:

- case title and identity shell
- current state and ownership
- primary decision surface
- temporal activity braid
- active forms, comparisons, and decision tools

The center area should always answer: **what is this case, where is it in the journey, and what do I do now?**

### Plane 3: Context Constellation
A right-side contextual intelligence plane for:

- evidence confidence
- patient details
- communications history
- risk flags
- dependency blockers
- SLA timers
- policy notes
- related tasks and linked entities

This plane should stay closed or peeked by default and only pin open when the user asks for it or when blocking ambiguity, conflict, or safety review requires it.

## Screen Archetypes

### 1. Intake Observatory
Purpose: convert inbound requests into coherent, trustworthy case structures.

Unique characteristics:

- **Request intake ribbon** that shows channel, freshness, completeness, and missing fields at a glance
- **Evidence prism** that layers submitted info, inferred structure, and unresolved ambiguity
- **Confidence veil** that visually separates hard facts from unverified claims
- **Submit gate** that visually previews what downstream teams will inherit

### 2. Triage Studio
Purpose: support rapid but careful human review.

Unique characteristics:

- **Split-focus canvas** with patient/request context on the left, core evidence in the center, and action composer on the right
- **Safety lens** that overlays contraindications, urgency cues, and missing proof without hijacking the entire screen
- **Decision dock** that shows the recommended action, alternate actions, and downstream consequences before commit
- **Reopen memory** showing why similar cases previously bounced, stalled, or escalated

### 3. Booking Orbit
Purpose: make option comparison and commitment visually intuitive without forcing novelty on routine tasks.

Unique characteristics:

- **List-first candidate set** grouped by soonest, best fit, and fallback in plain language
- optional **orbit view** for dense comparison when it genuinely improves sensemaking
- **Offer session capsule** showing resource lock, freshness, and confirmation risk
- **Constraint chips** that visibly reshape either the list or orbit when the user toggles transport, timing, modality, or patient preferences
- **Commit strip** that clearly separates provisional selection from confirmed booking

### 4. Network Atlas
Purpose: manage hub coordination and alternatives.

Unique characteristics:

- **Ranked list by default** showing suitability, distance, availability confidence, and pathway compatibility
- optional **capability lattice** for deeper comparison work
- **Negotiation thread** embedded beside each candidate instead of buried in modal dialogs
- **Alternative horizon** surfacing next-best candidates before the current option fails
- **Bounceback marker** that shows exactly why a downstream route returned upstream

### 5. Pharmacy Conduit
Purpose: manage pharmacy referral dispatch, response, and outcome ambiguity without redefining the product as a general PMR or dispensing system.

Unique characteristics:

- **Chain-of-custody braid** visualizing dispatch attempts, acknowledgements, exceptions, and confirmations
- **Outcome confidence meter** showing whether the current state is provisional, confirmed, disputed, or reconciled
- **Exception lanes** for urgent returns, message failures, confirmation drift, or governed servicing-site exceptions when medicine-level data is explicitly in scope
- **Escalation ladder** that reveals what auto-retry, human callback, or supervisor review will happen next

Scope rules:

- default Phase 6 pharmacy work remains referral-first
- inventory, stock, or fulfilment views appear only when the route is operating under the dedicated pharmacy shell and the servicing-site policy allows medicine-level data
- referral choice, consent, dispatch, bounce-back, and status must stay continuous with the same request lineage rather than splitting into a detached pharmacy product

### 6. Communications Theater
Purpose: unify patient messaging, callbacks, reminders, and operational communications.

Unique characteristics:

- **Intent-grouped thread** by default, with chronology still obvious
- **Outcome-aware drafts** that show why a message exists and what state it is tied to
- **Channel suitability hints** recommending SMS, phone, or portal based on urgency, sensitivity, and response history
- **Next contact band** showing planned outreach and dependency conditions

## Signature Components

### Case Pulse
A persistent case header that combines:

- case identity
- state capsule
- ownership beacon
- urgency level
- SLA arc
- confirmation posture
- last trustworthy event timestamp

This is not a plain header. It is the compact truth layer for the case and should foreground only the headline, the macro-state, and the next best action cue by default.

`CasePulse` must never contradict the current `MacroStateMapper` result for the audience tier that is viewing it.

### Status Strip
A single quiet line for:

- save state
- sync and freshness state
- waiting-on-external confirmation
- queued live updates
- review-required blockers

The strip should merge routine trust and progress signals into one place. Do not duplicate the same status in separate banners, chips, and toasts unless the state is urgent or blocking.

This strip is the quiet-mode rendering of `AmbientStateRibbon` plus `FreshnessChip`, not a second independent status system.

### State Braid
Replace simplistic timelines with a **state braid**:

- one strand for business state
- one for communications
- one for external confirmations
- one for exceptions/recovery

The braid makes waiting, divergence, and reconciliation visible.

### Evidence Prism
A layered evidence container that distinguishes:

- user-entered facts
- system-derived facts
- third-party confirmations
- ambiguous or stale evidence

The prism should support inline source inspection without pulling the user away from the main task.

### Decision Dock
A right-anchored action surface that always shows:

- recommended action
- reason for recommendation
- confidence level
- immediate side effects
- hidden consequences that need disclosure
- fallback paths

It should feel like an expert copilot, not a button bar. One primary action should be visually dominant; secondary actions should be quiet, grouped, or overflowed.

### Queue Lens
A next-generation queue view.

Instead of a dead table alone, show:

- **queue density horizon** for workload shape
- **priority layering** by urgency and aging
- **ownership ghosts** showing recently released or contested work
- **burst indicators** for operational spikes

Still allow table mode for expert scanning and bulk action.

Live queue rules:

- disruptive reorder, insertion, or priority shifts must buffer through `QueueChangeBatch`
- the active row must remain pinned while the user is reading or acting on it
- queue change indicators should summarize churn before changing the working set under the user
- opening a row must preserve the active `SelectedAnchor` and its `anchorTupleHash` through pending, invalidation, failure, and settlement unless the user explicitly releases it

### Inline Side Stage
When a row, event, or candidate is opened, it should expand into a **side stage** instead of a page switch or modal stack.

Benefits:

- preserves context
- supports compare-and-decide flows
- reduces navigation memory burden
- enables quick back-to-back review

It must open within the same `PersistentShell` when the continuity key is unchanged; modal stacks and hard page switches are exceptions, not the default.

## Interaction Model

### Navigation
Support three simultaneous navigation modes:

- spatial navigation through regions
- search-driven navigation via command palette
- object-driven navigation through linked entities and events

### Decision making
Prefer **progressive commitment**:

- preview
- validate
- reserve/lock if needed
- confirm
- verify downstream acknowledgement
- finalize when truth is durable

The UI should visually distinguish each of these phases.

### Forms
Forms must behave like structured interviews, not paperwork dumps.

Use:

- section-by-section reveal
- conditional logic that exposes only relevant inputs
- inline rationale for uncommon fields
- visible completion posture
- recovery-friendly save states
- no repeated data entry when trustworthy prior values exist

### Empty states
Design empty states as orientation tools.

Each empty state should do three things:

- explain why the area is empty
- describe what normally appears there
- offer the fastest safe next action

## Tables, Lists, and Dense Data
Treat tables as operating surfaces, not passive reports.

Every major table should support:

- find
- compare
- inspect inline
- act inline
- pivot to the full case without losing the working set

Default to list or table views first. Use spatial or highly expressive comparison views as optional upgrades, not as the mandatory first rendering.

Avoid visual monotony by mixing:

- table rows with semantic badges
- inline progress markers
- mini trend glyphs
- expandable row intelligence
- persistent bulk-action rail

Do not rely on accordion-heavy desktop layouts for primary operational work.

## Accessibility and Inclusive Use
Accessibility is a first-class design property, not a compliance pass.

Every new major screen or route-family proposal must ship one `AccessibilitySemanticCoverageProfile` plus the relevant contracts from `accessibility-and-content-system-contract.md`: always `AccessibleSurfaceContract`, `KeyboardInteractionContract`, `FocusTransitionContract`, `AssistiveAnnouncementContract`, and `FreshnessAccessibilityContract`, plus `FieldAccessibilityContract`, `FormErrorSummaryContract`, `TimeoutRecoveryContract`, `VisualizationFallbackContract`, and `AssistiveTextPolicy` whenever the pattern collects input, expires, or visualizes data. That profile must bind to the same `AutomationAnchorProfile`, `AutomationAnchorMap`, `SurfaceStateSemanticsProfile`, and `DesignContractPublicationBundle` as the rendered screen.

Non-negotiables:

- strong visible focus indicators
- focus never hidden behind sticky chrome
- generous target sizes for interactive controls
- full keyboard operability
- clear labels and descriptions for controls
- no color-only meaning
- consistent help entry points
- avoid redundant entry where the system already knows the answer
- respect reduced-motion preferences
- support reflow and zoom without breaking primary actions
- comfortable touch targets of at least `44x44` CSS px for primary, sticky, and touch-first controls; dense inline utilities may drop to `24x24` only when spacing or an equivalent larger control preserves accuracy
- sticky action bars or docks with at least `56px` height and scroll padding equal to dock height plus safe-area inset
- same-shell reflow that stays operable at `320` CSS px and `400%` zoom without forcing ordinary vertical tasks into horizontal scrolling
- screen-reader-only text clarifies but never carries hidden decision-critical meaning
- charts and heat surfaces default to summary sentence plus table parity, not chart-only comprehension

All bespoke interactions must remain understandable with keyboard, screen reader, zoom, low-vision workflows, embedded safe-area constraints, and constrained-browser host resize.

## Content and Microcopy
Voice should be:

- precise
- calm
- accountable
- consequence-aware

Avoid vague labels such as:

- Process
- Update
- Continue
- Resolve

Prefer labels that state the exact system effect, for example:

- Submit for triage
- Request slot confirmation
- Mark as awaiting external confirmation
- Reopen booking case
- Send pharmacy follow-up

Copy formulas must stay consistent across shells:

- empty state = why nothing is shown now + what usually appears here + safest next action
- error state = what happened + what it means for the current task + how to recover
- pending state = local acknowledgement + current actionability + what confirmation is still pending

## Design Anti-Patterns to Explicitly Avoid

- dashboard wallpaper with decorative metrics
- modal-on-modal workflows
- hidden system state
- generic stepper forms for non-linear case work
- color-only severity signaling
- giant monolithic detail pages
- separate pages for every tiny object inspection
- always-open context rails that force users to scan three dense planes when one or two will do
- duplicated status chrome across headers, banners, chips, and toasts
- spatial-first comparison views without a calmer list-first default
- dark patterns around confirmation or irreversible actions
- testing-unfriendly custom controls with weak semantics
- designing first and hoping QA can automate later

## Playwright-First Design Workflow
Playwright must be encouraged as part of the design and delivery process, not added at the end.

### Why Playwright belongs in the design skill
The UI should be designed so that its behavior is easy to verify in real browsers.

That means every critical flow should expose:

- stable roles
- deterministic accessible names
- predictable state transitions
- testable loading, empty, success, warning, locked, and error states
- reliable comparison points for visual review

### Rules for Playwright-friendly UI
High-priority testability defects in this layer:

1. locator guidance is component-local, but not yet bound to shell continuity and same-object route morphology, so tests can pass while the UI still hard-resets between adjacent lifecycle states
2. canonical surfaces are named, but there is no versioned automation-anchor registry, which invites brittle selector drift as the design system evolves
3. success, failure, and loading markers are required, but local acknowledgement, remote settlement, blocked state, and recovery posture are not yet modeled as one assertion contract
4. live-update and pause-live behavior are treated as runtime concerns only, so Playwright coverage can miss silent rebase, dropped deltas, or board thrash under subscription updates
5. audience tier, channel context, and embedded-capability constraints are not yet encoded in the test matrix, which leaves patient-public, authenticated, staff, and NHS App embedded behavior under-specified

Add these supporting testability contracts:

**PlaywrightContinuityFrame**
`continuityFrameId`, `entityContinuityKey`, `routeFamilyRef`, `routeIntentRef`, `canonicalObjectDescriptorRef`, `governingObjectRef`, `governingObjectVersionRef`, `routeContractDigestRef`, `parentAnchorRef`, `routeIntentTupleHash`, `baselineTupleHash`, `approvalTupleHash`, `watchTupleHash`, `continuityEvidenceContractRef`, `continuityEvidenceState`, `shellType`, `layoutTopology`, `primaryAnchorRef`, `readyMarkerRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeRef`, `lineageFenceEpoch`, `allowedMorphTargets[]`, `continuityPhase`

`PlaywrightContinuityFrame` is the automation contract for same-object continuity. Adjacent states of the same governing object must preserve the same shell frame and anchor set unless an explicit route-family boundary says otherwise, and tests should assert morph-in-place rather than page replacement. If `RouteIntentBinding`, governing-object version, route-contract digest, `baselineTupleHash`, `approvalTupleHash`, `watchTupleHash`, release freeze, channel freeze, or continuity evidence invalidates write posture, the frame must degrade into same-shell recovery or read-only mode rather than silently changing object, route family, target tuple, or chrome.

**AutomationAnchorRegistry**
`automationAnchorId`, `surfaceCode`, `locatorStrategy = role | label | text | test_id`, `accessibleNamePattern`, `scopeBoundaryRef`, `stateAttributeRefs[]`, `registryVersionRef`

`AutomationAnchorRegistry` is the single source of truth for durable automation anchors on canonical surfaces such as `CasePulse`, `StateBraid`, `DecisionDock`, `QueueLens`, `InlineSideStage`, and `SelectedAnchor`. Anchor changes must version the registry so tests and design reviews fail loudly instead of drifting silently.

**WorkflowSettlementBeacon**
`settlementBeaconId`, `governingObjectRef`, `canonicalObjectDescriptorRef`, `initiatingBoundedContextRef`, `governingBoundedContextRef`, `requiredContextBoundaryRefs[]`, `governingObjectVersionRef`, `commandActionRecordRef`, `commandSettlementRecordRef`, `routeIntentRef`, `routeIntentTupleHash`, `actionEligibilityFenceRef`, `actionLeaseRef`, `actionLeaseState`, `deltaGateRef`, `deltaGateState`, `returnTokenRef`, `returnValidationState = valid | stale_reacquire | read_only_recovery | invalid`, `boundaryDecisionRef`, `boundaryTupleHash`, `boundaryDecisionState`, `clinicalMeaningState`, `operationalFollowUpScope`, `boundaryReopenState`, `edgeCorrelationId`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `transitionEnvelopeRef`, `releaseRecoveryDispositionRef`, `lineageFenceEpoch`, `localAckState`, `processingAcceptanceState`, `externalObservationState`, `authoritativeOutcomeState`, `settlementRevision`, `authoritativeProofClass`, `truthConsistencyState`, `releaseFreezeState`, `channelFreezeState`, `assuranceTrustState`, `experienceContinuityEvidenceRef`, `continuityEvidenceState`, `projectionVisibilityRef`, `auditRecordRef`, `shellDecisionClass`, `selectedAnchorChangeClass`, `uiTransitionSettlementRecordRef`, `uiTelemetryDisclosureFenceRef`, `ctaState = enabled | frozen | observe_only`, `recoveryMarkerRef`

`WorkflowSettlementBeacon` makes action settlement observable in the DOM. Playwright must be able to distinguish optimistic local acknowledgement, accepted-for-processing state, external observation, authoritative success, blocked recovery, reconcile-required states, and freeze or trust downgrades without inferring them from paint timing or toast text. The beacon must expose when a CTA is frozen because `CommandSettlementRecord`, `RouteIntentBinding`, the bound target tuple, `actionEligibilityFenceRef`, `actionLeaseState`, `deltaGateState`, `returnValidationState`, the current self-care or admin boundary tuple, published route posture, `TransitionEnvelope`, `ReleaseRecoveryDisposition`, assurance trust, continuity evidence, or a declared bounded-context seam no longer permits ordinary mutation. It must also show which disclosure fence governs any emitted UI telemetry so audit and automation remain PHI-safe. `processingAcceptanceState = accepted_for_processing` is never sufficient for success-path assertions unless `authoritativeOutcomeState = settled`, `authoritativeProofClass`, `projectionVisibilityRef`, and `auditRecordRef` also prove completion.

**LiveDeltaHarnessWindow**
`deltaHarnessWindowId`, `subscriptionRef`, `pauseMode = live | paused | inspecting`, `bufferedDeltaRefs[]`, `materialDeltaCount`, `resumeMarkerRef`, `rebasePolicy`

`LiveDeltaHarnessWindow` is the contract for testing live boards and queues under ongoing subscription changes. When tests pause live updates or hold an investigation open, the UI must expose what was buffered, what is material, and how resume rebases or replays the pending deltas.

**VisibilityChannelTestMatrix**
`matrixId`, `audienceTier`, `audienceSurface`, `purposeOfUse`, `projectionFamilyRef`, `previewVisibility`, `artifactVisibility`, `mutationAuthority`, `actingContextRequirement`, `breakGlassState`, `channelContext = public_web | authenticated_web | nhs_app_embedded | staff`, `visibilityPolicyRef`, `requiredCoverageRowRefs[]`, `requiredOwningBoundedContextRef`, `allowedContributingBoundedContextRefs[]`, `requiredContextBoundaryRefs[]`, `requiredRouteIntentState`, `requiredSurfacePublicationRef`, `requiredRuntimePublicationBundleRef`, `requiredReleaseFreezeRef`, `requiredChannelFreezeState`, `requiredAssuranceSliceTrustRefs[]`, `requiredReleaseTrustFreezeVerdictRef`, `requiredContinuityEvidenceRefs[]`, `requiredBridgeCapabilitiesRef`, `requiredTransitionEnvelopeRefs[]`, `requiredProjectionVisibilityRefs[]`, `requiredCausalityEventRefs[]`, `requiredAuditJoinState`, `requiredArtifactContractRefs[]`, `requiredAssistiveWatchTupleRefs[]`, `requiredTelemetryDisclosureFenceRef`, `expectedPlaceholderRefs[]`, `forbiddenActionRefs[]`, `requiredRecoveryRefs[]`

`VisibilityChannelTestMatrix` defines the minimum assertion matrix for visibility and actionability. The same route may present different placeholders, CTAs, bridge-dependent affordances, published runtime posture, transition posture, artifact rules, assistive watch posture, freeze posture, continuity-evidence posture, and trust-dependent recovery routes across `patient_public`, `patient_authenticated`, `origin_practice`, `hub_desk`, `servicing_site`, `support`, embedded, governance, and break-glass contexts, and Playwright coverage must prove those differences explicitly.

1. Prefer semantic HTML and accessible roles before adding test IDs.
2. Ensure every interactive control has a unique accessible name in context.
3. Design components so locators can target them by role, label, text, or clearly scoped test ID.
4. Avoid animations that hide readiness or delay actionability.
5. Ensure loading states are explicit and visually distinct so assertions can wait on real state.
6. Give every critical workflow a defined success marker and failure marker.
7. Expose state transitions in the DOM, not only through paint or motion.
8. Create dedicated variants for empty, loading, stale, locked, processing, and reconciled states.
9. Use visual regression intentionally for high-value composite surfaces.
10. Record traces for complex workflows and failures.
11. Bind every major same-object journey to `PlaywrightContinuityFrame` so continuity, morph targets, and ready markers are testable.
12. Assert that stale `routeIntentTupleHash`, canonical object descriptor drift, governing-object version drift, `baselineTupleHash`, `approvalTupleHash`, or `watchTupleHash` drift, `actionLeaseState != live`, `deltaGateState` requiring reconcile, or `returnValidationState != valid` freezes live CTAs and preserves the same shell in recovery; tests must fail if the UI silently retargets a mutation to a sibling object.
12A. Register canonical surface anchors in `AutomationAnchorRegistry` before relying on ad hoc selectors.
13. Surface `WorkflowSettlementBeacon` state anywhere a user could misread local acknowledgement as final truth.
14. Use `LiveDeltaHarnessWindow` for live projections, pause-live boards, and operator investigation flows.
15. Drive public, authenticated, practice, hub, servicing-site, support, embedded, and governance assertions from `VisibilityChannelTestMatrix`, not from a single happy-path role.
15A. Assert that connected transport, recent polling, or resumed subscriptions do not by themselves clear stale or recovery posture; only the current `ProjectionFreshnessEnvelope` may restore fresh actionability.
16. Assert that `PlaywrightContinuityFrame.routeIntentRef` survives same-object morphs and fails closed into recovery when route or fence posture drifts.
17. Assert that `WorkflowSettlementBeacon` exposes freeze, action-eligibility, return-validation, or trust downgrades from `CommandSettlementRecord`, release guards, delta gates, or assurance posture before any success copy appears.
18. Encode release-freeze, channel-freeze, and assurance-trust expectations in `VisibilityChannelTestMatrix`; do not treat embedded downgrade and degraded-truth behavior as optional edge coverage.
19. Assert that patient home and section-entry shells read spotlight ownership and CTA state from `PatientSpotlightDecisionProjection`, `PatientSpotlightDecisionUseWindow`, `PatientQuietHomeDecision`, and `PatientNavUrgencyDigest.governingSettlementRef`, and recover through `PatientNavReturnContract` instead of silently recomputing local card truth.
20. Assert that same-object routes expose the expected `continuityEvidenceContractRef` and `continuityEvidenceState` through `PlaywrightContinuityFrame` before accepting calm or writable posture.
20A. Assert that shell-level and localized freshness cues agree with the underlying `ProjectionFreshnessEnvelope` scopes so one stale region does not either over-freeze the whole shell or appear fresh by accident.
21. Assert that `WorkflowSettlementBeacon.experienceContinuityEvidenceRef` and `continuityEvidenceState` remain aligned with the visible receipt, confirmation, or recovery state before any success-path assertion passes.
22. Use `VisibilityChannelTestMatrix.requiredContinuityEvidenceRefs[]` to prove that embedded, recovery, and same-shell settlement routes fail closed when continuity evidence is stale, blocked, or missing.
23. Assert that record-launched actions preserve `RecordActionContextToken` and `RecoveryContinuationToken` through step-up, release drift, and same-shell recovery.
23A. Assert that patient shell return flows restore the same section, anchor, disclosure posture, and bounded recovery state from `PatientNavReturnContract`, `PatientRequestReturnBundle`, or `RecoveryContinuationToken` rather than from browser-history guesswork.
23B. Assert that request-list rows, request detail, and child-route return all resolve the same `PatientRequestLineageProjection`, `lineageTupleHash`, downstream ordering digest, and governed placeholder set; list or detail may not hide or reorder downstream lineage for the same request without an explicit recovery state.
23C. Assert that self-care advice, admin-resolution follow-up, request-detail downstream cards, and staff workspace side stages for the same request expose the same `SelfCareBoundaryDecision.boundaryTupleHash`, `decisionState`, `clinicalMeaningState`, and `operationalFollowUpScope`; copy-only differences are invalid.
23D. Assert that informational self-care surfaces keep admin follow-up controls frozen and that admin-resolution controls freeze in place when `boundaryReopenState != stable` or `clinicalMeaningState != bounded_admin_only`.
23E. Assert that record overview, result detail, document summary, attachment view, preview stage, and download affordance for the same record expose the same `PatientRecordArtifactProjection.parityTupleHash`, `RecordArtifactParityWitness`, `ArtifactParityDigest.authorityState`, and `ArtifactModeTruthProjection.currentSafeMode`; a verified summary may not silently drift from the current source artifact, release gate, or step-up fence.
23F. Assert that delayed-release, step-up, masking, or return-continuity drift demotes record artifact posture in place to provisional, source-only, placeholder, or recovery-only mode instead of leaving stale preview or download controls armed.
24. Assert that thread previews, unread badges, and composer affordances stay aligned with `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, and `ConversationCommandSettlement`; local acknowledgement must not clear authoritative pending state.
24A. Assert that thread list rows, callback cards, reminder notices, and the open composer all resolve the same `ConversationThreadProjection.threadId`, `ConversationSubthreadProjection.subthreadTupleHash`, `CommunicationEnvelope`, `receiptGrammarVersionRef`, and `threadTupleHash`; reminder delivery failure or callback fallback may not fork the patient into a detached communication surface while the same cluster remains current.
25. Assert that support replay exit, observe return, and support deep-link restore require `SupportReplayRestoreSettlement` before live controls re-arm, and that the restore evidence proves checkpoint hash, evidence-boundary hash, current mask scope, selected anchor tuple, held-draft disposition, and pending-external posture.
25A. Assert that support replay read-only fallback preserves replay breadcrumb, draft summary, and held repair chain whenever restore proof fails or disclosure scope narrows.
26. Assert that writable or calm posture appears only when `AudienceSurfaceRouteContract`, `surfacePublicationRef`, and `RuntimePublicationBundle` are all aligned for that audience and channel.
26A. Assert that `CanonicalObjectDescriptor`, `RouteFamilyOwnershipClaim`, `AudienceSurfaceRouteContract`, and `WorkflowSettlementBeacon` all agree on `requiredOwningBoundedContextRef` for the active route.
26B. Assert that contributor contexts remain observe-only, milestone-only, or governance-gated unless `requiredContextBoundaryRefs[]` explicitly declare a legal cross-context seam; undeclared sibling-context mutation must fail closed.
26C. Assert that booking and appointment-manage routes expose actions only from the current `BookingCapabilityProjection` or equivalent domain capability contract; supplier labels, cached entry state, or appointment-status shortcuts may not keep self-service, manage, or adapter-specific actions armed after tuple drift.
27. Assert that blocked, frozen, or downgraded routes render the declared `TransitionEnvelope`, `RouteFreezeDisposition`, or `ReleaseRecoveryDisposition` instead of generic error chrome.
28. Assert that document, record, appointment, calendar, print, and browser-handoff flows expose the required `ArtifactPresentationContract` and `OutboundNavigationGrant` before success-path assertions pass.
29. Assert that any visible assistive surface remains bound to `AssistiveSurfaceBinding`, the current `AssistiveCapabilityWatchTuple`, and the declared `AssistiveFreezeDisposition` inside the owning shell.
29A. Assert that assistive surfaces never widen from shadow to visible summary, visible insert, or governed commit posture unless the current `AssistiveCapabilityRolloutVerdict` for that route family, audience tier, and cohort slice resolves the exact rung and remains current.
30. Assert that PHI-adjacent state changes emit redacted `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence` evidence before traces, logs, or success receipts are accepted.
31. Assert that routes whose preview, artifact, or mutation ceilings differ across tiers or purposes use distinct `requiredCoverageRowRefs[]` and projection families rather than widening a shared payload after hydration.
32. Assert that timelines, receipts, communication digests, and artifact previews never exceed the declared `previewVisibility`, `artifactVisibility`, or `mutationAuthority` for the active row in `VisibilityChannelTestMatrix`.
33. Assert that acting-context and break-glass flows switch to dedicated `purposeOfUse`, `breakGlassState`, and audit-visible coverage rows before any deeper detail appears.
34. Assert that `ui.transition.server_accepted` or local acknowledgement never flips `WorkflowSettlementBeacon` into final success without `authoritativeOutcomeState = settled` plus the expected `authoritativeProofClass`, `projectionVisibilityRef`, and `auditRecordRef`.
35. Assert that shell restore, recovery, stale posture, and selected-anchor changes emit the declared redacted `UIEventEnvelope`, `UIEventCausalityFrame`, and `UIProjectionVisibilityReceipt` evidence under one stable `edgeCorrelationId` where the flow remains in the same continuity frame.
36. Assert that replay, reconnect, buffer flush, and restored-shell emissions surface `deliveryState = replayed | deduplicated` or the equivalent redacted causal marker rather than masquerading as fresh user activity.
37. Assert that `WritableEligibilityFence` and any operator action lease remain non-writable whenever `ReleaseTrustFreezeVerdict.surfaceAuthorityState != live`; stale trust rows, channel manifests, or watch-tuple fragments may not re-arm live controls locally.
38. Assert that degraded or constrained verdicts render the declared diagnostic-only or recovery posture for that audience instead of visually calm live surfaces with late blockers.
39. Assert that `QueueChangeBatch.preservedAnchorTupleHash` matches the pre-update `SelectedAnchor.anchorTupleHash`; reorder, refresh, and buffer flush tests must fail if the UI keeps focus but silently changes the underlying object.
40. Assert that refresh, reconnect, restore, and compare flows preserve the same selected, return, and compare anchor tuple hashes or surface an explicit invalidation or replacement stub before writable posture resumes.
40A. Assert that operations boards never render `commit_ready` while the current board tuple, `actionEligibilityFenceRef`, `actionLeaseState`, `deltaGateState`, and `returnValidationState` disagree; the same shell must remain visible with stale-reacquire or read-only recovery posture instead.
40B. Assert that governance shells never leave compile, approve, promote, or stabilize posture live when `GovernanceReviewPackage.reviewPackageHash`, `StandardsDependencyWatchlist.watchlistHash`, `baselineTupleHash`, `approvalTupleHash`, `watchTupleHash`, or the current release-freeze and guardrail tuple disagree; the same shell must remain visible with revalidation or bounded recovery posture instead.
40C. Assert that operations overview surfaces derive one dominant anomaly narrative from `OpsBoardPosture`, `OpsProminenceDecision`, and `AttentionBudget`; only `promotedSurfaceRef` may hold dominant visual emphasis and non-promoted abnormal surfaces must settle as declared secondary summaries.
40D. Assert that an active `OpsFocusProtectionFence` freezes resorting, dominant-surface swaps, highlight transfer, and auto-expand or collapse while the operator is hovered, keyboard-focused, comparing, composing, or investigating; live deltas may patch in place or buffer, but they may not steal focus.
40E. Assert that threshold jitter does not promote or demote an operations anomaly outside the current `OpsEscalationCooldownWindow`, and that `OpsMotionEnvelope`, causal copy, and reduced-motion or static equivalents agree on whether the board change came from live delta, threshold cross, batch apply, restore, degraded mode, or manual pin.
40F. Assert that every `ServiceHealthGrid` cell, its `HealthDrillPath`, and its `HealthActionPosture` resolve the same current `EssentialFunctionHealthEnvelope`; the cell may not look healthier, calmer, or more actionable than that envelope.
40G. Assert that time-bounded fallback, active channel freeze, constrained mitigation, degraded trust, or recovery-only posture render directly in the affected health cell and in `OpsStableServiceDigest.watchItems[]` or `guardedFunctionRefs[]`; stable-service posture may not collapse those states into decorative healthy signals.
40H. Assert that governance release-watch surfaces never render stable, applied, or rollback-ready posture unless `ReleaseWatchEvidenceCockpit.cockpitHash` matches the visible `PromotionWatchWindow`, current `WaveActionImpactPreview`, `WaveActionExecutionReceipt`, `WaveActionObservationWindow`, `WaveActionLineage`, `WaveActionSettlement`, publication parity, and rollback runbook readiness; accepted control intent alone must remain visibly non-authoritative.

Continuity-sensitive workflow families also need explicit matrix coverage. When the relevant UI exists, Playwright coverage must prove:

- `DraftContinuityEvidenceProjection(controlCode = intake_resume)` governs autosave, resume, and rebind calmness for intake or secure-link draft flows
- patient shell continuity reuses one `PersistentShell` across `Home`, `Requests`, booking, records, messages, callback, pharmacy, and recovery routes through `PatientShellConsistencyProjection`, `PatientNavReturnContract`, and the relevant return bundle, preserving section, anchor, and quiet posture through refresh, deep link, step-up, and recovery
- `PatientRequestsIndexProjection`, `PatientRequestSummaryProjection`, `PatientRequestLineageProjection`, `PatientRequestDetailProjection`, and `PatientRequestReturnBundle` govern request-list lineage surfacing; downstream booking, callback, pharmacy, message, hub, repair, and record-follow-up branches must remain visible and ordered consistently between row, detail, and return
- `PatientExperienceContinuityEvidenceProjection(controlCode = more_info_reply)` governs respond-to-more-info calmness and same-shell recovery; cached question text or local draft state alone may not re-arm reply posture
- `PatientRecordArtifactProjection`, `ArtifactSurfaceBinding`, `ArtifactSurfaceFrame`, `ArtifactParityDigest`, `RecordArtifactParityWitness`, and `ArtifactModeTruthProjection` govern whether a patient record summary is verified, provisional, source-only, or recovery-only; overview, detail, preview, and file actions may not disagree on the active parity tuple or record-gate witness
- `SelfCareBoundaryDecision`, `SelfCareExperienceProjection`, `AdviceRenderSettlement`, `AdviceAdminDependencySet`, and `AdminResolutionExperienceProjection` govern whether a request is informational self-care, bounded admin-only follow-up, or clinician re-entry; patient cards, request detail, and staff side stages may not diverge on `boundaryTupleHash`, `clinicalMeaningState`, or `operationalFollowUpScope`
- `BookingContinuityEvidenceProjection(controlCode = booking_manage)` governs appointment-manage, waitlist-offer, and alternative-offer calmness
- `HubContinuityEvidenceProjection(controlCode = hub_booking_manage)` governs hub commit, confirmation-pending, and post-book-manage calmness
- `SupportContinuityEvidenceProjection(controlCode = support_replay_restore)` governs replay exit, observe return, support deep-link restore, mask-scope reacquire, held-draft restore, and awaiting-external support posture
- `GovernanceReviewPackage`, `StandardsDependencyWatchlist`, and `GovernanceReviewContext` govern config, access, communications, and release review posture; diff, impact, config simulation, communications simulation, standards blockers, continuity evidence, compile, approve, promote, and stabilize controls may appear only while the current `reviewPackageHash`, `watchlistHash`, `baselineTupleHash`, `approvalTupleHash`, `watchTupleHash`, and guardrail tuple still agree
- `ReleaseWatchEvidenceCockpit`, `PromotionWatchWindow`, `WaveActionImpactPreview`, `WaveActionExecutionReceipt`, `WaveActionObservationWindow`, `WaveActionLineage`, `WaveActionSettlement`, `OperationalReadinessSnapshot`, and `GovernanceEvidencePackArtifact` govern post-promotion watch, rollback readiness, and release handoff posture; watch surfaces may not imply live convergence, safe rollback, or export-ready evidence from accepted-only control state or mixed cockpit hashes
- `OpsActionEligibilityFence` governs anomaly intervention, compare resume, governance return, and stale-board reacquire posture for operations boards; `commit_ready` may appear only while the current board tuple, selection lease, delta gate, and return validation state still agree
- `OpsBoardPosture`, `OpsProminenceDecision`, `OpsMotionEnvelope`, `OpsFocusProtectionFence`, `OpsEscalationCooldownWindow`, and `AttentionBudget` govern operations anomaly prominence, dominant-action calmness, threshold-jitter hysteresis, and focus-protected live updates; local tile state or chart animation may not override the current shell decision
- `EssentialFunctionHealthEnvelope`, `ServiceHealthCellProjection`, `FallbackReadinessDigest`, `ReleaseGuardrailDigest`, `HealthDrillPath`, `HealthActionPosture`, and `OpsStableServiceDigest` govern service-health trust overlays, fallback sufficiency, freeze-constrained mitigation posture, and honest calm stable-service summaries; local tile styling or delayed side-panel warnings may not override that envelope
- `WorkspaceTrustEnvelope` governs human-review workspace writability, interruption pacing, and calm completion across staff, support, hub, governance, and ops workspaces; queue rows, task detail, interruption digest, assistive stage, and next-task or handoff posture may not outrun the current envelope
- `AssistiveCapabilityTrustEnvelope` governs assistive renderability, confidence posture, rollout posture, insert or regenerate actionability, and completion-adjacent assistive cues; model-return text, local badges, or rollout labels may not outrun the current envelope
- `BookingCapabilityProjection` governs booking-select, confirm, cancel, reschedule, reminder, and assisted-booking action exposure, linkage-required copy, and fallback promotion; patient and staff variants may widen only from the same current capability tuple
- `ReservationTruthProjection` governs held-versus-nonexclusive wording, hold countdown visibility, pending-confirmation reservation posture, and expired or superseded offer degradation across booking and waitlist surfaces
- `BookingConfirmationTruthProjection` governs booking-in-progress, confirmation-pending, reconciliation-required, booked-summary, reminder readiness, manage readiness, and receipt or export handoff posture across booking, request-detail, appointment-manage, and staff-assisted booking surfaces
- `AssistiveContinuityEvidenceProjection(controlCode = assistive_session)` governs visible assistive accept, insert, and regenerate posture
- `AssistiveCapabilityRolloutVerdict` governs whether assistive chrome is shadow-only, visible summary, visible insert, governed commit, observe-only, or blocked for the active route family and cohort slice; local flags or cached capability state may not widen beyond that verdict
- `WorkspaceContinuityEvidenceProjection(controlCode = workspace_task_completion)` governs task completion and next-task launch calmness
- `AccessibilitySemanticCoverageProfile`, `AutomationAnchorProfile`, `AccessibleSurfaceContract`, `KeyboardInteractionContract`, `FocusTransitionContract`, `AssistiveAnnouncementContract`, `FreshnessAccessibilityContract`, and `SurfaceStateSemanticsProfile` govern route-family semantic parity; landmark order, keyboard entry, announcement authority, degraded-state copy, and automation markers may not diverge across breakpoint, motion, or buffered-update states
- resumed review must open diff-first from one authoritative `EvidenceDeltaPacket`, keep superseded judgment context visible, and restore the last quiet support region after delta review resolves
- queue preview and next-task prefetch remain summary-first, cancellable, and snapshot-bound; they may not mint leases, clear changed-since-seen state, or open the next task without explicit operator launch
- queue, booking, and hub live-update suites must prove that selected row, slot, provider, and compare-target tuple hashes either remain stable across replay or degrade to explicit stale or replacement posture with the original anchor still visible
- `PharmacyConsoleContinuityEvidenceProjection(controlCode = pharmacy_console_settlement)` governs pharmacy release, reopen, close, and reconcile calmness

### Required Playwright coverage for any new major screen
Every major screen or flow should ship with:

- a happy-path end-to-end test
- a keyboard-only journey test
- an accessibility check
- an accessibility-semantic-coverage test proving the active `AccessibilitySemanticCoverageProfile` stays `complete` across reduced motion, `400%` zoom or host resize, `mission_stack` fold where applicable, and buffered live-update or replay posture
- at least one error/retry state test
- visual snapshot coverage for the core surface
- trace capture on retry or failure
- a same-object continuity test keyed by `PlaywrightContinuityFrame`
- a settlement-state test covering `WorkflowSettlementBeacon` transitions
- a visibility-and-channel test derived from `VisibilityChannelTestMatrix`
- a route-intent drift or stale-fence recovery test when the surface can mutate
- a release-freeze or assurance-trust downgrade test when the surface varies by channel or operational truth
- a continuity-evidence downgrade test when the surface derives writable, calm, or settled posture from same-shell continuity contracts
- a governance moving-baseline test when the screen can compile, approve, promote, or stabilize a governed package
- a governance release-watch cockpit test when the screen can widen, pause, resume, rollback, stabilize, or export a release-watch evidence pack
- an operations stale-action test when the screen can resume or launch operational interventions from a live board
- an operations anomaly-prominence arbitration test when the screen can elevate competing anomalies, batch-apply live deltas, or demote borderline thresholds on a live board
- an operations service-health overlay test when the screen renders essential-function health, fallback sufficiency, or freeze-constrained mitigation posture
- a live-delta pause/resume test when the surface uses subscriptions or board patching
- anchor-registry smoke coverage for the canonical surfaces used on that screen
- a patient-navigation digest test when the screen launches or summarizes cross-route patient work
- a record-continuation test when the screen can launch work from results, letters, documents, or other record-origin context
- a conversation receipt-and-settlement test when the screen renders message previews, unread state, or reply affordances
- a support replay-restore test when the screen can exit replay or investigation mode into live work
- an intake-resume continuity test when the screen offers autosave, secure-link resume, or governed rebind
- a booking-manage continuity test when the screen can cancel, reschedule, confirm, or accept waitlist or alternative offers
- a booking-capability projection test when the screen can search, confirm, cancel, reschedule, or hand off into assisted booking
- a reservation-truth projection test when the screen can show selected-slot, held, nonexclusive, pending-confirmation, or waitlist-offer urgency state
- a booking-confirmation-truth projection test when the screen can show booking in progress, confirmation pending, reconciliation required, booked summary, or gated manage or artifact readiness
- a workspace-trust-envelope test when the screen can scan queue work, open a task, buffer live deltas, or present next-task or handoff readiness
- an assistive-session continuity test when the screen exposes visible assistive suggestions, insertions, or regenerate controls
- an assistive-capability-trust-envelope test when the screen exposes visible assistive summary, confidence, insert, regenerate, export, or completion-adjacent posture
- a workspace-task-completion continuity test when the screen can settle work and launch the next task
- a pharmacy-console-settlement continuity test when the screen can release, reopen, close, or reconcile pharmacy work

### Best uses of Playwright in this project
Use Playwright to validate:

- intake form branching and state preservation
- triage decision flows
- booking provisional vs confirmed states
- hub alternative selection and bounceback handling
- pharmacy exception/reconciliation flows
- messaging state and channel changes
- role-specific permissions and visibility
- responsive behavior across compact, narrow, medium, expanded, and wide breakpoints, including 320 CSS px reflow, 400% zoom, host resize, and embedded safe-area variants
- same-object shell morphing across adjacent lifecycle states
- live board pause, inspect, and resume behavior under incoming deltas
- NHS App embedded capability downgrade and placeholder behavior

### Playwright-specific implementation guidance
- Prefer locator strategies based on role and accessible name.
- Use web-first assertions instead of fixed waits.
- Use trace viewer for debugging multi-step operational flows.
- Use screenshot comparisons for elite-level visual regression on high-value surfaces.
- Reuse authenticated state for realistic role-based testing.
- Where helpful, use component testing for complex bespoke UI primitives before full end-to-end assembly.
- Give canonical surfaces stable automation anchors: `CasePulse`, `StateBraid`, `DecisionDock`, `QueueLens`, `InlineSideStage`, and `SelectedAnchor` states must be easy to locate and verify without brittle selectors.
- Add consistency checks for blocked or stale states so tests can prove the shell froze unsafe CTAs instead of rendering contradictory reassurance.
- Assert `PlaywrightContinuityFrame.readyMarkerRef` and continuity anchors before comparing adjacent states of the same object.
- Assert `PlaywrightContinuityFrame.routeIntentRef`, release-freeze, and channel-freeze posture whenever a route can mutate or degrade in place.
- Assert `PlaywrightContinuityFrame.continuityEvidenceState` and linked evidence contract whenever the route's calm or writable posture depends on same-shell continuity proof.
- Version and review `AutomationAnchorRegistry` changes alongside UI work so locator drift is intentional and traceable.
- Prefer assertions on `WorkflowSettlementBeacon` over incidental text or toast timing when testing mutation flows.
- Inspect `WorkflowSettlementBeacon.commandSettlementRecordRef`, trust state, `experienceContinuityEvidenceRef`, and CTA freeze posture before accepting any success-path assertion.
- Use `LiveDeltaHarnessWindow` to validate buffered deltas, rebase policy, and resume markers on subscription-driven surfaces.
- Use `VisibilityChannelTestMatrix` to generate or review the minimum audience, release-freeze, assurance-trust, continuity-evidence, and embedded-channel coverage for any route that varies by trust, bridge capability, placeholder contract, or same-shell recovery contract.
- Assert `CompressionFallbackPlan`, sticky-action clearance, compare fallback mode, and selected-anchor preservation through rotate, zoom, host resize, and `mission_stack` fold transitions.
- Assert `SelectedAnchor.anchorTupleHash`, `replacementAnchorRef`, and invalidation-stub posture directly on live-update flows instead of inferring continuity from unchanged labels or focus rings.
- Assert support replay restore against `SupportReplayRestoreSettlement`, not browser-back behavior: checkpoint hash, evidence-boundary hash, mask scope, draft-hold disposition, and held mutation chain must all agree before a resend, reissue, or identity-correction CTA becomes writable again.

## Deliverables Expected from Any UI/UX Proposal
Any future UI proposal should include:

1. design concept name and rationale
2. information architecture
3. primary user roles and screen priorities
4. layout blueprint per major workspace
5. component inventory with states
6. interaction and motion rules
7. accessibility notes
8. content strategy and naming patterns
9. Playwright validation plan
10. notes on where the UI intentionally differs from generic enterprise patterns
11. attention budget and quiet-return rules per major screen
12. published route, publication, and runtime-bundle posture for each major interactive surface
13. declared transition, freeze, and recovery posture for each major mutation or same-object journey
14. artifact-handoff and telemetry-disclosure notes for any screen that emits documents, exports, external navigation, or assistive output
15. selected `VisualTokenProfile`, `SurfaceStateSemanticsProfile`, and `ArtifactModePresentationProfile` for every major shell, breakpoint-sensitive surface, and artifact-bearing route
16. automation-anchor map and telemetry binding plan for every critical route, including breakpoint, artifact, and recovery transitions
17. contrast, focus, component-rhythm, and token-role mapping notes for shell, card, rail, drawer, form, list, and table surfaces

## Linked blueprint
Use this skill alongside `design-token-foundation.md`, `canonical-ui-contract-kernel.md`, and `ux-quiet-clarity-redesign.md` when evaluating whether a proposed screen is calm by default but still operationally rich under blocker, compare, reopen, artifact, and responsive-breakpoint conditions.

## Final Standard
The bar is not “clean” or “modern.”
The bar is:

- unmistakable identity
- rapid comprehension under load
- safe decision support
- elegant handling of ambiguity
- frictionless expert operation
- accessibility by default
- and interfaces whose critical behavior can be reliably proven in Playwright

Design Vecells like a **living operational atlas**: a system where every case is navigable, every decision is contextualized, and every important interaction is both beautiful and verifiable.
