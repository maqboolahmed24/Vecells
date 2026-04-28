# 428 Phase 8 Offline Evaluation Suite

Run:

```bash
pnpm test:phase8:eval
pnpm validate:428-phase8-offline-eval
```

The suite is deterministic and offline. It uses `data/fixtures/428_phase8_offline_eval_corpus.json` and never calls a live model, vendor API, web service, or PHI source.

Outputs:

- `data/analysis/428_phase8_eval_report.json`
- `data/analysis/428_phase8_eval_summary.md`
- `data/analysis/428_phase8_failed_fixtures.json`
- `data/analysis/428_phase8_threshold_comparison_table.csv`

The evaluator checks grounding, citation validity, stale evidence warnings, red-flag escalation, false reassurance, abstention and deferral, confidence and provenance envelopes, audit evidence, slice support, calibration, selective risk, multicalibration gap, and autonomous-write attempts.

Browser evidence is covered by `tests/playwright/428_phase8_offline_eval_visible_evidence.spec.ts` against `docs/frontend/428_phase8_offline_eval_harness.html`. The harness shows grounded output, red-flag blocked output, hallucination-trap blocked output, and stale frozen output with confidence, rationale, provenance, keyboard navigation, reduced-motion mode, ARIA snapshots, and visual snapshots.
