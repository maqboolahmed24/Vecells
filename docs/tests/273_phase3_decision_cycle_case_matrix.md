# 273 Phase 3 Decision-Cycle Case Matrix

This matrix records `15` explicit case rows across checkpoint, disposition, re-safety, endpoint, approval, and urgent-escalation families.

## Queue-Independent Decision Families

| Case ID | Family | Owning Source Section | Actor Role(s) | Expected Disposition / Settlement | Expected Recovery Posture | Actual Result |
| --- | --- | --- | --- | --- | --- | --- |
| `DCA273_001` | Checkpoint | `3D` | reviewer, worker | `open -> reminder_due -> single reminder_send` | `none` | `passed` |
| `DCA273_002` | Checkpoint | `3D` | patient, reviewer | `accepted_late_review` | `review_in_place` | `passed` |
| `DCA273_003` | Checkpoint | `3D` | patient | `expired_rejected` | `expired_reply_window` | `passed` |
| `DCA273_004` | Checkpoint | `3D` | reviewer, patient | `superseded_duplicate` on older cycle | `superseded_recovery_only` | `passed` |
| `DCA273_005` | Checkpoint | `3D` | patient | `blocked_repair` plus wrong-task mismatch rejection | `contact_route_repair_required` | `passed` |
| `DCA273_006` | Re-safety | `3D` | patient, reviewer | `urgent_return` | `urgent_diversion_required` | `passed` |
| `DCA273_007` | Re-safety | `3D` | patient, reviewer | `review_resumed_then_queued` | `bounded_review` | `passed` |
| `DCA273_008` | Re-safety | `3D` | patient, reviewer | contradiction stays `re_safety_required` | `fail_closed_review` | `passed` |
| `DCA273_009` | Re-safety | `3D` | reviewer, supervisor | `supervisor_review_required` | `same_shell_supervisor_gate` | `passed` |
| `DCA273_010` | Endpoint | `3E` | reviewer | `ENDPOINT_PAYLOAD_MINIMUM_NOT_MET` | `edit_in_place` | `passed` |
| `DCA273_011` | Endpoint | `3E` | reviewer | preview invalidated to `stale_recoverable` | `recovery_only_preview` | `passed` |
| `DCA273_012` | Endpoint | `3E` | reviewer | `blocked_approval_gate` | `awaiting_approval` | `passed` |
| `DCA273_013` | Approval | `3F` | reviewer, approver | `SELF_APPROVAL_BLOCKED` and `APPROVER_ROLE_REQUIRED` | `approval_frozen` | `passed` |
| `DCA273_014` | Approval | `3F` | reviewer, approver | stale checkpoint becomes `superseded` on epoch supersession | `replacement_authority_visible` | `passed` |
| `DCA273_015` | Escalation | `3F` | reviewer, approver | urgent replay collapses, stale epoch blocks new attempt | `urgent_recovery_only` | `passed` |

## Scenario Families

### More-Info Checkpoint And Reminder

- `DCA273_001`
- `DCA273_002`
- `DCA273_003`
- `DCA273_004`
- `DCA273_005`

### Delta And Re-Safety

- `DCA273_006`
- `DCA273_007`
- `DCA273_008`
- `DCA273_009`

### Endpoint Decision, Approval, And Escalation

- `DCA273_010`
- `DCA273_011`
- `DCA273_012`
- `DCA273_013`
- `DCA273_014`
- `DCA273_015`

## Repository Fix Alignment

The only repository-owned defect closed by this suite is `DCA273_DEF_001`.

- surfaced by `DCA273_014`
- fixed in [phase3-approval-escalation.ts](/Users/test/Code/V/services/command-api/src/phase3-approval-escalation.ts)
- verified by the service suite, the validator, and the browser-visible authority states
