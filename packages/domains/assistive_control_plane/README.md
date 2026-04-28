# Assistive Control Plane

Phase 8 capability-control runtime for intended-use manifests, per-run invocation grants, composition policy, release state, kill-switch state, and assistive run settlement.

The package is fail-closed by design. It can admit, downgrade, block, or settle assistive runs, but it cannot widen rollout posture beyond release policy or convert assistive artifacts into authoritative workflow state.
