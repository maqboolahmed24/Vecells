# `par_157` Quiet Autosave Status Strip

`par_157` freezes one shell-level save truth owner for the Phase 1 intake shell: [AmbientStateRibbon](/Users/test/Code/V/apps/patient-web/src/patient-intake-status-components.tsx). It is the only place allowed to express autosave calmness, merge review, or continuity recovery at shell scope.

## Contract

- Visible states are exactly `saving`, `saved`, `review changes`, and `resume safely`.
- The ribbon does not read raw request timing. It reads the frontend save-truth adapter from [use-draft-save-truth.ts](/Users/test/Code/V/apps/patient-web/src/use-draft-save-truth.ts), which in turn arbitrates `DraftSaveSettlement`, `DraftContinuityEvidenceProjection`, `DraftMergePlan`, `DraftRecoveryRecord`, and current shell context.
- `saved` is withheld unless settlement parity and continuity parity both hold:
  - `ackState == saved_authoritative`
  - `continuityState == stable_writable`
  - `sameShellRecoveryState == stable`
  - `latestSettlementRef == settlementId`
  - `authoritativeDraftVersion` parity remains intact

## Mapping

- `saving`: local edits are queued, a debounce is running, or `ackState = local_ack`.
- `saved`: the authoritative settlement exists and the continuity tuple still trusts it.
- `review changes`: `ackState = merge_required` or an open `DraftMergePlan` is present.
- `resume safely`: recovery is required, the lease has expired, continuity is blocked, or saved posture must be suppressed.

## UI Law

- The strip remains directly under the masthead and never turns into a toast or a banner stack.
- The left cluster owns the state mark and label.
- The center cluster owns deduplicated detail text and the only shell-level live region.
- The right cluster owns a single meaningful action only when the shell needs it.

## Hard-Exit Warnings

- Warnings appear only when there is truthful unsynced or blocked continuation work.
- They are suppressed for stable authoritative saved posture and neutral first boot.
- The runtime exposes this through `data-hard-exit-warning` and `data-warn-on-hard-exit` so the browser proof can assert the warning law without relying on browser-specific dialogs alone.

## Boundaries

- No generic loader farm.
- No duplicate save truth in helper regions.
- No shell ejection for merge or recovery.
- No “Saved” claim on fast network success without settlement and continuity proof.
