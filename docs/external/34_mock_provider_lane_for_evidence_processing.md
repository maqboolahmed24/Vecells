# 34 Mock Provider Lane For Evidence Processing

        The mock-now lane is intentionally stronger than a toy stub. Its job is to prove evidence-processing semantics before any real provider is allowed to shape product truth.

        ## Selected Mock Lane

        - transcription twin: `vecells_transcript_readiness_twin`
        - artifact-scan twin: `vecells_artifact_quarantine_twin`
        - combined mock signal fabric: `vecells_evidence_signal_fabric`
        - shared callback law: provider callbacks are hints only; Vecells re-fetches trusted job state before readiness or quarantine promotion
        - Phase 0 posture: `withheld`

        ## Fidelity Law

        The mock lane must preserve:

        - transcript states: `not_started | queued | running | partial | ready | failed | superseded`
        - transcript quality bands: `fragmentary | reviewable | safety_usable`
        - coverage classes: `identity_phrase | symptom_phrase | medication_phrase | callback_number | freeform_narrative`
        - scan outcomes: `clean | suspicious | quarantined | unreadable | failed`
        - artifact-hash and provenance hooks
        - fallback review whenever transcript or scan meaning is insufficient
        - no direct elevation from processing success to clinical truth

        ## Selected Access Rows

        | Row | Dependency | Class | Lane | Notes |
| --- | --- | --- | --- | --- |
| ACC_SCAN_SHARED_DEV_PRINCIPAL | malware_scanning | service_principal | mock_now | Mock scanning project principal for quarantine workflow rehearsal. |
| DATA_SCAN_SHARED_DEV_SIGNATURE_PACK | malware_scanning | sandbox_dataset | mock_now | Synthetic malware-signature corpus and known-bad evidence pack. |
| ACC_TRANSCRIPT_SHARED_DEV_PRINCIPAL | transcription | service_principal | mock_now | Mock transcription project principal for readiness-state rehearsal. |
| SEC_TRANSCRIPT_SHARED_DEV_WEBHOOK | transcription | webhook_secret | mock_now | Mock transcript completion callback secret. |

        ## Why Internal Mock First

        - provider completion does not equal evidence readiness
        - scan completion does not equal safety or readability
        - replay, supersession, contradiction, and quarantine promotion need deterministic local fixtures before live services are safe to evaluate
        - seq_035 must provision later from this contract, not replace it
