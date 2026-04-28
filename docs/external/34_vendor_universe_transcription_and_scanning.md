# 34 Vendor Universe Transcription And Scanning

        This pack freezes the vendor universe for the evidence-processing seam before seq_035 attempts any real project provisioning. It keeps transcript readiness, artifact quarantine, fallback review, and audit export as product contracts rather than provider conveniences.

        ## Summary

        - vendor rows: 13
        - lane counts: {"shortlisted": 4, "candidate": 3, "mock_only": 3, "rejected": 3}
        - evidence rows: 34
        - selected mock rows: 3
        - Phase 0 entry posture inherited from seq_020: `withheld`
        - recommended strategy: `split_vendor_preferred_with_local_scan_bias`

        ## Family Coverage

        | Family | Rows | Lanes | Shortlisted |
| --- | --- | --- | --- |
| transcription | 6 | candidate,mock_only,rejected,shortlisted | deepgram_transcription,assemblyai_transcription |
| artifact_scanning | 5 | candidate,mock_only,rejected,shortlisted | aws_guardduty_s3_scan,opswat_metadefender_cloud |
| combined | 2 | mock_only,rejected | none |

        ## Vendor Universe

        | Vendor ID | Vendor | Family | Lane | Actual score | Quarantine score | Webhooks | Region controls | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| vecells_transcript_readiness_twin | Vecells Transcript Readiness Twin | transcription | mock_only | 99 | 97 | yes | yes | Canonical local transcription twin. It must preserve readiness, coverage class, quality band, and supersession semantics before any real provider is admissible. |
| deepgram_transcription | Deepgram | transcription | shortlisted | 80 | 78 | yes | yes | Focused transcription provider with strong async and streaming support. Callback authenticity remains a bounded weakness, so Vecells must treat callbacks as hints and re-fetch job state before promotion. |
| assemblyai_transcription | AssemblyAI | transcription | shortlisted | 80 | 76 | yes | yes | AssemblyAI is strong on job callbacks, EU region selection, and deletion semantics. Like Deepgram, callback trust still needs Vecells-side replay fencing and trusted re-fetch. |
| azure_speech_transcription | Azure AI Speech | transcription | candidate | 74 | 74 | yes | yes | Azure is technically credible and safer on storage and privacy than a toy API, but seq_035 would inherit storage, networking, and tenant setup before the product-side adapter is ready. |
| aws_transcribe_transcription | Amazon Transcribe | transcription | candidate | 74 | 70 | no | yes | Amazon Transcribe has strong partial-result semantics, but the lack of first-class callback delivery and the S3/KMS coupling make it a weaker seq_035 handoff than the shortlist pair. |
| google_speech_transcription | Google Cloud Speech-to-Text | transcription | rejected | 65 | 55 | no | yes | This is not a product-capability rejection. It is a current-official-docs rejection for this healthcare evidence-processing seam. |
| vecells_artifact_quarantine_twin | Vecells Artifact Quarantine Twin | artifact_scanning | mock_only | 98 | 99 | yes | yes | Canonical local artifact-scan twin. It must preserve clean, suspicious, quarantined, unreadable, and failed outcomes without silently passing evidence onward. |
| aws_guardduty_s3_scan | GuardDuty Malware Protection for S3 | artifact_scanning | shortlisted | 82 | 93 | yes | yes | Best fit for quarantine-first artifact handling because results are event-driven, taggable, and explicit about failure or unsupported states. The tradeoff is AWS account coupling. |
| opswat_metadefender_cloud | OPSWAT MetaDefender Cloud | artifact_scanning | shortlisted | 76 | 88 | no | yes | Strong multi-engine scan vendor with explicit API docs and region story. It is weaker than GuardDuty on event-driven posture but stronger than lighter-weight API scanners for quarantine evidence. |
| cloudmersive_virus_scan | Cloudmersive Virus Scan API | artifact_scanning | candidate | 66 | 72 | no | yes | Useful portable API-key scanner, but it scores below the shortlist because it is lighter on explicit asynchronous evidence states and webhook-friendly eventing. |
| virustotal_private_scanning | VirusTotal Private Scanning | artifact_scanning | rejected | 41 | 40 | no | limited | Rejected because the operational model fits analyst triage better than patient-evidence quarantine and bounded review. |
| vecells_evidence_signal_fabric | Vecells Evidence Signal Fabric | combined | mock_only | 98 | 98 | yes | yes | Combined internal mock lane only. It exists to prove readiness, quarantine, and fallback semantics before any live vendor is trusted. |
| aws_evidence_stack | AWS Evidence Stack | combined | rejected | 69 | 68 | partial | yes | Rejected as the default suite winner. Individual AWS services remain viable where their family-specific fit is strong. |
