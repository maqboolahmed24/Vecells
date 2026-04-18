# 256 Queue Workboard Preview And Anchor Spec

Task: `par_256_phase3_track_Playwright_or_other_appropriate_tooling_frontend_build_queue_workboard_preview_pocket_and_selected_anchor_preservation`

## Scope

This slice replaces the placeholder queue rail with one real Phase 3 workboard inside the existing `/workspace*` shell.

Production components:

- `QueueWorkboardFrame`
- `QueueToolbar`
- `QueueRow`
- `QueuePreviewPocket`
- `QueueScanManager`
- `QueueAnchorStub`
- `QueueChangeBatchBanner`

## Workboard law

The workboard consumes authoritative queue truth from one committed `QueueWorkbenchProjection` plus one bound `QueueScanSession`, `QueuePreviewDigest`, and `QueueChangeBatch`.

The UI does not sort locally.
The UI may filter or search the rendered lane, but the canonical order still comes from the committed queue snapshot.

## Scan and open grammar

- hover or focus opens `preview_peek` after dwell
- single click pins preview as `preview_pinned`
- explicit open stays on the row action or preview pocket action
- keyboard parity:
  - `ArrowUp` / `ArrowDown` move the selected anchor
  - `Space` pins preview
  - `Enter` opens the selected task

This closes the old accidental-open behavior where row click immediately navigated.

## Row grammar

Resting rows stay two-line only:

1. primary line: patient label + concise reason
2. secondary line: due, age, freshness
3. right cluster: changed chip, rank chip, state note, explicit open

Tertiary explanation and consequence detail stay out of the resting row and move into the preview pocket.

## Preview pocket

`QueuePreviewPocket` is summary-first and read-only:

- reason summary
- delta summary
- ownership digest
- next action digest
- attachment availability digest

It does not mint lease state, clear changed-since-seen, or hydrate heavy media.

## Batch and anchor behavior

`QueueChangeBatchBanner` is the only surface for disruptive queue reorder.

- before apply, the source snapshot order remains live
- after apply, the target snapshot order becomes visible
- the selected anchor stays pinned through the transition

If the selected row is filtered, searched away, reassigned, moved to another lane, or leaves the lane entirely, `QueueAnchorStub` preserves the last safe anchor and offers the nearest safe reacquire path.

## Same-shell continuity

The queue remains visible when a task is open.
Opening a task changes the primary pane, not the route family shell.

The queue workboard depends on the root shell contract from `255`:

- one `workspaceShellContinuityKey`
- one selected anchor source of truth
- one shared status strip
- same-shell recovery rather than detached queue/task page types

## Current seam

`256` provides the real queue workboard, preview pocket, and anchor continuity.
The full task canvas, `CasePulse`, `DecisionDock` depth, and attachment/thread detail still deepen in `257` to `259`.
