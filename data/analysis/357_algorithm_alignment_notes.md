# 357 Algorithm Alignment Notes

## Goal

Map the validated `347` eligibility outputs onto one UI explanation layer with two disclosure levels.

## Field Alignment

| Source field | Staff disclosure | Patient disclosure | Notes |
| --- | --- | --- | --- |
| `evaluation.finalDisposition` | explicit route posture | short route outcome copy | never diverges |
| `evaluation.rulePackVersion` | visible in `EligibilityVersionChip` | visible in compact version chip | same value both sides |
| `explanationBundle.patientFacingReason.summaryText` | available for parity checks | primary patient summary | patient-safe source text |
| `explanationBundle.patientFacingReason.nextStepText` | visible in parity checks | patient next-step sentence | used in same shell |
| `explanationBundle.staffFacingReason.summaryText` | visible | hidden from patient | explains causal blocker |
| `evaluation.matchedRuleIds` | visible in staff evidence disclosure only | redacted | patient copy must not leak raw rule IDs |
| `evaluation.thresholdSnapshot` | visible in staff evidence disclosure only | redacted | technical only |
| `evaluation.sharedEvidenceHash` | visible | hidden from patient copy, still bound in DOM marker | parity anchor |
| `decisionTupleHash` | visible in evidence drawer | hidden from patient copy, still bound in DOM marker | stable proof selector |

## Gate Order

The staff ladder keeps one immutable causal order:

1. age and sex gate
2. named pathway fit
3. exclusions and red flags
4. evidence completeness
5. minor-illness fallback
6. final routing

This order never changes between patient and staff surfaces.
Only disclosure changes.

## Publication States

- `current`: normal explanation surface
- `superseded`: show `EligibilitySupersessionNotice`, keep the explainer visible, freeze calm or writable implication
- `stale`: same as superseded but worded as awaiting refresh rather than replaced

## Copy Rules

- patient copy uses `patientFacingReason` text and next-step text
- staff copy may add causal blocker language from `staffFacingReason`
- patient surface never shows threshold IDs, score labels, or raw rule IDs
