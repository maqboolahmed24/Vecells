# 246 Conversation Digest, Composer, and Settlement

## Purpose

`246` establishes one backend control plane for the patient conversation surface:

- `PatientConversationPreviewDigest`
- `PatientComposerLease`
- `PatientUrgentDiversionState`
- `ConversationCommandSettlement`

The service lives in [services/command-api/src/phase3-conversation-control.ts](/Users/test/Code/V/services/command-api/src/phase3-conversation-control.ts) and is backed by the pure kernel in [packages/domains/communications/src/phase3-conversation-control-kernel.ts](/Users/test/Code/V/packages/domains/communications/src/phase3-conversation-control-kernel.ts).

## Control-plane rules

### Digest authority

Preview posture is derived only from the published tuple compatibility snapshot. The digest does not infer calmness from:

- local draft presence
- scroll position
- support acknowledgements
- transport acceptance alone

If the tuple is missing, placeholder, stale, blocked, or recovery-only, the digest degrades in place to bounded recovery posture.

### One live composer

Only one `PatientComposerLease` may be live for a cluster. Refresh, reconnect, or duplicate deep-link entry reuses the current lease and keeps:

- the existing draft ref
- the selected anchor
- the route-intent binding
- the continuity evidence ref

### Urgent diversion freezes composition

`PatientUrgentDiversionState` is not a banner. When async interaction becomes unsafe, the kernel:

- freezes composition
- preserves the active draft and anchor
- makes the diversion guidance dominant
- forces digest outcome to `recovery_required`

### Shared settlement grammar

Every callback or message mutation returns one immutable `ConversationCommandSettlement` with four separate ladders:

- `result`
- `localAckState`
- `transportState`
- `externalObservationState`
- `authoritativeOutcomeState`

The application layer normalizes calm-looking inputs down to `stale_recoverable` or `blocked_policy` whenever tuple calmness is no longer valid.

## Staff mutation fences

Staff-originated settlements require the current `ReviewActionLease`. When composition, compare, or delivery-dispute review is active, the same mutation also requires:

- `WorkspaceFocusProtectionLease`
- live `ProtectedCompositionState`
- no invalidating drift

Stale queue context fails closed before a calmer settlement can be recorded.

## 246 to 247 seam

`246` treats the unified conversation tuple as an input, not a local rebuild target. The shared seam is published in [data/contracts/246_247_conversation_tuple_contract.json](/Users/test/Code/V/data/contracts/246_247_conversation_tuple_contract.json).

Until `247` materializes the full tuple producer, `246` accepts simulator-backed tuple publication through the compatibility route and degrades safely when tuple availability is not authoritative.
