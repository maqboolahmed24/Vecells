# Route Adjacency And Anchor Invalidation Rules

Route adjacency decides whether the shell remains in place, whether the selected anchor survives, and whether the return posture may stay writable, read-only, or recovery-bound.

## Adjacency Rules

- `same_object_child` preserves the shell and mints a return contract to the source anchor.
- `same_object_peer` preserves the shell but may demote or replace the current object anchor.
- `same_shell_object_switch` requires an explicit anchor disposition and focus disposition.
- `cross_shell_boundary` fails closed and resets to a route default only when the shell family genuinely changes.

## Sample Adjacency Rows

| From | To | Adjacency | Anchor disposition | Default return posture |
| --- | --- | --- | --- | --- |
| `rf_patient_home` | `rf_patient_home` | `same_route` | `preserve` | `full_restore` |
| `rf_patient_home` | `rf_patient_requests` | `same_shell_object_switch` | `replace_with_acknowledgement` | `partial_restore` |
| `rf_patient_home` | `rf_patient_appointments` | `same_shell_object_switch` | `replace_with_acknowledgement` | `partial_restore` |
| `rf_patient_home` | `rf_patient_health_record` | `same_shell_object_switch` | `replace_with_acknowledgement` | `partial_restore` |
| `rf_patient_home` | `rf_patient_messages` | `same_shell_object_switch` | `replace_with_acknowledgement` | `partial_restore` |
| `rf_patient_home` | `rf_intake_self_service` | `same_shell_object_switch` | `replace_with_acknowledgement` | `partial_restore` |
| `rf_patient_home` | `rf_intake_telephony_capture` | `same_shell_object_switch` | `replace_with_acknowledgement` | `partial_restore` |
| `rf_patient_home` | `rf_patient_secure_link_recovery` | `same_shell_object_switch` | `preserve_stub_and_fallback` | `partial_restore` |

## Invalidation Rules

- An invalidated anchor remains visible until explicit acknowledgement, re-check, or dismissal.
- Replacement acknowledgement is required for governance, hub, operations, pharmacy, and support continuity where the question itself changes.
- Patient and artifact-origin recovery keeps the departing anchor visible as a stub and degrades in place rather than redirecting home.
