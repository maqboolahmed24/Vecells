# 166 Promotion And Resume Blocking Matrix

| Case                                            | Trigger                                                | Expected authority  | Target intent                 | Mutating resume | Save ack            | Calm saved visible | Same shell |
| ----------------------------------------------- | ------------------------------------------------------ | ------------------- | ----------------------------- | --------------- | ------------------- | ------------------ | ---------- |
| `STALE166_BACKGROUND_AUTOSAVE_AFTER_PROMOTION`  | Background autosave after submit promotion             | `recovery_only`     | `resume_recovery`             | `blocked`       | `recovery_required` | false              | true       |
| `STALE166_LATE_PATCH_SUPERSEDED_LEASE`          | Foreground tab PATCH using old promoted lease or token | `recovery_only`     | `resume_recovery`             | `blocked`       | `recovery_required` | false              | true       |
| `STALE166_STALE_RESUME_TOKEN_REDIRECT`          | Refresh with stale promoted draft token                | `request_redirect`  | `open_request_receipt`        | `blocked`       | `not_applicable`    | false              | true       |
| `STALE166_STALE_SUBMIT_AFTER_PROMOTION`         | Replayed submit from a stale promoted tab              | `request_redirect`  | `authoritative_request_shell` | `blocked`       | `not_applicable`    | false              | true       |
| `STALE166_PRE_PROMOTION_MISSING_LEASE_RECOVERY` | Submit with missing lease before promotion             | `recovery_required` | `resume_recovery`             | `blocked`       | `recovery_required` | false              | true       |

## Bounded Patch Record

No core algorithm patch was required for this task. The current implementation already:

- serializes submit through `repositories.withPromotionBoundary`;
- resolves replay and collision through `ReplayCollisionAuthorityService`;
- supersedes draft leases and grants in `promoteEnvelope` plus `supersedeDraftForPromotion`;
- maps promoted draft route entry to the authoritative request shell;
- blocks late patches with `recovery_required` rather than `saved_authoritative`;
- reuses confirmation envelopes through `confirm_dispatch::<requestRef>::<receiptEnvelopeRef>`.

The new tests make those invariants executable and fail if a future change reopens mutable draft state or emits stale calmness after promotion.
