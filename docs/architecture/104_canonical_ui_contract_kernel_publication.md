# 104 Canonical UI Contract Kernel Publication

This publication turns the canonical UI contract kernel into one executable, machine-readable contract plane for Vecells. Every route-family bundle now resolves visible state, automation markers, accessibility coverage, telemetry vocabulary, and artifact posture from the same kernel tuple.

The current publication covers 19 route families across 9 audience-surface bundles, with 14 exact bindings, 1 safe-fallback stale bindings, and 4 fail-closed blocked bindings.

The bundle artifact is production-grade rather than illustrative. It preserves the existing route-family and bundle refs from the earlier seq_050/seq_052 surfaces so later runtime publication work can consume the same identifiers without introducing alias drift.

## What the Kernel Publishes

- `VisualTokenProfile` for every route family, always bound to the canonical par_103 token export and the current layering policy.

- `SurfaceStateSemanticsProfile` for every mocked route truth posture, resolved by the executable precedence equation rather than local component logic.

- `SurfaceStateKernelBinding` proving whether accessibility, automation, telemetry, and artifact posture still agree as `exact`, `stale`, or `blocked`.

- `DesignContractPublicationBundle` and `DesignContractLintVerdict` rows for every audience surface so release and runtime consumers can reason about design truth as a contract, not a screenshot.

## Fail-Closed Rules

- Accessibility coverage gaps remain blocked at the binding level and surface in the lint verdict instead of silently downgrading to advisory drift.

- Artifact-mode uncertainty falls back to safe summary or handoff posture and emits `FOLLOW_ON_DEPENDENCY_ARTIFACT_MODE_*` rows.

- `read_only` is published as an explicit display-state token through `GAP_RESOLUTION_KERNEL_EXECUTION_FORMAT_EFFECTIVE_DISPLAY_STATE_V1` so shells do not invent their own disabled-state semantics.

### Summary

```json
{
  "bundle_count": 9,
  "route_family_count": 19,
  "exact_binding_count": 14,
  "stale_binding_count": 1,
  "blocked_binding_count": 4,
  "accessibility_complete_count": 15,
  "accessibility_degraded_count": 4,
  "lint_pass_count": 5,
  "lint_blocked_count": 4
}
```