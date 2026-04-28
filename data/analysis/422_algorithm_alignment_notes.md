# 422 Algorithm Alignment Notes

## Inputs

The surface consumes posture truth from:

- `AssistiveCapabilityTrustEnvelope`
- `AssistiveCapabilityRolloutVerdict`
- `AssistiveFreezeDisposition`
- `ReleaseRecoveryDisposition`
- `AssistiveCurrentPosture`

The frontend projection does not recompute trust. It maps fixture and runtime state into deterministic examples that preserve the 415 and 416 contract vocabulary.

## Posture Mapping

`shadow_only` shows awareness only and forbids local widening.

`observe_only` keeps prior assistive context readable while write and completion-adjacent controls stay suppressed.

`degraded` keeps bounded provenance and recovery detail visible, but suppresses fresh insert, accept, export, and completion controls.

`quarantined` is safety containment. It renders provenance-only posture, hides confidence, and requires governed replay before reuse.

`frozen` is preservation in place. It may keep text readable, but freezes all write and completion-adjacent controls.

`blocked_by_policy` is a hard stop. It does not expose local recovery or suggest a workaround.

## Gap Note

The static 403 readiness registry currently ends at `par_421`, so `par_422` does not have a launch row or launch packet ref. The frontend implementation publishes `PHASE8_BATCH_420_427_INTERFACE_GAP_TRUST_POSTURE_FAMILY.json` and binds to validated 415 and 416 contracts until the 403 launch packet exists.
