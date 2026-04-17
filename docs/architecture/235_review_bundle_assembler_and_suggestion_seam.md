# 235 Review Bundle Assembler And Suggestion Seam

## Scope

`par_235` publishes the Phase 3 review-preparation seam that later workspace tasks consume directly:

- `GET /v1/workspace/tasks/{taskId}/review-bundle`
- `GET /internal/v1/workspace/tasks/{taskId}/review-bundle/suggestions`

The implementation lives in `/Users/test/Code/V/services/command-api/src/review-bundle-assembler.ts` and uses shared contracts from `/Users/test/Code/V/packages/domain-kernel/src/review-bundle-contracts.ts`.

## Authoritative shape

`ReviewBundleAssembler` builds one pinned staff review artifact per task and snapshot tuple. Every assembled bundle carries:

- `reviewVersion`
- `evidenceSnapshotRef`
- `captureBundleRef`
- `evidenceSummaryParityRef`
- `lineageFenceEpoch`
- current `DecisionEpoch` and any `DecisionSupersessionRecord`

Bundle sections are summary-first but provenance-bound:

- canonical request summary
- structured answers by request type
- original patient narrative
- safety-screen result plus matched rule ids
- telephony metadata
- transcript stub
- attachment list and previews
- identity and match-confidence summary
- contact preference summary
- timeline of prior messages and responses
- duplicate-cluster status
- latest SLA state

The summary is backend-generated, deterministic, and versioned through `templateVersion` plus `rulesVersion`. The UI does not compose or rewrite it.

## Deterministic summary law

`renderDeterministicReviewSummary()` sorts structured answers and attachment labels before hashing and rendering. The same authoritative evidence set yields the same:

- `summaryLines`
- `summaryDigest`
- `reviewBundleId`

Unsafe parity never reuses the same surface posture as verified parity:

- `verified` => `summaryVisibilityState = authoritative`
- `stale` => `summaryVisibilityState = provisional`
- `blocked | superseded` => `summaryVisibilityState = suppressed`

When parity is unsafe, authoritative regenerated summary text is withheld and only bounded provisional copy may remain available.

## Evidence delta packet

`EvidenceDeltaPacket` is built from one baseline snapshot and one current snapshot. It is the only changed-since-seen contract for the review shell.

The packet surfaces:

- new evidence
- contradiction refs
- changed endpoint assumptions
- changed approval posture
- changed ownership
- duplicate-lineage supersession
- `DecisionEpoch` supersession when preview-coupled consequences drift

`deltaClass` follows the workspace law:

- `decisive` for contradiction, ownership drift, duplicate supersession, or decision-epoch supersession
- `consequential` for endpoint or approval posture drift
- `contextual` for non-blocking new evidence
- `clerical` otherwise

Superseded context is preserved through `supersededJudgmentContext[]` until recommit.

## Suggestion envelope boundary

The bundle assembler publishes `SuggestionEnvelope` as a future-safe seam, not as authority.

Supported fields:

- `sourceType = rules | shadow_model`
- `suggestionVersion`
- `priorityBand`
- `complexityBand`
- `candidateEndpoints`
- `recommendedQuestionSetIds`
- `rationaleBullets`
- `confidenceDescriptor`
- `visibilityState`

Phase 3 workflow-visible guidance is rules-only and always `authoritativeWorkflowInfluence = advisory_only`.
`shadow_model` output is kept as `silent_shadow`.

Rules suggestions degrade when the task is no longer cleanly current:

- `publicationState = ready` => `visibilityState = visible`
- `publicationState = stale_recoverable` => `visibilityState = observe_only`
- `publicationState = recovery_required` => `visibilityState = blocked`

## Boundary with later tracks

The live consequence preview invalidation port still belongs to later endpoint work. `par_235` therefore consumes task-level `currentDecisionEpochRef` and `latestDecisionSupersessionRef` directly and publishes the seam explicitly in `PARALLEL_INTERFACE_GAP_PHASE3_REVIEW_BUNDLE_STACK.json`.
