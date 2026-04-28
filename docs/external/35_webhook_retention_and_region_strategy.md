# 35 Webhook Retention And Region Strategy

        Seq_035 treats callback, event, retention, and region posture as first-class contract objects.

        Section A — `Mock_now_execution`

        Webhook profiles:

        | Webhook profile | Family | Transport | Auth model | Retry model |
| --- | --- | --- | --- | --- |
| WEBHOOK_TRANSCRIPT_ASSEMBLYAI | transcription | https_callback | custom_header_name_value | provider_retry_plus_trusted_refetch |
| WEBHOOK_TRANSCRIPT_DEEPGRAM | transcription | https_callback | vecells_refetch_and_endpoint_control | provider_callback_hint_plus_state_refetch |
| WEBHOOK_SCAN_GUARDDUTY_EVENTBRIDGE | artifact_scanning | eventbridge_event | aws_control_plane | event_delivery_plus_object_refetch |
| WEBHOOK_SCAN_OPSWAT_CALLBACK | artifact_scanning | callbackurl_post | callbackurl_plus_vecells_ingest_secret | provider_post_or_poll_refetch |

        Region policies:

        | Region policy | Family | Environments | Rule |
| --- | --- | --- | --- |
| REGION_MOCK_LOCAL_ONLY | transcription, artifact_scanning | local, preview | No external provider traffic; all assets stay local to the workstation or development host. |
| REGION_EU_TRANSCRIPT_ONLY | transcription | provider_like_preprod, actual_later | Real transcript jobs may run only when the provider project is explicitly fixed to an EU-compatible posture. |
| REGION_AWS_EU_SCAN_PLAN | artifact_scanning | provider_like_preprod, actual_later | GuardDuty protection plans must be attached only to EU-resident buckets aligned to the target trust zone. |
| REGION_OPSWAT_FORCED_EU | artifact_scanning | provider_like_preprod, actual_later | Use the EU Central API endpoint and block non-private processing for any patient-adjacent file. |

        Retention policies:

        | Retention policy | Artifact family | Window | Deletion trigger |
| --- | --- | --- | --- |
| RET_TRANSCRIPT_TRANSIENT_24H | transcript_payload | 24h | after_assimilation_or_failure_close |
| RET_TRANSCRIPT_REDACTED_7D | redacted_transcript_projection | 7d | manual_review_close |
| RET_SCAN_TAGS_30D | scan_result_envelope | 30d | audit_window_elapsed |
| RET_QUARANTINE_14D | quarantined_artifact | 14d | manual_release_or_destroy |

        Section B — `Actual_provider_strategy_later`

        Later real project creation is blocked until:
        - region policy is frozen and compatible with the shortlisted provider
        - retention and deletion policy are frozen and auditable
        - callback or event authenticity is wired to a secret or control-plane proof
        - quarantine policy is explicit for `suspicious`, `quarantined`, `unreadable`, and `failed`

        This closes the gap where provider admin work would otherwise be mistaken for safe evidence processing.
