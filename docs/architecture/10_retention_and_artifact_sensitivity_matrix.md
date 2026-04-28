# 10 Retention And Artifact Sensitivity Matrix

Retention, deletion, archive, and replay evidence are now separate governed artifact families rather than an ordinary document bucket.

## Retention Classes

| Class | Display name | Disposition posture | Export posture |
| --- | --- | --- | --- |
| RET_PRE_SUBMIT_TRANSIENT | Pre-submit transient capture | Narrower retention than submitted clinical work unless policy upgrade proves clinical materiality. | Summary-first; never ordinary byte download. |
| RET_CLINICAL_CASE_ARTIFACT | Clinical case artifact | Governed clinical retention; deletion blocked by holds, replay-critical evidence, or active assurance graph dependency. | Artifact contract, parity, and grant governed. |
| RET_SUPPORT_INVESTIGATION_EVIDENCE | Support and investigation evidence | Preservation-first; deletion blocked while the current investigation or replay scope depends on the evidence set. | Masked replay or scope-bound export only. |
| RET_WORM_AUDIT_GOVERNANCE | WORM audit governance | Append-only and export-governed; ordinary delete paths forbidden. | Investigation envelope or governance pack only. |
| RET_RETENTION_GOVERNANCE_WITNESS | Retention governance witness | Retention and legal-hold control artifacts stay in governance scope even when underlying PHI is deleted or archived. | Governance summary or bounded evidence pack only. |
| RET_ASSURANCE_PACK_ARCHIVE | Assurance pack archive | Governance archive with completeness-verdict dependency checks before disposition. | Governed pack or regulator-ready export only. |

## Artifact Matrix

| Artifact | Name | Sensitivity | Retention | Artifact ceiling | Transfer modes |
| --- | --- | --- | --- | --- | --- |
| ART_UPLOAD_ATTACHMENT | Uploads and attachments | clinical_sensitive | RET_PRE_SUBMIT_TRANSIENT | summary_only | structured_summary<br>governed_inline<br>support_recovery |
| ART_TELEPHONY_RECORDING | Telephony recordings | identity_proof_sensitive | RET_SUPPORT_INVESTIGATION_EVIDENCE | summary_only | governed_inline_masked<br>governed_handoff |
| ART_TELEPHONY_TRANSCRIPT | Telephony transcripts | clinical_sensitive | RET_SUPPORT_INVESTIGATION_EVIDENCE | governed_inline_masked | structured_summary<br>governed_inline_masked<br>governed_handoff |
| ART_EVIDENCE_SNAPSHOT | Evidence snapshots | clinical_sensitive | RET_SUPPORT_INVESTIGATION_EVIDENCE | summary_only | structured_summary<br>governed_inline_masked<br>governed_handoff |
| ART_DERIVATION_PACKAGE | Derivation packages and normalization packages | audit_investigation_restricted | RET_SUPPORT_INVESTIGATION_EVIDENCE | summary_only | structured_summary<br>governed_handoff |
| ART_SUMMARY_PARITY_WITNESS | Summary and parity witnesses | audit_investigation_restricted | RET_WORM_AUDIT_GOVERNANCE | summary_only | structured_summary<br>governed_inline_masked |
| ART_RECORD_ARTIFACT | Record artifacts, letters, and results | clinical_sensitive | RET_CLINICAL_CASE_ARTIFACT | governed_download | structured_summary<br>governed_inline<br>governed_download<br>governed_handoff |
| ART_DELETION_CERTIFICATE | Deletion certificates | retention_governance_restricted | RET_RETENTION_GOVERNANCE_WITNESS | summary_only | structured_summary<br>governed_handoff |
| ART_ARCHIVE_MANIFEST | Archive manifests | retention_governance_restricted | RET_RETENTION_GOVERNANCE_WITNESS | summary_only | structured_summary<br>governed_handoff |
| ART_AUDIT_REPLAY_BUNDLE | Audit, replay, and investigation evidence bundles | audit_investigation_restricted | RET_SUPPORT_INVESTIGATION_EVIDENCE | governed_handoff | structured_summary<br>governed_inline_masked<br>governed_handoff |
| ART_ASSURANCE_PACK | Assurance packs and governance evidence packs | retention_governance_restricted | RET_ASSURANCE_PACK_ARCHIVE | governed_handoff | structured_summary<br>governed_handoff |

## Required Closures

- Uploads, recordings, transcripts, snapshots, derivation packages, parity witnesses, record artifacts, deletion certificates, archive manifests, and replay bundles each have explicit retention and disclosure posture.
- Deletion certificates and archive manifests stay governance witnesses and are not treated as patient-facing ordinary docs.
- Export posture depends on redaction transforms, admissibility graph completeness, and the active scope envelope.
