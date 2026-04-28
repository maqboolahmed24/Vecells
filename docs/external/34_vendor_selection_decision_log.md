# 34 Vendor Selection Decision Log

        | Decision ID | Status | Title | Summary |
| --- | --- | --- | --- |
| DEC_EVID_001 | accepted | Split providers remain the default actual-later posture | Transcription and artifact scanning are kept independently selectable to prevent one vendor stack from becoming silent product truth. |
| DEC_EVID_002 | accepted | The internal mock lane stays authoritative for simulator fidelity | The transcript and scan twins are the development baseline, not disposable placeholders. |
| DEC_EVID_003 | accepted | Callback deliveries are hints, not proof | Even shortlisted providers may only advance readiness through Vecells-side job-state re-fetch and governed evidence assimilation. |
| DEC_EVID_004 | accepted | Google Cloud Speech-to-Text is rejected on current official posture | The current official product warning about sensitive or personal information is too strong to ignore for this seam. |
| DEC_EVID_005 | accepted | Threat-intel-first scanning is not enough for patient evidence quarantine | VirusTotal Private Scanning is rejected because quarantine workflow fit is weaker than the shortlist alternatives. |
| DEC_EVID_006 | accepted_with_guardrails | Local or self-hosted scanning still remains preferable in some deployments | If binary evidence cannot leave the platform trust boundary or a regulator demands deterministic quarantine control, keep scanning local and treat managed vendors as optional later augmentation. |

        ## Kill Switch Register

        | Kill switch | Family | Applies to | Rule | Triggered vendors |
| --- | --- | --- | --- | --- |
| KS_EVID_001 | transcription | mock_now_and_actual_later | Reject any provider or mock that cannot keep `partial`, `ready`, `failed`, and `superseded` transcript states explicit. | n/a |
| KS_EVID_002 | artifact_scanning | mock_now_and_actual_later | Reject any scan provider that cannot represent `clean`, `suspicious`, `quarantined`, `unreadable`, and `failed` outcomes separately. | n/a |
| KS_EVID_003 | transcription | actual_later | Reject any live transcription provider whose callbacks cannot be treated as hints followed by trusted state re-fetch or whose deletion posture is unclear. | n/a |
| KS_EVID_004 | artifact_scanning | actual_later | Reject any scan provider that cannot route unsafe or unreadable artifacts into explicit quarantine and fallback review. | n/a |
| KS_EVID_005 | transcription | actual_later | Reject any provider whose official product posture warns against entering sensitive or personal information without a stronger healthcare contract path. | google_speech_transcription |
| KS_EVID_006 | combined | actual_later | Reject any automatic single-suite winner if it couples transcript and scan failure domains more tightly than the adapter contract requires. | aws_evidence_stack |
| KS_EVID_007 | artifact_scanning | actual_later | Reject any provider where scan completion implies safety or readability without a separate Vecells readiness and quarantine decision. | n/a |
| KS_EVID_008 | transcription | actual_later | Reject any provider that makes transcript completion look like clinical usability instead of derived evidence awaiting readiness assessment. | n/a |
| KS_EVID_009 | artifact_scanning | actual_later | Reject threat-intel-oriented services when portability, file handling, or quarantine orchestration are weaker than the shortlist alternatives. | virustotal_private_scanning |
| KS_EVID_010 | transcription | actual_later | Reject any provider whose onboarding burden or cloud coupling would force seq_035 to choose storage, identity, and vendor stack together before the product contract is frozen. | n/a |
