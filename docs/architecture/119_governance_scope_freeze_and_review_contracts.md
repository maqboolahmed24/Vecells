# 119 Governance Scope Freeze And Review Contracts

## Scope ribbon contract

The seed `ScopeRibbon` remains visible across every governance route and is bound to one active scope token.

It always surfaces:

- tenant
- organisation
- environment
- purpose-of-use
- current review object
- freeze posture
- write or recovery state

## Freeze disposition grammar

| Disposition | Surface posture | Meaning |
| --- | --- | --- |
| `writable` | `live` | review and promotion may proceed |
| `review_only` | `read_only` | the package is still visible but not writable |
| `scope_drift` | `blocked` | organisation or purpose drift froze the shell in place |
| `freeze_conflict` | `recovery_only` | release, publication, or compatibility drift suppressed live action |

`GovernanceFreezeDisposition` is the only authority for these states. No local form state, toast, or optimistic preview is allowed to override it.

## Review acknowledgement contract

Promotion from a diff-heavy route to an approval-heavy route preserves the same continuity frame but requires anchor acknowledgement.

- origin anchor: `governance-diff`
- promoted anchor: `governance-approval`
- required presentation: visible diff-anchor stub and review acknowledgement notice
- release rule: the promoted approval anchor becomes dominant only after explicit acknowledgement

## Return intent contract

When a diff route opens a promoted approval route, the shell mints one `GovernanceReturnIntentToken`.

- return path stays inside the same shell
- the previous route and selected object are preserved
- returning does not widen or silently refresh scope

## Evidence and release tuple safety

- evidence bundles remain summary-first in the same shell
- release tuple, publication parity, compatibility, and watch posture remain visible beside approvals
- scope drift, publication drift, or watch drift fail closed to blocked or recovery-only posture rather than detaching the operator into a new page
