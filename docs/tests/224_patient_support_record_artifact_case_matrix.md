# 224 Patient, Support, and Record-Artifact Case Matrix

The authoritative browser and validator case rows live in [224_continuity_case_matrix.csv](/Users/test/Code/V/data/test/224_continuity_case_matrix.csv).

This document records the interpretation layer used by the suite.

It keeps the patient shell continuity, support continuity, and `record-artifact parity` language identical to the machine-readable matrix.

## Scenario families

| Family | Required proof |
| --- | --- |
| Patient shell continuity | home to requests to request detail, more-info deep links, callback repair child state, refresh replay, browser back, stale-link summary-only recovery |
| Support continuity | support entry to inbox to ticket, conversation/history/knowledge child states, observe-only entry, route-intent drift fallback, lawful return to inbox |
| Patient/support parity | lineage, canonical status, repair posture, and provisional communication handling for the same governing request or communication chain |
| Record-artifact parity | verified summary vs source, chart-to-table fallback, source-only handoff, restricted placeholder retention |
| Masking, disclosure, fallback | history summary-first, governed widen, limited-scope knowledge rail, read-only replay artifact preservation |
| Cross-state auth and recovery | signed-out patient recovery and identity-hold restriction posture |
| Accessibility and browser resilience | keyboard traversal, ARIA snapshots, reduced motion, high zoom, and family screenshots |

## Machine-readable alignment rules

The suite treats `machine-readable alignment` as a hard gate, not a reporting nicety.

Every case row must align across:

1. expected route matrix row
2. runtime browser result row
3. screenshot or ARIA evidence
4. validator output

The validator fails when any passing browser state lacks that alignment.

## Record and support subsets

The following subset files are authoritative companions, not duplicates:

- [224_record_parity_and_visibility_cases.csv](/Users/test/Code/V/data/test/224_record_parity_and_visibility_cases.csv)
- [224_support_masking_and_fallback_cases.csv](/Users/test/Code/V/data/test/224_support_masking_and_fallback_cases.csv)

They exist so the suite can fail narrowly when artifact parity or masking/fallback behavior drifts without hiding that drift inside the broader matrix.
