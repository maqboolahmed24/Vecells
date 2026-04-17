# 93 PHI Safe Telemetry And Causality Rules

## Disclosure Classes

The shared telemetry SDK now treats disclosure class as executable policy:

- `control_plane_safe`
  Stable runtime refs, ports, queue refs, ids, and policy-safe state.
- `public_descriptor`
  UI-safe posture and route descriptors that contain no subject or artifact payload.
- `phi_reference_only`
  Subject-bearing identifiers that are emitted only as digests.
- `masked_contact_descriptor`
  Contact descriptors emitted only in masked form.
- `masked_route_descriptor`
  Route-sensitive descriptors emitted only in hashed or masked form.
- `audit_link_only`
  Immutable refs that are admissible only as ledger or settlement joins.
- `blocked_raw_phi`
  Explicitly illegal outside the source authority; emission fails closed.

## Causality Law

The runtime and browser layers share one causality chain:

- `UIEventCausalityFrame`
  The continuity frame for live, restored, replayed, and stale-visible UI behavior.
- `UIEventEmissionCheckpoint`
  The deterministic ordering primitive for replay-safe event sequencing.
- `UIProjectionVisibilityReceipt`
  The proof of what projection state, shell-decision class, and anchor posture became visible.
- `UITransitionSettlementRecord`
  The authoritative transition settlement join that prevents local UI acknowledgement from masquerading as settled truth.

## Fail-Closed Rules

- Protected internal runtime routes require propagated edge correlation context.
- Missing context is surfaced as an explicit blocked chain, not as a freshly minted internal trace.
- Blocked disclosure is surfaced as a governed UI and audit state, not as silent field omission.
- Replayed and restored flows retain the same causality frame instead of creating fake fresh activity.

## Replay And Restore Requirements

Telemetry must be sufficient to reconstruct:

- selected-anchor restore
- replay-safe support recovery
- stale-visible UI downgrade
- projection-visible acceptance versus authoritative settlement
- disclosure-fence refusal

The SDK and generated explorer artifacts are now the authoritative rehearsal path for those cases in local, CI, and preview rings.

