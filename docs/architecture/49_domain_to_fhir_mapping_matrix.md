# 49 Domain To FHIR Mapping Matrix

## Domain To Resource Rows

| Aggregate | Purpose | Resource | Identifier policy | Status policy | Bundle policy |
| --- | --- | --- | --- | --- | --- |
| `AuditRecord` | `audit_companion` | `AuditEvent` | `IDPOL_049_AUDIT_CHAIN_HASH` | `STPOL_049_AUDIT_COMPANION` | `FXBP_049_AUDIT_COMPANION_EXPORT_DOCUMENT` |
| `AuditRecord` | `audit_companion` | `Provenance` | `IDPOL_049_AUDIT_CHAIN_HASH` | `STPOL_049_AUDIT_COMPANION` | `FXBP_049_AUDIT_COMPANION_EXPORT_DOCUMENT` |
| `BookingCase` | `external_interchange` | `Communication` | `IDPOL_049_EXTERNAL_COMMITMENT_CASE` | `STPOL_049_BOOKING_COMMITMENT` | `FXBP_049_BOOKING_PARTNER_OUTBOUND_MESSAGE` |
| `BookingCase` | `external_interchange` | `Provenance` | `IDPOL_049_EXTERNAL_COMMITMENT_CASE` | `STPOL_049_BOOKING_COMMITMENT` | `FXBP_049_BOOKING_PARTNER_OUTBOUND_MESSAGE` |
| `BookingCase` | `external_interchange` | `ServiceRequest` | `IDPOL_049_EXTERNAL_COMMITMENT_CASE` | `STPOL_049_BOOKING_COMMITMENT` | `FXBP_049_BOOKING_PARTNER_OUTBOUND_MESSAGE` |
| `BookingCase` | `external_interchange` | `Task` | `IDPOL_049_EXTERNAL_COMMITMENT_CASE` | `STPOL_049_BOOKING_COMMITMENT` | `FXBP_049_BOOKING_PARTNER_OUTBOUND_MESSAGE` |
| `BookingCase` | `partner_callback_correlation` | `Communication` | `IDPOL_049_TRANSPORT_CORRELATION_RECORD` | `STPOL_049_MESSAGE_COMMUNICATION` | `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` |
| `BookingCase` | `partner_callback_correlation` | `Provenance` | `IDPOL_049_TRANSPORT_CORRELATION_RECORD` | `STPOL_049_MESSAGE_COMMUNICATION` | `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` |
| `CallbackCase` | `partner_callback_correlation` | `Communication` | `IDPOL_049_TRANSPORT_CORRELATION_RECORD` | `STPOL_049_MESSAGE_COMMUNICATION` | `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` |
| `CallbackCase` | `partner_callback_correlation` | `Provenance` | `IDPOL_049_TRANSPORT_CORRELATION_RECORD` | `STPOL_049_MESSAGE_COMMUNICATION` | `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` |
| `EvidenceSnapshot` | `clinical_persistence` | `DocumentReference` | `IDPOL_049_SNAPSHOT_HASH_DOCUMENT` | `STPOL_049_EVIDENCE_DOCUMENT_REFERENCE` | `none` |
| `EvidenceSnapshot` | `clinical_persistence` | `Provenance` | `IDPOL_049_SNAPSHOT_HASH_DOCUMENT` | `STPOL_049_EVIDENCE_DOCUMENT_REFERENCE` | `none` |
| `HubCoordinationCase` | `external_interchange` | `Communication` | `IDPOL_049_EXTERNAL_COMMITMENT_CASE` | `STPOL_049_HUB_COMMITMENT` | `FXBP_049_HUB_PARTNER_OUTBOUND_MESSAGE` |
| `HubCoordinationCase` | `external_interchange` | `DocumentReference` | `IDPOL_049_EXTERNAL_COMMITMENT_CASE` | `STPOL_049_HUB_COMMITMENT` | `FXBP_049_HUB_PARTNER_OUTBOUND_MESSAGE` |
| `HubCoordinationCase` | `external_interchange` | `Provenance` | `IDPOL_049_EXTERNAL_COMMITMENT_CASE` | `STPOL_049_HUB_COMMITMENT` | `FXBP_049_HUB_PARTNER_OUTBOUND_MESSAGE` |
| `HubCoordinationCase` | `external_interchange` | `ServiceRequest` | `IDPOL_049_EXTERNAL_COMMITMENT_CASE` | `STPOL_049_HUB_COMMITMENT` | `FXBP_049_HUB_PARTNER_OUTBOUND_MESSAGE` |
| `HubCoordinationCase` | `partner_callback_correlation` | `Communication` | `IDPOL_049_TRANSPORT_CORRELATION_RECORD` | `STPOL_049_MESSAGE_COMMUNICATION` | `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` |
| `HubCoordinationCase` | `partner_callback_correlation` | `Provenance` | `IDPOL_049_TRANSPORT_CORRELATION_RECORD` | `STPOL_049_MESSAGE_COMMUNICATION` | `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` |
| `MessageDispatchEnvelope` | `external_interchange` | `Communication` | `IDPOL_049_TRANSPORT_CORRELATION_RECORD` | `STPOL_049_MESSAGE_COMMUNICATION` | `FXBP_049_SECURE_MESSAGE_OUTBOUND_MESSAGE` |
| `MessageDispatchEnvelope` | `external_interchange` | `Provenance` | `IDPOL_049_TRANSPORT_CORRELATION_RECORD` | `STPOL_049_MESSAGE_COMMUNICATION` | `FXBP_049_SECURE_MESSAGE_OUTBOUND_MESSAGE` |
| `PharmacyCase` | `external_interchange` | `AuditEvent` | `IDPOL_049_PHARMACY_PACKAGE_FINGERPRINT` | `STPOL_049_PHARMACY_REFERRAL` | `FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE` |
| `PharmacyCase` | `external_interchange` | `Communication` | `IDPOL_049_PHARMACY_PACKAGE_FINGERPRINT` | `STPOL_049_PHARMACY_REFERRAL` | `FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE` |
| `PharmacyCase` | `external_interchange` | `Consent` | `IDPOL_049_PHARMACY_PACKAGE_FINGERPRINT` | `STPOL_049_PHARMACY_REFERRAL` | `FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE` |
| `PharmacyCase` | `external_interchange` | `DocumentReference` | `IDPOL_049_PHARMACY_PACKAGE_FINGERPRINT` | `STPOL_049_PHARMACY_REFERRAL` | `FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE` |
| `PharmacyCase` | `external_interchange` | `Provenance` | `IDPOL_049_PHARMACY_PACKAGE_FINGERPRINT` | `STPOL_049_PHARMACY_REFERRAL` | `FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE` |
| `PharmacyCase` | `external_interchange` | `ServiceRequest` | `IDPOL_049_PHARMACY_PACKAGE_FINGERPRINT` | `STPOL_049_PHARMACY_REFERRAL` | `FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE` |
| `PharmacyConsentRecord` | `clinical_persistence` | `Consent` | `IDPOL_049_CONSENT_SCOPE_FINGERPRINT` | `STPOL_049_CONSENT_CHECKPOINT` | `none` |
| `PharmacyConsentRecord` | `clinical_persistence` | `Provenance` | `IDPOL_049_CONSENT_SCOPE_FINGERPRINT` | `STPOL_049_CONSENT_CHECKPOINT` | `none` |
| `PharmacyDispatchAttempt` | `partner_callback_correlation` | `Communication` | `IDPOL_049_TRANSPORT_CORRELATION_RECORD` | `STPOL_049_MESSAGE_COMMUNICATION` | `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` |
| `PharmacyDispatchAttempt` | `partner_callback_correlation` | `Provenance` | `IDPOL_049_TRANSPORT_CORRELATION_RECORD` | `STPOL_049_MESSAGE_COMMUNICATION` | `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` |
| `Request` | `clinical_persistence` | `DocumentReference` | `IDPOL_049_REQUEST_VERSION_FINGERPRINT` | `STPOL_049_REQUEST_TASK_LIFECYCLE` | `none` |
| `Request` | `clinical_persistence` | `Provenance` | `IDPOL_049_REQUEST_VERSION_FINGERPRINT` | `STPOL_049_REQUEST_TASK_LIFECYCLE` | `none` |
| `Request` | `clinical_persistence` | `Task` | `IDPOL_049_REQUEST_VERSION_FINGERPRINT` | `STPOL_049_REQUEST_TASK_LIFECYCLE` | `none` |
| `Request` | `external_interchange` | `DocumentReference` | `IDPOL_049_REQUEST_VERSION_FINGERPRINT` | `STPOL_049_REQUEST_TASK_LIFECYCLE` | `FXBP_049_REQUEST_OUTBOUND_DOCUMENT` |
| `Request` | `external_interchange` | `Provenance` | `IDPOL_049_REQUEST_VERSION_FINGERPRINT` | `STPOL_049_REQUEST_TASK_LIFECYCLE` | `FXBP_049_REQUEST_OUTBOUND_DOCUMENT` |
| `Request` | `external_interchange` | `Task` | `IDPOL_049_REQUEST_VERSION_FINGERPRINT` | `STPOL_049_REQUEST_TASK_LIFECYCLE` | `FXBP_049_REQUEST_OUTBOUND_DOCUMENT` |

