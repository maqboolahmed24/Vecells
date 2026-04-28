# 35 Transcription And Scanning Project Field Map

        This field map joins the shortlisted providers from seq_034 to the live-gated project model used in seq_035.

        Section A — `Mock_now_execution`

        The mock lab uses the same field identifiers as the later real-provider plan so UI, dry-run harnesses, and validators stay aligned.

        Sample transcription fields:

        | Field | Targets | Label | Requirement | Placeholder |
| --- | --- | --- | --- | --- |
| FLD_TRANS_VENDOR_ID | assemblyai_transcription, deepgram_transcription | Provider vendor | required | assemblyai_transcription |
| FLD_TRANS_PROJECT_SCOPE | assemblyai_transcription, deepgram_transcription | Project scope | required | transcript_nonprod_workspace |
| FLD_TRANS_ENVIRONMENT | assemblyai_transcription, deepgram_transcription | Environment profile | required | provider_like_preprod |
| FLD_TRANS_NAMED_APPROVER | assemblyai_transcription, deepgram_transcription | Named approver | required_for_live | ROLE_SECURITY_LEAD |
| FLD_TRANS_WEBHOOK_BASE | assemblyai_transcription, deepgram_transcription | Webhook base URL | required | https://example.invalid/transcript |
| FLD_TRANS_WEBHOOK_SECRET | assemblyai_transcription, deepgram_transcription | Webhook secret ref | required | vault://evidence/transcript/webhook |
| FLD_TRANS_REGION_POLICY | assemblyai_transcription, deepgram_transcription | Region policy ref | required | REGION_EU_TRANSCRIPT_ONLY |
| FLD_TRANS_RETENTION_POLICY | assemblyai_transcription, deepgram_transcription | Retention policy ref | required | RET_TRANSCRIPT_TRANSIENT_24H |
| FLD_TRANS_PARTIAL_MODE | assemblyai_transcription, deepgram_transcription | Partial results mode | required | enabled |
| FLD_TRANS_SPEND_CAP | assemblyai_transcription, deepgram_transcription | Spend-cap reference | required_for_live | billing://speech/nonprod |
| FLD_TRANS_DELETE_CONFIRM | assemblyai_transcription, deepgram_transcription | Delete confirmation sink | required | evidence-audit:delete-confirmation |
| FLD_AAI_API_KEY | assemblyai_transcription | AssemblyAI API key ref | required_for_live | vault://assemblyai/api-key |
| FLD_AAI_HEADER_NAME | assemblyai_transcription | Webhook auth header name | required | x-vecells-assemblyai-auth |
| FLD_AAI_HEADER_VALUE | assemblyai_transcription | Webhook auth header value ref | required | vault://assemblyai/webhook-auth |
| FLD_AAI_REGION | assemblyai_transcription | Region selection | required | eu |
| FLD_AAI_PRIVATE_MODE | assemblyai_transcription | Private deployment mode | review_required | hosted_default |

        Sample artifact-scanning fields:

        | Field | Targets | Label | Requirement | Placeholder |
| --- | --- | --- | --- | --- |
| FLD_SCAN_VENDOR_ID | aws_guardduty_s3_scan, opswat_metadefender_cloud | Scan vendor | required | aws_guardduty_s3_scan |
| FLD_SCAN_PROJECT_SCOPE | aws_guardduty_s3_scan, opswat_metadefender_cloud | Scan project scope | required | scan_nonprod_workspace |
| FLD_SCAN_BUCKET_REF | aws_guardduty_s3_scan, opswat_metadefender_cloud | Storage bucket ref | required | s3://vecells-evidence-nonprod |
| FLD_SCAN_PREFIX_SCOPE | aws_guardduty_s3_scan, opswat_metadefender_cloud | Object prefix scope | required | incoming/evidence/ |
| FLD_SCAN_REGION_POLICY | aws_guardduty_s3_scan, opswat_metadefender_cloud | Region policy ref | required | REGION_AWS_EU_SCAN_PLAN |
| FLD_SCAN_RETENTION_POLICY | aws_guardduty_s3_scan, opswat_metadefender_cloud | Retention policy ref | required | RET_QUARANTINE_14D |
| FLD_SCAN_QUARANTINE_POLICY | aws_guardduty_s3_scan, opswat_metadefender_cloud | Quarantine policy ref | required | QUARANTINE_HOLD_UNTIL_CLEAN |
| FLD_SCAN_CALLBACK_BASE | aws_guardduty_s3_scan, opswat_metadefender_cloud | Scan callback base URL | required | https://example.invalid/scan |
| FLD_SCAN_CALLBACK_SECRET | aws_guardduty_s3_scan, opswat_metadefender_cloud | Scan callback secret ref | required | vault://scan/webhook |
| FLD_SCAN_NAMED_APPROVER | aws_guardduty_s3_scan, opswat_metadefender_cloud | Named approver | required_for_live | ROLE_SECURITY_LEAD |
| FLD_SCAN_SPEND_CAP | aws_guardduty_s3_scan, opswat_metadefender_cloud | Spend-cap reference | required_for_live | billing://scan/nonprod |
| FLD_GD_ACCOUNT_ID | aws_guardduty_s3_scan | AWS account id | required_for_live | 111111111111 |
| FLD_GD_PLAN_NAME | aws_guardduty_s3_scan | Protection plan name | required | vecells-nonprod-evidence |
| FLD_GD_IAM_ROLE | aws_guardduty_s3_scan | IAM role ref | required | iam://guardduty-s3-malware-role |
| FLD_GD_EVENTBUS | aws_guardduty_s3_scan | EventBridge bus ref | required | eventbridge://vecells-evidence |
| FLD_GD_TAG_PREFIX | aws_guardduty_s3_scan | Result tag prefix | required | guardduty:malware-protection |

        Section B — `Actual_provider_strategy_later`

        Real project setup remains blocked until the field map is fully populated with:
        - secret references rather than literal secrets
        - explicit region and retention policy refs
        - bucket or object-prefix scope for scan providers
        - named webhook endpoints and callback authenticity handles
        - named approver and spend owner references
