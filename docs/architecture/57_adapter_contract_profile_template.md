# 57 Adapter Contract Profile Template

        Seq_057 freezes one canonical contract surface for every current external dependency boundary. The generated JSON, CSV, schemas, and studio move replay law, callback ordering, proof-of-success rules, and blast-radius degradation out of worker-local code and into published profiles.

        ## Summary

        | Metric | Value |
| --- | --- |
| Adapter profiles | 20 |
| Dependency degradation profiles | 20 |
| Effect families | 20 |
| Live cutover pending | 17 |

        ## Core Law

        - Every external dependency boundary resolves one `AdapterContractProfile` and one `DependencyDegradationProfile`.
        - `AdapterDispatchAttempt` and `AdapterReceiptCheckpoint` reuse the same profile-owned replay and callback rules across simulator-first and later live-provider execution.
        - Transport acceptance, webhook arrival, queue dequeue, or inbox receipt remain supporting evidence only. Calm success and writable truth still depend on the declared authoritative proof rule.
        - Booking, pharmacy, callback, message, embedded, and watch boundaries bind through explicit adapter or provider-binding refs rather than vendor-name switches or feature flags.
        - Phase 0 defaults to simulator-backed execution. The later live-cutover path is explicit, gate-bound, and rollback-safe.

        ## Required Field Surface

        - `adapterContractProfileId`
        - `adapterCode`
        - `dependencyCode`
        - `effectFamilies[]`
        - `supportedActionScopes[]`
        - `capabilityMatrixRef`
        - `outboxCheckpointPolicyRef`
        - `receiptOrderingPolicyRef`
        - `callbackCorrelationPolicyRef`
        - `idempotencyWindowRef`
        - `duplicateDispositionRef`
        - `collisionDispositionRef`
        - `retryPolicyRef`
        - `dependencyDegradationProfileRef`
        - `integrationWorkloadFamilyRef`
        - `requiredTrustZoneBoundaryRef`
        - `allowedFhirRepresentationContractRefs[]`
        - `allowedFhirExchangeBundleTypes[]`
        - `authoritativeProofRulesRef`
        - `manualReviewFallbackRef`
        - `simulatorContractRef`
        - `liveCutoverChecklistRef`
        - `updatedAt`

        ## Mandatory Gap Closures

        - Replay, ordering, duplicate, and collision rules now live in published adapter profiles instead of worker or webhook code.
        - Transport acceptance is separated from authoritative outcome through explicit proof rules and proof ladders.
        - Failure blast radius is bounded through published degradation profiles rather than implicit retries.
        - Supplier variation stays inside published adapter bindings, effect-family rows, and cutover checklists.
        - Mock-now and actual-later sections describe the same domain effect so simulator parity remains auditable.

        ## Assumptions

        | assumption_id | summary |
| --- | --- |
| ASSUMPTION_057_ASSISTIVE_WATCH_SHADOW | The assistive vendor lane is treated as a watch-shadow adapter boundary until a later phase freezes live invocation policy. |
| ASSUMPTION_057_STANDARDS_SOURCE_CACHE_TWIN | Standards and assurance sources use a synthetic watch-cache twin now so release-critical drift logic is testable without external fetches. |
| ASSUMPTION_057_PDS_REMAINS_OPTIONAL | Optional PDS enrichment remains feature-flagged and may legally stay on a permanent simulator-backed path for some tenants. |
