
# Phase 0 Foundation Gate Runbook

1. Rebuild this pack with `python3 tools/analysis/build_phase0_gate_cockpit.py`.
2. Validate with `python3 tools/analysis/validate_phase0_foundation_gate.py`.
3. Check the primary entry verdict in `data/analysis/phase0_gate_verdict.json`.
4. If the verdict is `withheld`, clear every `blocked` row in `data/analysis/phase0_gate_blockers.csv` before re-running.
5. Keep deferred Phase 7 artifacts out of the current-baseline proof chain unless an explicit waiver is added.
6. Treat the `GATE_P0_PARALLEL_FOUNDATION_OPEN` row as the control point for release/publication/trust/continuity tuple law before parallel implementation opens.
7. Treat the `GATE_P0_EXIT` row as the point where HSM signing and alert-destination warnings become hard obligations.
