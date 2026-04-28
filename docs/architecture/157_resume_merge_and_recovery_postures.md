# `par_157` Resume, Merge, And Recovery Postures

The Phase 1 intake shell keeps refresh, cross-session conflict, lease expiry, and stale-continuity work inside the same shell. `par_157` publishes three bounded surfaces for that law.

## Continue Your Request

[ContinueYourRequestCard](/Users/test/Code/V/apps/patient-web/src/patient-intake-status-components.tsx) is the landing-entry recovery surface.

- It shows one last meaningful update time.
- It shows one current step label.
- It tells the user what will happen on resume in one sentence.
- It keeps a single dominant continue action and a quiet, policy-bound `Start again`.

## Merge Review

[MergeReviewSheet](/Users/test/Code/V/apps/patient-web/src/patient-intake-status-components.tsx) resolves `merge_required` in place.

- It never ejects to a detached conflict modal.
- It groups differences by:
  - answer fields
  - attachments
  - resume position
- Each row shows:
  - your recent local value
  - the newer server value
  - the selected result
  - the reason when the system preselects one

## Recovery Bridge

[RecoveryBridgePanel](/Users/test/Code/V/apps/patient-web/src/patient-intake-status-components.tsx) is the bounded same-shell recovery surface.

- It preserves the last safe summary, route, and selected anchor when allowed.
- It gives one concise explanation and one dominant next-safe action.
- It lists what was kept so the user knows recovery did not silently discard context.

## Preserved Context

For same-lineage resume and recovery, the shell preserves or restores:

- current step
- selected anchor
- focused field-group intent when the field still exists
- scroll position when the route remains within the same shell

These behaviors are wired through [use-draft-save-truth.ts](/Users/test/Code/V/apps/patient-web/src/use-draft-save-truth.ts) and the mission-frame hydration path in [patient-intake-mission-frame.tsx](/Users/test/Code/V/apps/patient-web/src/patient-intake-mission-frame.tsx).

## Post-Promotion Boundary

When a draft has already promoted into a request, the shell does not reopen a mutable draft. The recovery posture shifts into a same-lineage redirect, consistent with `par_154`, and the dominant action becomes the lawful request route instead of a generic continue/start-over affordance.
