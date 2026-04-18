# 272 Phase 3 Queue Case Matrix

The authoritative machine-readable case rows live in:

- [272_queue_replay_cases.csv](/Users/test/Code/V/data/test/272_queue_replay_cases.csv)
- [272_duplicate_and_resolution_cases.csv](/Users/test/Code/V/data/test/272_duplicate_and_resolution_cases.csv)
- [272_stale_owner_and_takeover_cases.csv](/Users/test/Code/V/data/test/272_stale_owner_and_takeover_cases.csv)

This document records the interpretation layer used by the suite.

## Scenario families

| Family | Required proof |
| --- | --- |
| Queue replay and determinism | same fact cut same hash, changed fact cut new hash, preemption exclusion, mixed-snapshot fail-closed, explanation payload replayability |
| Fairness and overload | fairness-band rotation, overload suppression honesty, assignment suggestions downstream of canonical order |
| Duplicate authority and supersession | exact retry collapse, review-required ambiguity, human attach with continuity witness, append-only invalidation on reversal |
| Claim, stale-owner, and continuity | soft-claim race serialization, stale-owner recovery, supervisor takeover, next-task block on stale-owner, release continuity |
| Accessibility and browser resilience | keyboard-only traversal, ARIA snapshots, reduced-motion equivalence, screenshot baselines |

## Machine-readable alignment rules

Each case row must align across:

1. CSV row
2. expected-hash and outcome pack
3. suite results row
4. browser or service proof named in the row

The suite fails when a browser-visible queue state lacks a matching machine-readable replay or ownership record.

## Case totals

The `272` suite publishes `15` explicit case rows:

- `6` queue replay and fairness cases
- `4` duplicate authority and supersession cases
- `5` claim, stale-owner, and continuity cases

The assurance lab renders the dominant scenario families. The full machine-readable matrix remains broader than the visible storyboard so service-only recovery and release cases are still governed and replayable.
