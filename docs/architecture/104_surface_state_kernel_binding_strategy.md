# 104 Surface State Kernel Binding Strategy

The binding strategy is now executable in code and directly inspectable in the Kernel Atlas studio.

## Binding Law

1. Resolve visible state through the kernel precedence equation.
2. Project the same winning state into `SurfaceStateSemanticsProfile`.
3. Bind accessibility, automation, telemetry, and artifact posture to the same vocabulary tuple.
4. Publish `bindingState = exact | stale | blocked` and fail closed when the tuple drifts.

## Current posture

- Blocked bindings: 4
- Stale bindings: 1
- Exact bindings: 14

## Coverage-driven blocking

The blocked bindings are currently restricted to route families whose accessibility coverage is still degraded under reduced motion, host resize, mission-stack, or buffered-update conditions. Those routes remain summary-first or recovery-first until the missing coverage is published as complete.

### Gap Resolutions

```json
[
  {
    "gapId": "GAP_RESOLUTION_KERNEL_EXECUTION_FORMAT_EFFECTIVE_DISPLAY_STATE_V1",
    "classification": "gap_resolution",
    "statement": "The blueprint gave a numeric precedence equation and tie-break order but did not specify a standalone executable display-state token for read-only posture, so the kernel publishes `read_only` as an explicit display state between stale and settled-pending-confirmation.",
    "implementedRule": "Display precedence becomes blocked > recovery > degraded > stale > read_only > settled_pending_confirmation > loading > empty > sparse > ready while numeric severity remains unchanged.",
    "source_refs": [
      "prompt/104.md",
      "blueprint/canonical-ui-contract-kernel.md#4. State-severity equation and display precedence"
    ]
  },
  {
    "gapId": "GAP_RESOLUTION_KERNEL_EXECUTION_FORMAT_LINT_VERDICT_DIGEST_V1",
    "classification": "gap_resolution",
    "statement": "The corpus did not define a single digest input for bundle-level lint verdicts, so the kernel computes them from token export, propagation, accessibility tuple, telemetry tuple, artifact policy, and structural snapshot refs.",
    "implementedRule": "Lint verdict state is fail-closed and deterministic across publication reruns because every verdict row hashes the same contract tuple surfaces.",
    "source_refs": [
      "prompt/104.md",
      "blueprint/canonical-ui-contract-kernel.md#DesignContractLintVerdict"
    ]
  }
]
```

### Coverage Gaps

```json
[
  {
    "gapId": "GAP_KERNEL_COVERAGE_RF_GOVERNANCE_SHELL_V1",
    "routeFamilyRef": "rf_governance_shell",
    "coverageState": "degraded",
    "failClosedSurfaceState": "summary_first"
  },
  {
    "gapId": "GAP_KERNEL_COVERAGE_RF_OPERATIONS_BOARD_V1",
    "routeFamilyRef": "rf_operations_board",
    "coverageState": "degraded",
    "failClosedSurfaceState": "summary_first"
  },
  {
    "gapId": "GAP_KERNEL_COVERAGE_RF_OPERATIONS_DRILLDOWN_V1",
    "routeFamilyRef": "rf_operations_drilldown",
    "coverageState": "degraded",
    "failClosedSurfaceState": "recovery_first"
  },
  {
    "gapId": "GAP_KERNEL_COVERAGE_RF_SUPPORT_REPLAY_OBSERVE_V1",
    "routeFamilyRef": "rf_support_replay_observe",
    "coverageState": "degraded",
    "failClosedSurfaceState": "summary_first"
  }
]
```
