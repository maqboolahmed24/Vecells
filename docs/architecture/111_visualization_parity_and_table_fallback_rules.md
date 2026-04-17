# 111 Visualization Parity And Table Fallback Rules

`par_111` treats chart and matrix surfaces as optional presentation, never as exclusive meaning.

## Parity states

| State | Authority target | Rule |
| --- | --- | --- |
| `visual_table_summary` | visual | Visual, table, and summary all prove the same tuple. |
| `table_only` | table | The visual is stale or withdrawn; the table and summary remain authoritative. |
| `summary_only` | summary | The table is unavailable; only the governed summary may speak. |
| `placeholder` | placeholder | No trustworthy visual or tabular proof exists; the shell must say so directly. |

## Downgrade law

Downgrade is mandatory when parity cannot be proved:

- charts do not get a grace period where they imply more than the fallback table
- matrix cells do not stay interactive if the summary and fallback table are carrying the truth
- blocked recovery may collapse all the way to `summary_only`

The harness publishes two explicit parity gap records:

- `GAP_VISUALIZATION_PARITY_OPERATIONS_TABLE_ONLY_V1`
- `GAP_VISUALIZATION_PARITY_SUPPORT_PLACEHOLDER_V1`

## Harness specimens

The executable harness covers three distinct parity postures:

1. verified parity on patient and workspace specimens
2. forced `table_only` on the operations board when chart meaning drifts
3. forced `summary_only` on support replay when neither chart nor table can prove the tuple

## Browser verification rule

The Playwright harness must prove all of the following:

- parity state is published as a DOM marker
- downgrade happens inside the same shell
- the fallback table or summary stays visible when the chart is removed
- reduced motion and narrow reflow do not change the parity verdict
