# 419 Diffable Note Draft And Bounded Insert Spec

Visual mode: `Assistive_Draft_Diff_Deck`

## Purpose

Task 419 adds the first real drafting surface inside the 418 assistive rail. The deck renders structured draft-note sections rather than a single generated blob. Each section owns its title, support line, clinician-readable before/after comparison, target insertion slot, patch-lease status, bounded insert bar, and any known blocked reason before the user can attempt insertion.

## Rail Integration

The deck is mounted by `AssistiveRailShell` when the staff workspace route includes an `assistiveDraft` fixture. The host rail, complementary landmark, collapse control, summary stub, shadow or observe panel, selected-anchor attributes, and provenance footer remain stable.

Supported fixtures:

- `assistiveDraft=insert-enabled`: live insertion point and live patch lease.
- `assistiveDraft=insert-blocked-slot`: stale or superseded slot and selected-anchor drift.
- `assistiveDraft=insert-blocked-session`: stale session, decision epoch drift, publication drift, and trust posture drift.
- `assistiveDraft=compare-open`: compare view starts open.
- `assistiveDraft=compare-closed`: after view starts closed.
- `assistiveDraft=narrow-stacked`: same data as compare-open, used for narrow viewport proof.

## Component Contract

- `AssistiveDraftSectionDeck` owns the section list, deck references, visual mode, and keyboard navigator.
- `AssistiveDraftSectionCard` owns one draft section with independent compare and insert state.
- `AssistiveDraftDiffBlock` renders clinical wording comparisons using labels such as Keep, Add, and Clarify instead of source-code diff marks.
- `AssistiveTargetSlotPill` exposes the live insertion target, content class, slot state, and slot hash tooltip.
- `AssistivePatchLeaseStatus` shows lease, session, and fence state from 412-style truth.
- `AssistiveBoundedInsertBar` exposes one explicit `Insert in shown slot` button, disabled unless the slot and lease are live.
- `AssistiveInsertBlockReason` renders known stale slot, stale session, selected-anchor, decision epoch, publication, or trust drift before click.
- `AssistiveDraftKeyboardNavigator` supports ArrowUp, ArrowDown, Home, and End across section cards.

## Layout

The prompt proposed 14px card radius, but the existing staff shell and 418 rail use restrained 8px radii. This implementation keeps 8px for local design-system consistency while preserving the required 16px section-card padding, 12px card gap, 20px minimum diff-line height, 56px sticky insert bar, 220px target-slot pill max width, and a 432px compare-expanded rail width on large desktop.

Narrow viewports stack compare columns inside the same assistive rail or sheet context. The deck does not create a second rail, modal, or hidden editor target.

## Authority Rules

- Browser focus is never insertion authority.
- Client code may render and narrow actionability, but may not widen insert legality.
- Insert requires a live `AssistiveDraftInsertionPoint`, live `AssistiveDraftPatchLease`, live session fence, current selected anchor, current decision epoch, current publication tuple, and trusted assistive posture.
- Failed or stale truth preserves draft text as read-only stale-recoverable context and freezes insert in place.
- Insert creates provisional draft text only; final note or clinical decision settlement remains a human workflow action.

## Motion And Accessibility

Section state changes use 120ms opacity and border transitions, compare toggle changes use 140ms transitions, insert-bar state changes use 100ms color and opacity transitions, and `prefers-reduced-motion` removes non-essential transitions. The deck uses headings, named groups, visible button labels, `aria-live` insert feedback, visible blocked reasons, and deterministic Playwright ARIA snapshots.
