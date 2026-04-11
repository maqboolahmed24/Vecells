# 35 Local Evidence Processing Lab Spec

        Task `seq_035` creates the `MOCK_EVIDENCE_GATE_LAB` workbench and the two local provider twins:
        `mock-transcription-engine` and `mock-artifact-scan-gateway`.

        Summary:
        - field-map rows: `49`
        - job profiles: `10`
        - scan and quarantine policy rows: `12`
        - live gates: `11`
        - transcript scenarios: `5`
        - scan scenarios: `5`

        Section A — `Mock_now_execution`

        The local lab exists to rehearse evidence-processing law now:
        - transcript states remain differentiated across `queued`, `partial`, `ready`, `failed`, and `superseded`
        - scan states remain differentiated across `clean`, `suspicious`, `quarantined`, `unreadable`, and `failed`
        - callback or event arrival stays non-authoritative until Vecells re-checks policy, quarantine, and evidence readiness
        - local and preview profiles never require live provider credentials, accounts, or billable project creation

        Environment profiles:

        | Environment | Label | Purpose |
| --- | --- | --- |
| local | Local rehearsal | Pure local simulator mode with no provider traffic. |
| preview | Preview UI rehearsal | Local simulator with preview-grade route and inspector behavior. |
| provider_like_preprod | Provider-like preprod | Still mock-first, but shaped around the shortlisted provider surfaces and explicit region/retention policy. |
| actual_later | Actual provider later | Disabled live posture blocked until gates and flags pass. |

        Core job profiles:

        | Profile | Family | Environment | Input | State family |
| --- | --- | --- | --- | --- |
| JOB_TRANS_VOICE_CALLBACK_LOCAL | transcription | local | voice_recording_wav | queued|partial|ready|failed|superseded |
| JOB_TRANS_VOICE_CALLBACK_PROVIDER_PREVIEW | transcription | provider_like_preprod | voice_recording_m4a | queued|partial|ready|failed|superseded |
| JOB_TRANS_ATTACHMENT_AUDIO_PORTAL | transcription | preview | portal_audio_attachment | queued|partial|ready|failed|superseded |
| JOB_TRANS_RETRANSCRIBE_SUPERSEDE | transcription | local | operator_selected_audio | queued|partial|ready|failed|superseded |
| JOB_TRANS_SCAN_DEPENDENT_HOLD | transcription | provider_like_preprod | artifact_extracted_audio | queued|partial|ready|failed|superseded |
| JOB_SCAN_PORTAL_UPLOAD_CLEAN | artifact_scanning | local | portal_document_pdf | clean|suspicious|quarantined|unreadable|failed |
| JOB_SCAN_PORTAL_UPLOAD_SUSPICIOUS | artifact_scanning | preview | portal_image_attachment | clean|suspicious|quarantined|unreadable|failed |
| JOB_SCAN_PORTAL_UPLOAD_QUARANTINE | artifact_scanning | provider_like_preprod | patient_attachment_archive | clean|suspicious|quarantined|unreadable|failed |
| JOB_SCAN_UNREADABLE_REACQUIRE | artifact_scanning | local | corrupt_attachment_blob | clean|suspicious|quarantined|unreadable|failed |
| JOB_SCAN_STORAGE_BUCKET_PROVIDER_LIKE | artifact_scanning | provider_like_preprod | s3_object_event | clean|suspicious|quarantined|unreadable|failed |

        Section B — `Actual_provider_strategy_later`

        Real project or workspace creation stays fail-closed in this task.
        It is blocked unless all of the following remain true at execution time:
        - the chosen provider is on the seq_034 shortlist
        - region, retention, and deletion posture are explicit
        - webhook or event authenticity and replay controls are frozen
        - bucket or storage scope is explicit where relevant
        - a named approver and target environment are present
        - `ALLOW_REAL_PROVIDER_MUTATION=true`
        - `ALLOW_SPEND=true` where provider actions are billable

        The real-later pack therefore treats provider projects as evidence-processing control-plane objects rather than generic admin setup.
