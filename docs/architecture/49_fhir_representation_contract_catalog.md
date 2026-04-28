# 49 FHIR Representation Contract Catalog

## Contract Rows

| Contract | Owner | Aggregate | Purpose | Resources | Bundle policies | Defect state |
| --- | --- | --- | --- | --- | --- | --- |
| `FRC_049_AUDIT_RECORD_AUDIT_COMPANION_V1` | `audit_compliance` | `AuditRecord` | `audit_companion` | `AuditEvent`, `Provenance` | `FXBP_049_AUDIT_COMPANION_EXPORT_DOCUMENT` | `watch` |
| `FRC_049_BOOKING_CASE_EXTERNAL_INTERCHANGE_V1` | `booking` | `BookingCase` | `external_interchange` | `ServiceRequest`, `Task`, `Communication`, `Provenance` | `FXBP_049_BOOKING_PARTNER_OUTBOUND_MESSAGE` | `active` |
| `FRC_049_BOOKING_CASE_PARTNER_CALLBACK_CORRELATION_V1` | `booking` | `BookingCase` | `partner_callback_correlation` | `Communication`, `Provenance` | `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` | `active` |
| `FRC_049_CALLBACK_CASE_PARTNER_CALLBACK_CORRELATION_V1` | `communications` | `CallbackCase` | `partner_callback_correlation` | `Communication`, `Provenance` | `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` | `active` |
| `FRC_049_EVIDENCE_SNAPSHOT_CLINICAL_PERSISTENCE_V1` | `intake_safety` | `EvidenceSnapshot` | `clinical_persistence` | `DocumentReference`, `Provenance` | `none` | `watch` |
| `FRC_049_HUB_CASE_EXTERNAL_INTERCHANGE_V1` | `hub_coordination` | `HubCoordinationCase` | `external_interchange` | `ServiceRequest`, `Communication`, `DocumentReference`, `Provenance` | `FXBP_049_HUB_PARTNER_OUTBOUND_MESSAGE` | `active` |
| `FRC_049_HUB_CASE_PARTNER_CALLBACK_CORRELATION_V1` | `hub_coordination` | `HubCoordinationCase` | `partner_callback_correlation` | `Communication`, `Provenance` | `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` | `active` |
| `FRC_049_MESSAGE_DISPATCH_EXTERNAL_INTERCHANGE_V1` | `communications` | `MessageDispatchEnvelope` | `external_interchange` | `Communication`, `Provenance` | `FXBP_049_SECURE_MESSAGE_OUTBOUND_MESSAGE` | `active` |
| `FRC_049_PHARMACY_CASE_EXTERNAL_INTERCHANGE_V1` | `pharmacy` | `PharmacyCase` | `external_interchange` | `ServiceRequest`, `Communication`, `DocumentReference`, `Consent`, `Provenance`, `AuditEvent` | `FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE` | `active` |
| `FRC_049_PHARMACY_CONSENT_CLINICAL_PERSISTENCE_V1` | `pharmacy` | `PharmacyConsentRecord` | `clinical_persistence` | `Consent`, `Provenance` | `none` | `active` |
| `FRC_049_PHARMACY_DISPATCH_PARTNER_CALLBACK_CORRELATION_V1` | `pharmacy` | `PharmacyDispatchAttempt` | `partner_callback_correlation` | `Communication`, `Provenance` | `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` | `active` |
| `FRC_049_REQUEST_CLINICAL_PERSISTENCE_V1` | `foundation_control_plane` | `Request` | `clinical_persistence` | `Task`, `DocumentReference`, `Provenance` | `none` | `active` |
| `FRC_049_REQUEST_EXTERNAL_INTERCHANGE_V1` | `foundation_control_plane` | `Request` | `external_interchange` | `Task`, `DocumentReference`, `Provenance` | `FXBP_049_REQUEST_OUTBOUND_DOCUMENT` | `active` |
