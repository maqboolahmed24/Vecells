# 49 FHIR Representation Strategy

## Mission

Publish one deterministic, replay-safe FHIR representation authority so Vecells keeps domain aggregates as lifecycle truth while FHIR remains explicit representation only.

## Core Law

- `FhirRepresentationContract` is the only legal place to define how an aggregate version, evidence snapshot, or settlement chain becomes FHIR resources.
- `FhirRepresentationSet` is the atomic replay and audit unit. The same causal inputs must rematerialize the same resource membership.
- `FhirExchangeBundle` is the only adapter-boundary payload family. Adapters may not infer resource shapes from local code defaults.
- `ClinicalRepresentationMapper` and declared adapter workloads are the only raw FHIR speakers.
- Domain aggregates keep lifecycle, blocker, closure, continuity, and control-plane truth even when FHIR companions exist.

## Contract Summary

- Active contracts: `13`
- Governing aggregate types: `10`
- Representation purposes: `4`
- Exchange bundle policies: `7`
- Blocked lifecycle-owner mappings: `8`

## Purpose Profiles

- `clinical_persistence`: replay-safe internal clinical representation that never replaces aggregate truth.
- `external_interchange`: partner or clinical interchange from frozen aggregate and evidence state only.
- `partner_callback_correlation`: inbound or outbound callback companions bound to explicit correlation and checkpoint law.
- `audit_companion`: FHIR `AuditEvent` and `Provenance` derived from immutable internal audit joins only.

## Gap Closures

- FHIR mapping is no longer implicit in application code; every allowed mapping now lives on one published contract row.
- Raw FHIR resources cannot quietly become lifecycle owners because the blocked owner set is explicit and validator-backed.
- Partner callback and external interchange payloads are now bound to declared `FhirExchangeBundle` policies.
- Identifier and status semantics are machine-readable instead of adapter-local.
- Audit companions are codified as companion output only, never replacements for internal audit truth.
- Replay stability is explicit: the same aggregate version, package hash, or audit hash must rematerialize the same representation set.

## Prohibited Lifecycle Owners

- `AccessGrant`: Access grants are internal capability truth and may not surface as FHIR lifecycle owners.
- `CapabilityDecision`: CapabilityDecision is internal trust law and may not be flattened into FHIR status.
- `Session`: Session is local authority and never partner-visible FHIR lifecycle truth.
- `RequestLifecycleLease`: Lease ownership and takeover are control-plane facts, not FHIR statuses.
- `CapacityReservation`: Reservation truth remains internal and may not be replaced by FHIR commitment state.
- `AudienceSurfaceRuntimeBinding`: Browser/runtime parity tuples are release controls, not clinical resources.
- `ReleasePublicationParityRecord`: Publication parity remains release control truth and may not leak into FHIR authority.
- `ReleaseTrustFreezeVerdict`: Trust and freeze posture are control-plane decisions, not FHIR-owned lifecycle state.

## Active Contracts

- `FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1`: `AuditRecord` / `audit_companion` -> AuditEvent, Provenance; bundles: FXBP_049_AUDIT_COMPANION_EXPORT_DOCUMENT
- `FRC_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1`: `BookingCase` / `external_interchange` -> ServiceRequest, Task, Communication, Provenance; bundles: FXBP_049_BOOKING_PARTNER_OUTBOUND_MESSAGE
- `FRC_049_BOOKING_CASE_PARTNER_CALLBACK_CORRELATION_V1`: `BookingCase` / `partner_callback_correlation` -> Communication, Provenance; bundles: FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION
- `FRC_049_CALLBACK_CASE_PARTNER_CALLBACK_CORRELATION_V1`: `CallbackCase` / `partner_callback_correlation` -> Communication, Provenance; bundles: FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION
- `FRC_049_EVIDENCE_SNAPSHOT_CLINICAL_PERSISTENCE_V1`: `EvidenceSnapshot` / `clinical_persistence` -> DocumentReference, Provenance; bundles: none
- `FRC_049_HUB_CASE_EXTERNAL_INTERCHANGE_V1`: `HubCoordinationCase` / `external_interchange` -> ServiceRequest, Communication, DocumentReference, Provenance; bundles: FXBP_049_HUB_PARTNER_OUTBOUND_MESSAGE
- `FRC_049_HUB_CASE_PARTNER_CALLBACK_CORRELATION_V1`: `HubCoordinationCase` / `partner_callback_correlation` -> Communication, Provenance; bundles: FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION
- `FRC_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1`: `MessageDispatchEnvelope` / `external_interchange` -> Communication, Provenance; bundles: FXBP_049_SECURE_MESSAGE_OUTBOUND_MESSAGE
- `FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1`: `PharmacyCase` / `external_interchange` -> ServiceRequest, Communication, DocumentReference, Consent, Provenance, AuditEvent; bundles: FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE
- `FRC_049_PHARMACY_CONSENT_CLINICAL_PERSISTENCE_V1`: `PharmacyConsentRecord` / `clinical_persistence` -> Consent, Provenance; bundles: none
- `FRC_049_PHARMACY_DISPATCH_PARTNER_CALLBACK_CORRELATION_V1`: `PharmacyDispatchAttempt` / `partner_callback_correlation` -> Communication, Provenance; bundles: FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION
- `FRC_049_REQUEST_CLINICAL_PERSISTENCE_V1`: `Request` / `clinical_persistence` -> Task, DocumentReference, Provenance; bundles: none
- `FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1`: `Request` / `external_interchange` -> Task, DocumentReference, Provenance; bundles: FXBP_049_REQUEST_OUTBOUND_DOCUMENT

## Assumptions

- `ASSUMPTION_049_AUDIT_RECORD_RESOLVES_FROM_PHASE0_AND_EVENT_REGISTRY`: The seq_006 object catalog does not currently carry a first-class AuditRecord row, so seq_049 resolves AuditRecord authority from Phase 0 and the seq_048 audit event contracts until seq_053 publishes the authoritative audit ledger pack.
- `ASSUMPTION_049_EVIDENCE_SNAPSHOT_MATERIALIZATION_STAYS_IN_INTAKE_SAFETY`: EvidenceSnapshot ownership is still marked `unknown` in the seq_006 catalog, so seq_049 anchors representation materialization to `intake_safety` because request snapshot freeze, attachment quarantine, and representation emission already converge there.
