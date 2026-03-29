# UX quiet clarity redesign strategy

## Purpose

Evaluate the current Vecells blueprint through the lens of cognitive clarity, minimalist aesthetics, and friction removal, then translate the resulting design strategy into enforceable front-end algorithm changes.

## Executive diagnosis

The repository already has unusually strong foundations for continuity, trust, causality, and real-time stability. The main remaining UX risk is not missing capability but **attention saturation**. The current blueprint allows rich primitives such as `CasePulse`, `StateBraid`, `EvidencePrism`, `DecisionDock`, `ContextConstellation`, queue metadata, assistive suggestions, and live delta cues to coexist without a strict enough admission control model. Without that control, the experience can drift from calm operational instrument to expert-only density.

### Current strengths worth preserving

- stable shell continuity and object permanence
- explicit freshness, trust, and lineage semantics
- list-first thinking and progressive disclosure principles
- strong async acknowledgement and selected-anchor preservation
- clear avoidance of generic enterprise dashboard patterns

### Primary confusion vectors to remove

1. **Too many simultaneous focal regions.** The platform can still place history, evidence, context, and action surfaces in competition with the current task.
2. **Quiet mode is defined but not budgeted.** `clarityMode` exists, but the blueprint did not fully specify how many surfaces may be promoted at once or which one wins.
3. **Support surfaces can over-escalate.** Evidence, chronology, AI assistance, and contextual policy notes all have legitimate value, but not all at the same time.
4. **Status duplication can reappear at runtime.** The design prohibits duplicate status chrome, but the rendering algorithm needed a stronger suppression rule.
5. **Edge cases preserve context but not always quiet posture.** After blocker resolution, conflict review, or compare work, the shell needs an explicit return-to-calm rule.
6. **Rapid async change can still create support-region thrash.** Under live deltas, stale rechecks, or compare moments, the current contract needed explicit hysteresis so the promoted region does not swap every few seconds.
7. **Phase-level docs still permit legacy high-noise patterns.** Some downstream blueprints still describe wizard-first intake, banner-first escalation, or page-like booking separation that undermines the quieter shell law.

## Redesign concept

Name: **Signal Atlas Quiet / Mission Frame**

Mission Frame turns each surface into a single, legible operating moment. The interface should answer four questions in order:

1. What am I looking at?
2. What changed that matters?
3. What is the safest next action?
4. What extra detail is available if I need it?

Anything that does not help answer one of those questions should stay collapsed, summary-level, or hidden until requested.

## Design principles applied

### 1. Attention budget over feature density
Every shell gets an explicit budget for how many support regions may be promoted simultaneously. The default budget is one primary work region plus one promoted support region at most.

### 2. Progressive disclosure by consequence
Surface the detail required for the next safe decision, not all possible detail. Evidence expands before history when trust is blocking. History expands before context when chronology changed. Context opens only when policy, linkage, or blocker resolution requires it.

### 3. Object permanence before cleverness
Selected items, pending actions, and invalidated options remain visible in place long enough to preserve causality and reduce mental reset cost.

### 4. List-first, compare-by-intent
Lists and tables remain the default operational surfaces. Rich comparison modes are explicit user choices, not the resting state.

### 5. Interruptibility-aware real-time behavior
Live updates must respect composition, reading, compare, and decision moments. Changes queue quietly, then settle in an order that protects the active region first.

### 6. Calm error and blocker handling
Errors, stale state, conflicts, and disconnects should not explode the layout. They should tighten focus onto the single region that now needs attention.

### 7. Semantic motion with minimal amplitude
Motion explains reveal, morph, pending, diff, reopen, and degrade states. It never substitutes for structure.

### 8. Accessibility and automation as structural constraints
Low-noise UI must remain fully navigable by keyboard, explicit in the DOM, and stable under Playwright assertions.

## Conceptual redesign strategy

### A. Essential shell composition
The default shell should render only:

- `CasePulse`
- one shared status strip
- one primary work region
- one `DecisionDock`

`StateBraid`, `EvidencePrism`, `ContextConstellation`, and assistive surfaces remain collapsed or summary-level unless the attention budget promotes one of them.

### B. Deterministic promotion rules
Only one support region may auto-promote at a time. Promotion priority:

1. blocker or trust conflict -> `EvidencePrism`
2. reopen or materially changed chronology -> `StateBraid`
3. active compare task -> bounded comparison side stage
4. safe-action policy dependency -> context drawer
5. assistive review -> assistive side stage only when requested or directly under review

### C. Status-noise suppression
All save, sync, freshness, pending, and review-required signals must be deduplicated before render. The shared status strip owns shell-level feedback. Local control acknowledgement stays local. Banners are reserved for truly blocking or urgent states.

### D. Quiet return behavior
After blocker resolution, compare completion, or conflict acknowledgement, the shell must fall back to the last user-approved quiet posture unless the user explicitly pinned a richer view.

### E. Minimalist form and conversation behavior
Patient flows expand one question, one short rationale, and one next action at a time. Conversation surfaces keep either the active composer or the latest relevant history cluster expanded in essential mode, not both.

### F. Staff and support workspace simplification
When a case is active, the review canvas becomes dominant. Secondary queue summaries, board widgets, and AI rails collapse to slim indices, tabs, or stubs until requested.

Support work follows the same rule. The active ticket timeline and the current response or recovery action own the center of the screen. Knowledge, subject history, replay, and policy surfaces may exist, but only one of them may auto-promote at a time; the rest stay in a single quiet contextual rail.

## Edge-case handling rules

### Live invalidation while a user is deciding
Keep the selected anchor visible, mark it invalidated, explain the reason inline, and show nearest safe alternatives without removing the original choice first.

### Stale or disconnected state
Freeze the last stable shell, downgrade freshness in the shared status strip, disable only actions that require fresh truth, and preserve draft input.

### New evidence during active review
Compute diff against the last acknowledged snapshot, mark review as `review_required`, and promote only the changed evidence region. Do not auto-scroll or open multiple panels.

### Permission expansion or contraction
Reveal or hide only the affected regions. Preserve shell continuity and working context whenever the continuity key stays the same.

### Duplicate or same-episode submission
Preserve lineage and explain whether the action is a retry, continuation, or new work. Do not create parallel shells for what users perceive as the same request.

### Empty and sparse states
Every empty state must explain why nothing is shown, what usually appears here, and the fastest safe next action.

## Translation into algorithm changes

The redesign is implemented by the patch set in this repository through six architectural shifts:

1. Add an explicit `AttentionBudget` contract to the shell model.
2. Extend `CognitiveLoadGovernor` so it chooses the single support region that may auto-promote.
3. Add attention-budget and status-suppression algorithms to the canonical rendering rules.
4. Add promotion hysteresis and status-cue cooldowns so live deltas cannot keep re-shuffling the interface during composition, comparison, or confirmation moments.
5. Tighten patient, staff, booking, and comparison algorithms so calm defaults remain enforced even under blocker, compare, and real-time edge states.
6. Replace wizard-style and banner-first patterns in phase blueprints with stable mission-frame child states that preserve one dominant question and one dominant action.

## Validation expectations

The redesign should ship with Playwright coverage for:

- quiet default render of patient, review, queue, and booking shells
- blocker-driven promotion of exactly one support region
- return-to-quiet after blocker resolution
- duplicate-status suppression across strip, banner, and local control states
- no support-region thrash while the user is typing, comparing, or confirming
- non-blocking pending and stale states staying inline or in the shared status strip rather than escalating to full-width banners
- invalidated anchor preservation during live changes
- keyboard-only operation across collapsed and promoted regions