## Exchange Bundle Policies

| Bundle policy | Direction | Legal bundle types | Adapter profiles |
| --- | --- | --- | --- |
| `FXBP_049_REQUEST_OUTBOUND_DOCUMENT` | `outbound` | `document` | `ACP_049_CLINICAL_REQUEST_INTERCHANGE` |
| `FXBP_049_SECURE_MESSAGE_OUTBOUND_MESSAGE` | `outbound` | `message` | `ACP_049_SECURE_MESSAGE_DISPATCH` |
| `FXBP_049_BOOKING_PARTNER_OUTBOUND_MESSAGE` | `outbound` | `message` | `ACP_049_GP_BOOKING_SUPPLIER_FHIR` |
| `FXBP_049_HUB_PARTNER_OUTBOUND_MESSAGE` | `outbound` | `message` | `ACP_049_HUB_PARTNER_CAPACITY_EXCHANGE` |
| `FXBP_049_PHARMACY_REFERRAL_OUTBOUND_MESSAGE` | `outbound` | `message`, `document` | `ACP_049_PHARMACY_REFERRAL_TRANSPORT` |
| `FXBP_049_PARTNER_CALLBACK_INBOUND_COLLECTION` | `inbound` | `collection`, `message` | `ACP_049_PARTNER_CALLBACK_INGRESS` |
| `FXBP_049_AUDIT_COMPANION_EXPORT_DOCUMENT` | `outbound` | `document`, `collection` | `ACP_049_ASSURANCE_AUDIT_EXPORT` |
