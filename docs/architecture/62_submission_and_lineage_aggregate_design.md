# 62 Submission And Lineage Aggregate Design

- Task: `par_062`
- Captured on: `2026-04-12`
- Generated at: `2026-04-12T00:00:00+00:00`
- Visual mode: `quiet_foundation_backbone`

Canonical backend implementation package for SubmissionEnvelope, SubmissionPromotionRecord, RequestLineage, LineageCaseLink, Episode, and Request, including replay-safe promotion, lineage continuity, child-case ownership boundaries, persistence, and typed event seams.

## Gap Closures

- The durable pre-submit shell is now a real `SubmissionEnvelopeAggregate` with immutable ingress, evidence, and normalized-submission refs.
- The submitted barrier is explicit: `SubmissionPromotionRecordDocument` is created once per successful promotion and replayed on duplicate promote calls.
- `RequestLineageAggregate` and `LineageCaseLinkAggregate` are persisted first-class objects rather than narrative joins.
- `Request.patientRef` and `Episode.patientRef` remain nullable until explicit identity binding exists.
- Child-domain work is attached through `LineageCaseLink` summaries only; canonical request workflow remains owned by `Request`.

## Aggregate Homes

| Aggregate | Package | Persistence Table | Boundary | Implementation |
| --- | --- | --- | --- | --- |
| SubmissionEnvelope | @vecells/domain-kernel | submission_envelopes | durable pre submit shell | `packages/domain-kernel/src/request-intake-backbone.ts` |
| SubmissionPromotionRecord | @vecells/domain-identity-access | submission_promotion_records | explicit submitted barrier | `packages/domains/identity_access/src/submission-lineage-backbone.ts` |
| RequestLineage | @vecells/domain-kernel | request_lineages | continuity anchor | `packages/domain-kernel/src/request-intake-backbone.ts` |
| LineageCaseLink | @vecells/domain-kernel | lineage_case_links | child case ownership summary | `packages/domain-kernel/src/request-intake-backbone.ts` |
| Episode | @vecells/domain-identity-access | episodes | identity binding episode anchor | `packages/domains/identity_access/src/submission-lineage-backbone.ts` |
| Request | @vecells/domain-kernel | requests | post submit workflow truth | `packages/domain-kernel/src/request-intake-backbone.ts` |

## Persistence And Replay Model

- Repository interfaces live in the domain packages and are implemented by `InMemorySubmissionLineageFoundationStore` for deterministic replay-safe tests.
- `saveWithCas(...)` enforces optimistic concurrency on every aggregate write and rejects non-monotone version drift.
- `services/command-api/migrations/062_submission_and_lineage_backbone.sql` freezes the six-table persistence shape for later runtime adapters.
- `createSubmissionBackboneApplication(...)` publishes the minimal command-api seam for later routes, idempotency services, and identity/evidence tracks.

## Command Seams

| Command Seam | Home | Effect |
| --- | --- | --- |
| `createEnvelope` | `@vecells/domain-identity-access::SubmissionLineageCommandService` | instantiate durable pre-submit shell |
| `appendEnvelopeIngress` | `@vecells/domain-identity-access::SubmissionLineageCommandService` | append immutable ingress reference |
| `attachEnvelopeEvidence` | `@vecells/domain-identity-access::SubmissionLineageCommandService` | attach frozen evidence snapshot without minting a request |
| `attachEnvelopeNormalization` | `@vecells/domain-identity-access::SubmissionLineageCommandService` | attach canonical normalized submission and candidate refs |
| `markEnvelopeReady` | `@vecells/domain-identity-access::SubmissionLineageCommandService` | settle promotion readiness after ingress, evidence, and normalization exist |
| `promoteEnvelope` | `@vecells/domain-identity-access::SubmissionLineageCommandService` | create exactly one Request plus SubmissionPromotionRecord and initial RequestLineage |
| `continueRequestLineage` | `@vecells/domain-identity-access::SubmissionLineageCommandService` | reuse the same lineage for same-request continuity |
| `branchRequestLineage` | `@vecells/domain-identity-access::SubmissionLineageCommandService` | create same-episode or related-episode lineage branches with explicit decisions |
| `proposeLineageCaseLink` | `@vecells/domain-identity-access::SubmissionLineageCommandService` | attach child-domain work as link-only ownership state |
| `transitionLineageCaseLink` | `@vecells/domain-identity-access::SubmissionLineageCommandService` | advance child-link ownership while only refreshing request and lineage summaries |

## Event Seams

- Canonical event helpers live in `packages/event-contracts/src/submission-lineage-events.ts`.
- `request.lineage.branched` and `request.lineage.case_link.changed` remain bounded `PARALLEL_INTERFACE_GAP_*` stubs until sibling parallel tracks publish the permanent registry rows.

## Assumptions

- `ASSUMPTION_062_EPISODE_TRACKS_CURRENT_IDENTITY_ONLY`: Episode keeps the current identity binding and patientRef only; full identity supersession history remains outside par_062 and is represented by nullable refs plus version increments.
- `ASSUMPTION_062_SUMMARIES_MIRROR_ACTIVE_CHILD_LINKS`: Request and RequestLineage summary fields expose the latest and active LineageCaseLink refs, but the child workflow remains authoritative only within the child domain.

## Source Refs

- `prompt/062.md`
- `prompt/shared_operating_contract_056_to_065.md`
- `blueprint/phase-0-the-foundation-protocol.md#1.0A IntakeConvergenceContract`
- `blueprint/phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope`
- `blueprint/phase-0-the-foundation-protocol.md#1.1A SubmissionPromotionRecord`
- `blueprint/phase-0-the-foundation-protocol.md#1.1B RequestLineage`
- `blueprint/phase-0-the-foundation-protocol.md#1.1C LineageCaseLink`
- `blueprint/phase-0-the-foundation-protocol.md#1.2 Episode`
- `blueprint/phase-0-the-foundation-protocol.md#1.3 Request`
- `blueprint/vecells-complete-end-to-end-flow.md#Audited flow baseline`
- `blueprint/forensic-audit-findings.md#Finding-01`
- `blueprint/forensic-audit-findings.md#Finding-02`
- `blueprint/forensic-audit-findings.md#Finding-48`
- `blueprint/forensic-audit-findings.md#Finding-49`
- `blueprint/forensic-audit-findings.md#Finding-50`
- `blueprint/forensic-audit-findings.md#Finding-51`
- `blueprint/forensic-audit-findings.md#Finding-52`
- `blueprint/forensic-audit-findings.md#Finding-53`
- `blueprint/forensic-audit-findings.md#Finding-54`
- `data/analysis/domain_package_manifest.json`
- `data/analysis/parallel_track_eligibility.csv`
