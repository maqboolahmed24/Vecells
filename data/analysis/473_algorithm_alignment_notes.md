# Task 473 Algorithm Alignment Notes

- Task 473 treats the 472 scorecard as prior authority and does not mutate it in place.
- The authoritative output is `deferred` because the future channel-enable authority from task 486 and launch/signoff evidence from tasks 476, 477, 481, 482, and 483 are not yet available.
- The local Phase 7 exit gate remains useful evidence, but it is not external NHS App live-channel approval and cannot override missing activation authority.
- The row patch keeps `phase_7_deferred_nhs_app_channel_scope` as `deferred_scope` for the current core release; exact and blocked examples are generated for tests and UI state coverage.
- Hashes use stable sorted JSON and include the 472 scorecard hash, Phase 7 row hash, blockers, route coverage rows, and source/proof file hashes.
