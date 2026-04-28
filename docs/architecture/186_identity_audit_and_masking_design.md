# Identity Audit And Masking Design

`IdentityAuditAndMaskingService` is the canonical audit and event-publication boundary for Phase 2 identity, claim, grant, repair, capability, and optional PDS decisions. It turns every critical identity-domain decision into one `CanonicalEventEnvelope`, one append-only audit hash-chain row, and one assurance-audit outbox entry.

The service consumes the coherent Phase 2 seams from `CapabilityDecisionEngine`, `SessionGovernor`, `AccessGrantService`, `IdentityRepairOrchestrator`, `PdsEnrichmentService`, `SignedInRequestOwnershipService`, and `AuthenticatedPortalProjectionService`. No fallback gap artifact is required.

## Event Envelope

Every event carries the Phase 0 envelope vocabulary:

- `eventId`, `eventName`, `canonicalEventContractRef`, `namespaceRef`, and `schemaVersionRef`
- `tenantId`, `producerRef`, `producerScopeRef`, source and governing bounded-context refs
- `governingAggregateRef`, `governingLineageRef`, `routeIntentRef`, command refs, `edgeCorrelationId`, and `causalToken`
- `effectKeyRef`, `continuityFrameRef`, `subjectRef`, `piiClass`, `disclosureClass`, `payloadArtifactRef`, and `payloadHash`
- `actorType`, `policyVersion`, `routeProfileRef`, `sessionRef`, `decisionRef`, `grantRef`, `repairCaseRef`, evidence refs, and reason codes

The event catalogue includes `auth.login.started`, `auth.callback.received`, `auth.session.created`, `auth.session.ended`, `identity.patient.match_attempted`, `identity.patient.matched`, `identity.patient.ambiguous`, `identity.capability.changed`, `identity.capability.denied`, `identity.age.restricted`, `access.grant.issued`, `access.grant.redeemed`, `access.grant.revoked`, and `access.grant.superseded`.

The same catalogue names the repair, claim, ownership, and optional PDS events explicitly: `identity.repair_case.opened`, `identity.repair_case.freeze_committed`, `identity.repair_release.settled`, `identity.request.claim.started`, `identity.request.claim.confirmed`, `identity.request.ownership.uplifted`, `identity.pds.enrichment.requested`, `identity.pds.enrichment.succeeded`, and `identity.pds.change_signal.recorded`.

## Append-Only Audit Sink

`phase2_identity_audit_records` is append-only and hash-chained with `previousHash` and `recordHash`. Duplicate publication by `effectKeyRef` does not mutate the existing event or audit row. It appends `phase2_identity_audit_duplicate_receipts` so retries remain observable while the logical event stream stays replay-safe.

This closes the audit-history mutation gap: old event meaning is never overwritten, and later reconciliation works from a monotone record sequence.

## Reconstruction

`reconstructDecision(governingLineageRef)` rebuilds the major decision trail from canonical event envelopes and audit refs. It returns event names, envelope refs, route-intent refs, session refs, decision refs, grant refs, repair-case refs, evidence refs, and reason codes. Governance or support review can therefore explain:

- which auth transaction and session establishment path occurred
- which matching or ambiguity decision happened
- which capability decision gated the route
- which grant was redeemed, revoked, or superseded
- whether claim changed ownership
- whether a repair case froze or released the lineage

Raw evidence, token, phone, NHS number, OIDC claim, or PDS payload values are not needed for default reconstruction.

## Central Masking System

Masking is structural. Event payloads, logs, traces, metrics, alerts, route query strings, and job payload snapshots use the same redaction transform. The published rules cover NHS numbers, phone numbers, email addresses, OAuth tokens, OIDC claims, JWT material, access-grant opaque values, evidence identifiers, and voice or transcript refs.

Route-local masking is not allowed. Services call `redactIdentityPayload`, `scrubLogRecord`, `scrubTraceAttributes`, or `scrubMetricLabels` and receive deterministic masked fragments, digest refs, or artifact refs plus the masking rule refs applied.

## Gap Closures

- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_REPAIR_CLAIM_EVENTS_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_ROUTE_LOCAL_MASKING_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_OBSERVABILITY_SCRUBBING_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_RECONSTRUCTABLE_DECISIONS_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_IDENTITY_AUDIT_APPEND_ONLY_HISTORY_V1`
