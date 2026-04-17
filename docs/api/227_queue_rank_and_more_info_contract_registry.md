# 227 Queue Rank And More-Info Contract Registry

Task: `seq_227`

Primary registry: `data/contracts/227_queue_constants_and_threshold_registry.yaml`

## Queue contract family

| Contract | Role |
| --- | --- |
| `QueueRankPlan` | Versioned formula, threshold, fairness, overload, and explanation policy |
| `QueueRankSnapshot` | Canonical queue-order cut over one governed fact set |
| `QueueRankEntry` | Row-level explanation payload and ordinal |
| `QueueAssignmentSuggestionSnapshot` | Reviewer-fit and governed auto-claim suggestions downstream of canonical order |

## Duplicate contract family

| Contract | Role |
| --- | --- |
| `DuplicateCluster` | Canonical review container from Phase 0 |
| `DuplicatePairEvidence` | Immutable pairwise evidence |
| `DuplicateResolutionDecision` | Attach, link, or separate authority |
| `DuplicateReviewSnapshot` | Staff-facing duplicate review projection |

## More-info contract family

| Contract | Role |
| --- | --- |
| `MoreInfoCycle` | Staff-initiated request-for-information workflow object |
| `MoreInfoReplyWindowCheckpoint` | Sole authority for due-state, reminder, late-review, and expiry posture |
| `MoreInfoReminderSchedule` | Exact-once reminder ledger tied to the current checkpoint |
| `MoreInfoResponseDisposition` | Canonical reply classifier before assimilation and re-safety |

## Queue routes and projections

Canonical queue-facing reads:

- `GET /v1/workspace/queues/{queueKey}`
- `GET /v1/workspace/queues/{queueKey}/rank-snapshot`
- `GET /v1/workspace/queues/{queueKey}/assignment-suggestions`
- `GET /v1/workspace/tasks/{taskId}`
- `GET /v1/workspace/tasks/{taskId}/duplicates`
- `GET /v1/workspace/tasks/{taskId}/more-info`

Canonical queue-facing writes remain governed through the task command chain frozen in `226`, especially:

- `POST /v1/workspace/tasks/{taskId}:claim`
- `POST /v1/workspace/tasks/{taskId}:start-review`
- `POST /v1/workspace/tasks/{taskId}:request-more-info`
- `POST /v1/workspace/tasks/{taskId}:resolve-duplicate`

## Patient more-info routes

The existing patient route family from `212` remains authoritative and now consumes the Phase 3 checkpoint model:

- `GET /v1/me/requests/{requestRef}/more-info`
- `GET /v1/me/requests/{requestRef}/more-info/thread`

The key binding is:

- patient shell actionability must resolve one current `MoreInfoCycle`
- one current `MoreInfoReplyWindowCheckpoint`
- one current `MoreInfoReminderSchedule`
- one latest `MoreInfoResponseDisposition`

## Contract boundaries

### Queue order

Canonical queue order derives only from:

- one `QueueRankPlan`
- one `sourceFactCutRef`
- one `QueueRankSnapshot`

Not from:

- browser-local sorting
- reviewer-local heuristics
- preview-pocket state
- next-task prefetch state

### Reviewer suggestion

Reviewer suggestion derives from:

- one committed `QueueRankSnapshot`
- one reviewer scope
- one suggestion policy

Not from:

- ordinals rewritten in place
- local queue drag or reorder affordances

### Duplicate handling

Replay, attach, and duplicate review remain separate:

- replay: `IdempotencyRecord`
- duplicate ambiguity: `DuplicateCluster`
- attach or separation: `DuplicateResolutionDecision`
- same-fence divergence: `ReplayCollisionReview`

### More-info due state

Due-state truth derives from:

- `MoreInfoReplyWindowCheckpoint`

Not from:

- secure-link TTL
- session TTL
- copied email wording
- browser-local countdown timers

## Registry notes

This task intentionally freezes exact numeric defaults in the registry. Later Phase 3 work may publish `phase3_v2` or later plans, but it may not bypass versioned plan publication and silently change queue or more-info semantics inside implementation code.
