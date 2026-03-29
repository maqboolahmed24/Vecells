# UI/UX Design Skill for Vecells

## Mission
Design Vecells as an **operational instrument**, not a generic dashboard, CRM, or form app. The interface must make invisible workflow state visible so users can instantly understand:

- what is happening
- what is blocked
- who owns it
- what evidence supports it
- what action is safest and fastest next

The product spans intake, identity, safety review, triage, booking, network coordination, pharmacy coordination, and communications. The UI must therefore feel like a **continuous case system** rather than a collection of unrelated screens.

## Design Philosophy
Create a bespoke visual language called **Signal Atlas Quiet**.

Signal Atlas Quiet should feel:

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

## Core Experience Principles

### 1. Show causality, not just status
Every important object should reveal its lineage: origin, evidence, decisions, dependencies, and pending confirmations.

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
Local panels may be information-rich, but the full page must maintain rhythm, separation, and visual rest.

### 6. Evidence before commitment
Any irreversible or externally consequential action must surface confidence, source quality, and downstream consequences before confirmation.

### 7. Keyboard-first professionalism
The experience should be fast for expert operators who navigate with keyboard, search, command palettes, and quick actions.

### 8. Edge-case integrity
Conflict, invalidation, stale data, connection loss, and reopen flows must become calmer and clearer, not visually louder. Failure handling should preserve context first and introduce more detail only as needed.

## Overarching Design Language

### Visual identity
Use a restrained base palette with luminous semantic accents.

- Base surfaces: mineral, graphite, bone, fog, slate
- Semantic accents: signal cyan, triage amber, resolution violet, confirmation green, exception coral
- Use color as a **secondary** channel, never the only one; pair it with iconography, labels, outline treatment, texture, or motion

### Geometry
Adopt a **hybrid precision grid**:

- macro layout: fixed screen regions
- local layout: modular 8/16px rhythm
- dense data areas: tighter internal grid for alignment discipline
- high-value actions: larger hit area and stronger contrast edge

### Typography
Typography should feel editorial and operational at once.

- headlines: compressed, high-clarity, slightly technical
- body: neutral, highly legible, modest line length
- metadata: uppercase micro-labels only when they improve scanning
- numbers, times, dates, and IDs: tabular and alignment-friendly

### Motion
Motion must explain system behavior.

- soft directional motion for state progression
- pulse only for truly live or expiring events
- no ornamental looping animation
- transitions should communicate ownership changes, lock states, new evidence, or queue movement

## Conceptual Layout Strategy
Use an **adaptive focus layout**.

- patient and lightweight flows default to a **focus frame**
- staff, hub, and support work default to a **two-plane split**
- **three-plane** composition is reserved for comparison-heavy or conflict-heavy moments only
- tablet and mobile default to a **stacked mission layout**

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
Purpose: manage referral dispatch, response, fulfillment, and outcome ambiguity.

Unique characteristics:

- **Chain-of-custody braid** visualizing dispatch attempts, acknowledgements, exceptions, and confirmations
- **Outcome confidence meter** showing whether the current state is provisional, confirmed, disputed, or reconciled
- **Exception lanes** for urgent returns, substitutions, missing stock, or message failures
- **Escalation ladder** that reveals what auto-retry, human callback, or supervisor review will happen next

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

### Status Strip
A single quiet line for:

- save state
- sync and freshness state
- waiting-on-external confirmation
- queued live updates
- review-required blockers

The strip should merge routine trust and progress signals into one place. Do not duplicate the same status in separate banners, chips, and toasts unless the state is urgent or blocking.

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

### Inline Side Stage
When a row, event, or candidate is opened, it should expand into a **side stage** instead of a page switch or modal stack.

Benefits:

- preserves context
- supports compare-and-decide flows
- reduces navigation memory burden
- enables quick back-to-back review

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

All bespoke interactions must remain understandable with keyboard, screen reader, zoom, and low-vision workflows.

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
- Mark as awaiting external acknowledgement
- Reopen booking case
- Send pharmacy follow-up

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

### Required Playwright coverage for any new major screen
Every major screen or flow should ship with:

- a happy-path end-to-end test
- a keyboard-only journey test
- an accessibility check
- at least one error/retry state test
- visual snapshot coverage for the core surface
- trace capture on retry or failure

### Best uses of Playwright in this project
Use Playwright to validate:

- intake form branching and state preservation
- triage decision flows
- booking provisional vs confirmed states
- hub alternative selection and bounceback handling
- pharmacy exception/reconciliation flows
- messaging state and channel changes
- role-specific permissions and visibility
- responsive behavior across breakpoints

### Playwright-specific implementation guidance
- Prefer locator strategies based on role and accessible name.
- Use web-first assertions instead of fixed waits.
- Use trace viewer for debugging multi-step operational flows.
- Use screenshot comparisons for elite-level visual regression on high-value surfaces.
- Reuse authenticated state for realistic role-based testing.
- Where helpful, use component testing for complex bespoke UI primitives before full end-to-end assembly.

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

## Linked blueprint
Use this skill alongside `ux-quiet-clarity-redesign.md` when evaluating whether a proposed screen is calm by default but still operationally rich under blocker, compare, and reopen conditions.

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
