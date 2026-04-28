# 63 Evidence Immutability And Parity Rules

The Phase 0 evidence pipeline now runs under explicit append-only law. Source capture freezes first, derivations append next, parity records gate authority, and snapshots supersede by new rows only.

## Non-Negotiables

- `EvidenceCaptureBundle` freezes before canonical normalization, transcript generation, fact extraction, or summary generation.
- Existing evidence rows are immutable. Later work appends new `EvidenceDerivationPackage`, `EvidenceRedactionTransform`, `EvidenceSummaryParityRecord`, or `EvidenceSnapshot` rows.
- Redaction transforms preserve the source checksum chain and redaction policy version.
- `parityState = verified` is the only legal authoritative-summary posture.
- `technical_only` and `operational_nonclinical` revisions stay unattached when policy allows.

## Invariant Matrix

| Invariant | Scope | Rule |
| --- | --- | --- |
| `INV_063_FREEZE_BEFORE_NORMALIZATION` | EvidenceCaptureBundle | Canonical normalization may not run before one immutable capture bundle exists. |
| `INV_063_CAPTURE_BUNDLE_APPEND_ONLY` | EvidenceCaptureBundle | Capture bundles are append-only rows and may never be rewritten in place. |
| `INV_063_DERIVATION_APPEND_ONLY` | EvidenceDerivationPackage | Late transcript, normalization, fact, and summary reruns append new derivation packages instead of mutating prior output. |
| `INV_063_REDACTION_IS_NONDESTRUCTIVE` | EvidenceRedactionTransform | Redaction narrows visibility through immutable transforms and preserves the source hash and redaction policy version. |
| `INV_063_PARITY_REQUIRED_FOR_AUTHORITY` | EvidenceSummaryParityRecord | Only parityState = verified may back an authoritative summary in an immutable snapshot. |
| `INV_063_PARITY_STATE_EXPLICIT` | EvidenceSummaryParityRecord | Summary parity records must resolve through explicit verified, stale, blocked, or superseded states. |
| `INV_063_SNAPSHOT_SINGLE_CURRENT` | EvidenceSnapshot | Each evidence lineage may resolve to at most one current EvidenceSnapshot; supersession must reference the current authority. |
| `INV_063_TECHNICAL_ONLY_UNATTACHED` | EvidenceAssimilationCoordinator | technical_only and operational_nonclinical revisions stay unattached when policy allows and do not mutate prior snapshot truth. |
| `INV_063_MATERIAL_CHANGE_SUPERSEDES` | EvidenceAssimilationCoordinator | Clinically material, triage, delivery, or patient-visible interpretation changes create a new immutable snapshot through append-only supersession. |
| `INV_063_REPLAY_CLASSES_PRESERVE_FROZEN_EVIDENCE` | EvidenceCaptureBundle | Replay and collision-review classes preserve immutable frozen evidence instead of skipping bundle freeze. |
