# 428 Phase 8 Offline Eval Alignment Notes

Task `428` implements the Phase 8 safety gate as a deterministic offline suite.

The local source algorithm requires the gold set, replay harness, hallucination checks, grounded drafts, red-flag escalation, conservative confidence, stale-output invalidation, calibration, fairness, and no-autonomous-write boundaries to be measurable before Phase 8 exit. This implementation maps those requirements into `data/fixtures/428_phase8_offline_eval_corpus.json`, `data/config/428_phase8_eval_thresholds.json`, and the reusable evaluator in `packages/domains/assistive_evaluation/src/phase8-offline-regression.ts`.

The corpus is synthetic-only. It covers grounded safe output, missing evidence, contradictory sources, stale source invalidation, symptom red flags, medication/pharmacy red flags, access-delay red flags, hallucination traps, citation traps, draft insertion boundaries, multilingual and low-literacy communication support, protected-characteristic access-equity slices, non-clinical red-flag phrase context, partial source visibility, and real-world facts absent from local evidence.

Unsafe fixture mutations are covered in unit tests rather than accepted as passing corpus outputs. The committed corpus represents the expected safe behavior; tests mutate those fixtures to prove unsupported claims, fabricated citations, stale evidence without warning, red-flag misses, false reassurance, red-flag inflation, autonomous writes, and unsupported draft facts fail closed.

The command `pnpm test:phase8:eval` emits the machine-readable report, a Markdown summary, an empty unexpected-failure list when green, and a threshold comparison table. Phase 8 exit can consume the report directly through `evidenceArtifactRef`, `thresholdComparisons`, and `failedFixtures`.
