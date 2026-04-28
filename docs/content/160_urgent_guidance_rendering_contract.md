# 160 Urgent Guidance Rendering Contract

The patient-facing urgent surface uses one serious, calm rendering family:

- title first
- one or two short urgency sentences
- one dominant action
- one bounded secondary disclosure or lawful return action only when the grammar permits it
- one compact locked summary of what the patient already told us

## Copy split

| Variant | Title | Allowed meaning |
| --- | --- | --- |
| `urgent_required_pending` | `Get urgent help now` | urgent help is required, but urgent guidance is not yet issued |
| `urgent_issued` | `Urgent guidance has been issued` | the urgent settlement is issued and attached to this request lineage |
| `failed_safe_recovery` | `We could not safely complete this online` | the shell kept the draft context, but no calm receipt or queue confirmation exists |

## Forbidden drift

- urgent must not look like field validation
- urgent-issued must not appear before settlement `issued`
- failed-safe must not reuse routine receipt wording
- patient routes must not expose raw rule IDs, rule weights, or internal-only clinical metadata
