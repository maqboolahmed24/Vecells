# 127 Manifest Drift And Recovery Rules

Verdict precedence is strict:

1. `blocked`
2. `drifted`
3. `partial`
4. `exact`

A row is `blocked` when any required tuple member is missing, the governing bounded context is unknown, the canonical descriptor is unknown, no shell contract exists, or accessibility coverage is blocked.

A row is `drifted` only when the required members exist but digest alignment fails across frontend, design, runtime, or release parity evidence.

A row is `partial` when the fused join exists but the experience is still bounded by read-only or recovery-only posture, degraded accessibility, design lint pending, or constrained channel posture.

A row is `exact` only when all required members exist, digests align, accessibility is not degraded or blocked, and the fused row can legally claim calm exactness.
