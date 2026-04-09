# Requirement registry overview

The first-pass registry covers 1453 traceable requirement rows across 32 source files. It combines source-level governing statements, control-priority bullets, Phase 0 named contracts and invariants, phase test gates, audited baseline edge cases, and forensic gap-closure rows.

## Composition

| Dimension | Count |
| --- | --- |
| Canonical requirements | 1246 |
| Supporting requirements | 87 |
| Derived gap-closure requirements | 120 |

| Requirement type | Count |
| --- | --- |
| `accessibility` | 47 |
| `assurance` | 114 |
| `backend` | 19 |
| `content` | 7 |
| `domain_object` | 152 |
| `frontend` | 91 |
| `functional` | 8 |
| `invariant` | 65 |
| `privacy` | 3 |
| `runtime_release` | 56 |
| `security` | 23 |
| `state_machine` | 1 |
| `test` | 855 |
| `workflow` | 12 |

## Registry guarantees

- Every markdown and Mermaid source is present in the source manifest.
- Every named Phase 0 contract has a deterministic registry row.
- Mandatory phase test headings are converted into `test` requirements.
- Every forensic finding is represented as a derived gap-closure row.
- Mandatory edge cases from the task prompt are broken out as standalone rows rather than left implied.

## Highest-signal anchors

- The canonical backbone remains `SubmissionEnvelope -> SubmissionPromotionRecord -> Request -> RequestLineage` with `LifecycleCoordinator`-owned closure.
- Mutable post-submit behavior is fenced through `RouteIntentBinding`, `CommandActionRecord`, `CommandSettlementRecord`, `ReleaseApprovalFreeze`, `ChannelReleaseFreezeRecord`, and `AssuranceSliceTrustRecord`.
- Patient, staff, support, and governance surfaces inherit one shell, visibility, continuity, and recovery grammar instead of phase-local UI conventions.
- Audit findings are treated as mandatory patch requirements, not optional commentary.

## Top source contributors

| Source | Registry rows |
| --- | --- |
| `phase-0-the-foundation-protocol.md` | 274 |
| `phase-9-the-assurance-ledger.md` | 158 |
| `phase-8-the-assistive-layer.md` | 146 |
| `phase-4-the-booking-engine.md` | 133 |
| `phase-5-the-network-horizon.md` | 128 |
| `phase-6-the-pharmacy-loop.md` | 126 |
| `phase-3-the-human-checkpoint.md` | 124 |
| `forensic-audit-findings.md` | 121 |
| `phase-7-inside-the-nhs-app.md` | 97 |
| `phase-cards.md` | 62 |
| `ux-quiet-clarity-redesign.md` | 11 |
| `accessibility-and-content-system-contract.md` | 7 |
