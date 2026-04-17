# Navigation State Ledger And Restore Order

The shared manager writes one navigation ledger per shell epoch and rehydrates from it before child-surface rendering resumes.

## Restore Order

The canonical restore sequence remains:

1. Restore the exact selected-anchor tuple when available.
2. Restore scroll to the preserved anchor region or nearest safe fallback.
3. Restore bounded disclosure posture without widening the shell.
4. Restore focus to the selected anchor, invalidation stub, or recovery notice.

## Sample Restore Rows

| Route family | Restore order | Fallback anchor |
| --- | --- | --- |
| `rf_patient_home` | `anchor > scroll > disclosure > focus` | `home-next-step` |
| `rf_patient_requests` | `anchor > scroll > disclosure > focus` | `request-lineage` |
| `rf_patient_appointments` | `anchor > scroll > disclosure > focus` | `appointments-actions` |
| `rf_patient_health_record` | `anchor > scroll > disclosure > focus` | `record-latest` |
| `rf_patient_messages` | `anchor > scroll > disclosure > focus` | `messages-thread` |
| `rf_intake_self_service` | `anchor > scroll > disclosure > focus` | `request-proof` |

## Ledger Guarantees

- Same-shell child routes keep a return contract to the origin anchor.
- Same-shell object switches may demote or replace anchors, but they may not silently choose a sibling object.
- Read-only and recovery posture override calm or writable return even when the shell remains stable.
