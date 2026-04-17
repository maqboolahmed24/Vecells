# 166 Duplicate Submit, Refresh, Replay, And Collision Review Suite

This proof pack verifies the Phase 1 unhappy path where the same patient or transport path attempts to submit twice, refresh before settlement, reuse stale draft state, or replay notification work. The suite binds to the real command-api intake submit, promotion, replay-collision, duplicate-review, draft supersession, and confirmation-dispatch seams.

## Evidence Files

| Artifact                                                         | Purpose                                                                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `data/test/166_submit_replay_cases.csv`                          | Exact replay, semantic replay, concurrent double tap, refresh, auth-return, and notification replay cases.                         |
| `data/test/166_collision_review_cases.csv`                       | Collision-review and duplicate-branch classifications including `same_request_attach`, `same_episode_link`, and `review_required`. |
| `data/test/166_stale_resume_and_promotion_cases.csv`             | Post-promotion stale tab, stale token, late PATCH, and missing-lease recovery cases.                                               |
| `data/test/166_expected_idempotency_and_side_effect_counts.json` | Machine-readable side-effect deltas and global invariants.                                                                         |
| `docs/tests/166_replay_collision_lab.html`                       | Browser-visible proof surface named `Replay_Collision_Lab`.                                                                        |
| `tools/test/validate_replay_and_collision_suite.py`              | Drift validator for matrices, docs, lab parity markers, tests, and script wiring.                                                  |

## Mandatory Gap Closures

| Gap                                            | Closure                                                                                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Double submit can still win a race             | `SUB166_CONCURRENT_DOUBLE_TAP` runs two submits concurrently and asserts one request, one promotion, one safety decision, one triage task, and one confirmation envelope.       |
| Collision review is backend-only               | `COL166_SOURCE_COMMAND_CHANGED_ATTACHMENT` and `COL166_TRANSPORT_CHANGED_ATTACHMENT` assert explicit `collision_review_open` settlements and lab-rendered bounded explanations. |
| Stale tabs after promotion are harmless        | `STALE166_BACKGROUND_AUTOSAVE_AFTER_PROMOTION` and `STALE166_LATE_PATCH_SUPERSEDED_LEASE` assert `recovery_required`, blocked mutating resume, and no calm saved cue.           |
| Replay classes are test language only          | The CSV matrices and JSON count model enumerate expected decision classes, settlement states, and side-effect deltas.                                                           |
| Notification replay can duplicate side effects | `SUB166_NOTIFICATION_JOB_REPLAY` requeues the real confirmation chain and asserts the existing envelope and bridge are reused.                                                  |

## Exactly-Once Assertions

Every replay case asserts concrete side-effect counts, not logs:

| Side effect             | Exact replay                 | Semantic replay              | Concurrent double tap   | Collision review       | Stale post-promotion patch | Notification job replay  |
| ----------------------- | ---------------------------- | ---------------------------- | ----------------------- | ---------------------- | -------------------------- | ------------------------ |
| Request creation        | `0` delta after first commit | `0` delta after first commit | total `1`               | `0` delta              | `0` delta                  | `0` delta                |
| Promotion record        | `0` delta                    | `0` delta                    | total `1`               | `0` delta              | `0` delta                  | `0` delta                |
| Safety execution        | `0` delta                    | `0` delta                    | total `1`               | `0` request-side delta | `0` delta                  | `0` delta                |
| Triage task             | `0` delta                    | `0` delta                    | total `1`               | `0` delta              | `0` delta                  | `0` delta                |
| Notification dispatch   | `0` delta                    | `0` delta                    | total `1`               | `0` delta              | `0` delta                  | existing envelope reused |
| Patient-visible outcome | one authoritative shell      | one authoritative shell      | one authoritative shell | bounded review shell   | same-shell recovery        | one receipt bridge       |

## Browser Proof

The lab proves the same semantics in the patient-visible language:

- `lineage_braid_mark` identifies the governed lineage surface.
- `lineage-braid`, `settlement-ladder`, and `side-effect-counters` are synchronized by case selection.
- Every diagram has adjacent table parity.
- Reduced-motion rendering keeps the same case count and side-effect meaning.
- Mobile, tablet, and desktop layouts preserve one shell lineage and no horizontal overflow.
