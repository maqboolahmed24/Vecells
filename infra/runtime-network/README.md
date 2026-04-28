
# Runtime Network Foundation

This directory contains the provider-neutral Phase 0 runtime network baseline for par_084.

- `terraform/` publishes the core-network, workload-segment, and private-egress modules.
- `local/` mirrors the same workload-family and trust-boundary law for developer and CI use.
- `tests/` contains smoke checks that fail when browser reachability or egress posture drifts.
