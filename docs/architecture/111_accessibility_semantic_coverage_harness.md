# 111 Accessibility Semantic Coverage Harness

`par_111` turns accessibility from route-local guidance into one executable contract layer for the shared frontend foundation. The harness extends the existing `par_104` accessibility publication without breaking its pinned profile counts, then adds the interaction law that later route tasks can consume directly.

## Published outputs

- `data/analysis/accessibility_semantic_coverage_profiles.json` keeps the canonical `par_104` `AccessibilitySemanticCoverageProfile` payload and summary intact, then adds the `par_111` extension:
  - `harness_task_id = par_111`
  - `harness_visual_mode = Accessibility_Control_Deck`
  - `route_profile_count = 19`
  - `scenario_count = 6`
  - `focus_transition_contract_count = 133`
  - `keyboard_interaction_contract_count = 19`
  - `announcement_example_count = 14`
- `data/analysis/focus_transition_contract_matrix.csv` publishes one shared focus rule for every route family across:
  - same-shell refresh
  - buffered update
  - mission-stack fold
  - mission-stack unfold
  - restore
  - invalidation
  - recovery return
- `data/analysis/keyboard_interaction_contract_matrix.csv` publishes one shared keyboard model per route family with traversal, activation, dismissal, landmark, and provisional-gap state.
- `data/analysis/assistive_announcement_examples.json` publishes the deduplicated transcript examples that prove local acknowledgement, pending, stale, recovery, and authoritative settlement remain distinct.

## Contract posture

The harness is deliberately shared-package first:

- focus movement is decided by one rule engine, not route-local event handlers
- announcement arbitration deduplicates on causal tuple, not copied text
- visualization parity never allows a chart or matrix to outrun the table and summary fallback
- reduced motion and narrow reflow stay equivalent to the default workstation presentation

## Route-family coverage

The publication keeps the existing `par_104` accessibility state distribution:

| Coverage state | Count |
| --- | ---: |
| `complete` | 15 |
| `degraded` | 4 |
| `blocked` | 0 |

The shared keyboard contract layer adds a second verification axis:

| Contract state | Count |
| --- | ---: |
| `exact` | 12 |
| `provisional` | 6 |
| `blocked` | 1 |

`provisional` is used intentionally where the route family still lacks exact keyboard or restore proof. The harness keeps those scenarios visible and fail-closed instead of pretending the route is done.

## Bounded prerequisite gap

`PREREQUISITE_GAP_PAR_110_SHARED_POSTURE_SURFACES_V1` is carried forward explicitly. The `par_110` posture surfaces were not present when this task executed, so the harness ships bounded internal posture descriptors and keeps the shell fail-closed to summary, table, or recovery-stub states until the shared posture layer is published.

## Reuse rule

Later tasks must extend the current matrices and scenarios instead of replacing them. New routes may add more scenario rows, announcement examples, and browser flows, but they must keep the same:

- route-family accessibility tuple
- focus transition semantics
- announcement authority vocabulary
- visualization parity states
- DOM markers verified by the harness
