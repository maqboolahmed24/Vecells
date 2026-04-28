# 372 Phase 6 Evidence Review Guide

Use this guide to review the gate without manual archaeology.

## Required Commands

```bash
pnpm validate:369-phase6-core-suite
pnpm validate:370-phase6-exception-suite
pnpm validate:371-phase6-final-browser-suite
pnpm validate:372-phase6-exit-gate
pnpm exec tsx tests/playwright/372_phase6_exit_gate_board.spec.ts --run
```

## Machine Artifacts

- `data/contracts/372_phase6_exit_verdict.json`
- `data/contracts/372_phase6_release_readiness_registry.json`
- `data/analysis/372_phase6_contract_consistency_matrix.csv`
- `data/analysis/372_phase6_evidence_matrix.csv`
- `data/analysis/372_phase6_blocker_ledger.json`
- `data/analysis/372_phase6_carry_forward_ledger.json`
- `data/analysis/372_phase6_hazard_coverage_matrix.csv`

## Browser Artifacts

Open `docs/frontend/372_phase6_exit_gate_board.html`.

Check:

- capability rail selection updates the evidence canvas and inspector
- filters reduce the visible capability set without hiding text parity
- keyboard navigation moves through capability buttons and inspector links
- reduced-motion CSS is present
- blocker count is zero and carry-forward count is six

## Interpretation

Green local proof does not equal live NHS App go-live. The formal verdict is `go_with_constraints` because the repository-owned Phase 6 implementation is complete, while `CF372_001` through `CF372_006` keep live partner onboarding, SCAL, manual assistive testing, device-lab checks, and rollback rehearsal as launch constraints.
