# 352 External Reference Notes

Reviewed on 2026-04-23 for task `par_352_phase6_track_backend_build_pharmacy_outcome_ingest_update_record_observation_and_reconciliation_pipeline`.

These sources were used as secondary support only. The local blueprint remained authoritative where repository law was more specific.

## Borrowed

1. GP Connect: Update Record  
   URL: https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record  
   Borrowed: community pharmacy consultation summaries, including medicines supplied, arrive as structured updates into GP workflow for filing rather than as ad hoc free text. This reinforced the dedicated `gp_workflow_observation` source family and the need to preserve workflow provenance.

2. GP Connect: Update Record API catalogue  
   URL: https://digital.nhs.uk/developer/api-catalogue/gp-connect-update-record  
   Borrowed: the backend should preserve an API-shaped structured ingress family distinct from email or manual capture, even when later adapters are still mocked locally.

3. GP Connect transparency notice appendix 2  
   URL: https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/transparency-notice/appendix-2  
   Borrowed: the structured write-back can contain medications and clinical summary content, which justified preserving source-specific provenance and not downgrading all inbound outcomes to operational-only evidence.

4. Message Exchange for Social Care and Health (MESH)  
   URL: https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh  
   Borrowed: inbound secure-message provenance must preserve transport family and mailbox or workflow identity because MESH is the nationally recognised direct sharing mechanism and later ops work needs that provenance for trust and replay handling.

5. Message Exchange for Social Care and Health API  
   URL: https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api  
   Borrowed: secure transport is system-to-system and message oriented, which reinforced immutable envelope capture and replay-safe dedupe before workflow mutation.

6. Community pharmacy advanced service specification: NHS Pharmacy First Service  
   URL: https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/  
   Borrowed: the outcome model must preserve routine completion, medicine supply, onward referral, urgent escalation, and inability-to-complete pathways instead of flattening outcomes into a generic resolved or failed boolean.

7. Practices referring patients to Pharmacy First for lower acuity minor illnesses and clinical pathway consultations  
   URL: https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/  
   Borrowed: if symptoms suggest something more serious the pharmacist arranges urgent GP or urgent-care follow-on, which reinforced the explicit `reopened_for_safety` branch instead of a calm completion heuristic.

8. Digital clinical safety assurance  
   URL: https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/  
   Borrowed: replay, audit, and settlement behaviour should be explicit and documented because outcome ingest is part of a clinical-risk-managed digital workflow rather than a best-effort mailbox consumer.

9. Applicability of DCB0129 and DCB0160: step by step guidance  
   URL: https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance  
   Borrowed: keep the evidence trail explicit enough for hazard-log and assurance review, which supported append-only envelopes, ingest attempts, settlements, and audit events.

10. HL7 FHIR R4 Observation  
    URL: https://www.hl7.org/fhir/r4/observation.html  
    Borrowed: structured observations are durable clinical statements and should retain coded provenance and chronology as first-class evidence rather than being collapsed into UI-local booleans.

## Explicitly rejected or constrained

- I did not let the existence of GP workflow filing imply that every structured outcome should auto-resolve; the local blueprint still requires correlation-first matching, replay handling, contradiction checks, and explicit review posture.
- I did not let MESH or mailbox transport imply trust on its own; low-assurance email and manual capture remain bounded by trust floor and review policy.
- I did not treat routine completion outcomes as silent success. They only settle to calm completion after authoritative settlement and truth projection.
- I did not let external operational guidance replace the local Phase 0 and Phase 6 truth models for replay, settlement, or reopen branching.
