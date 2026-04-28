# 34 Actual Provider Shortlist And Due Diligence

        Real-provider work remains gated, but the market research and ranking are current enough to drive seq_035 deliberately instead of guessing later.

        ## Recommended Strategy

        - strategy: `split_vendor_preferred_with_local_scan_bias`
        - label: Split providers, keep local scan bias available
        - summary: Use a focused transcription provider and a separate artifact-scanning provider later. Keep the canonical mock lane internal, reject any automatic single-suite winner, and prefer self-hosted or local scanning when quarantine and residency constraints outweigh procurement simplicity.
        - no-purchase rule: this task does not authorize any real sign-up, project creation, spend, or PHI upload

        ## Shortlisted Providers

        ### Transcription

| Vendor ID | Vendor | Actual score | Webhooks | Region | Retention and deletion notes |
| --- | --- | --- | --- | --- | --- |
| assemblyai_transcription | AssemblyAI | 80 | yes | yes | Transcript deletion removes uploaded files; region selection and private deployment reduce retention ambiguity. |
| deepgram_transcription | Deepgram | 80 | yes | yes | Hosted service can callback results; private and self-hosted deployment options reduce retention lock-in. |

### Artifact Scanning

| Vendor ID | Vendor | Actual score | Webhooks | Region | Retention and deletion notes |
| --- | --- | --- | --- | --- | --- |
| aws_guardduty_s3_scan | GuardDuty Malware Protection for S3 | 82 | yes | yes | Results stay in AWS control planes and S3 tags/events instead of direct file round-trips through a vendor callback endpoint. |
| opswat_metadefender_cloud | OPSWAT MetaDefender Cloud | 76 | no | yes | Cloud-service regions and explicit API posture are documented; file handling remains more controllable than threat-intel-first services. |

        ## Candidates Kept For Reference

        | Vendor ID | Vendor | Family | Why not shortlisted |
| --- | --- | --- | --- |
| aws_transcribe_transcription | Amazon Transcribe | transcription | Amazon Transcribe has strong partial-result semantics, but the lack of first-class callback delivery and the S3/KMS coupling make it a weaker seq_035 handoff than the shortlist pair. |
| azure_speech_transcription | Azure AI Speech | transcription | Azure is technically credible and safer on storage and privacy than a toy API, but seq_035 would inherit storage, networking, and tenant setup before the product-side adapter is ready. |
| cloudmersive_virus_scan | Cloudmersive Virus Scan API | artifact_scanning | Useful portable API-key scanner, but it scores below the shortlist because it is lighter on explicit asynchronous evidence states and webhook-friendly eventing. |

        ## Rejections

        | Vendor ID | Vendor | Family | Kill switch |
| --- | --- | --- | --- |
| google_speech_transcription | Google Cloud Speech-to-Text | transcription | Official product posture warns against entering sensitive, confidential, or personal information; that is incompatible with this evidence-processing seam until clarified with stronger contract evidence. |
| virustotal_private_scanning | VirusTotal Private Scanning | artifact_scanning | Threat-intel-oriented scanning and weaker quarantine workflow fit make it a poor match for governed patient-evidence intake. |
| aws_evidence_stack | AWS Evidence Stack | combined | A single AWS stack would over-couple transcript and scan failure domains, storage posture, and onboarding friction before the adapter contract is frozen. |

        ## Seq_035 Handoff

        - transcription provisioning should prepare project or account creation, API keys, callback endpoints, region choice, and retention deletion posture
        - artifact-scanning provisioning should prepare either protection-plan onboarding or API-tenant setup, quarantine event hooks, region choice, and spend limits
        - combined-suite provisioning is intentionally out of scope
