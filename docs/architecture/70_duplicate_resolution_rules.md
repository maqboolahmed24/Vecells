# 70 Duplicate Resolution Rules

## Fail-closed rules
- `same_request_attach` requires explicit continuity witness.
- `same_episode_candidate` never settles by itself.
- Pairwise candidate edges are not transitive proof.
- Low candidate margin, high uncertainty, or hard blockers force `review_required`.
- Unresolved duplicate review remains closure-blocking until a later `DuplicateResolutionDecision` settles it.

## Settlement classes
- `exact_retry_collapse` returns the prior accepted request shell.
- `same_request_attach` reuses the same request only when witness-backed continuity is explicit.
- `same_episode_link` keeps work in the same episode but not as the same request.
- `related_episode_link` preserves lineage relationship without same-request reuse.
- `separate_request` records that the candidate window was inspected and rejected.
- `review_required` keeps the ambiguity explicit and operator-visible.

## Supersession rules
- A later decision may supersede an earlier review-required posture.
- Reversal must create or reference new decision truth. It may not rewrite lineage history in place.
- Supersession history must remain visible in both the machine-readable manifest and the workbench history table.

## Simulator contract
The simulator path freezes the same pair-evidence and cluster contracts production will use later. Live calibration may update model versions or threshold refs, but it may not bypass explicit `DuplicateResolutionDecision` or continuity witness requirements.
