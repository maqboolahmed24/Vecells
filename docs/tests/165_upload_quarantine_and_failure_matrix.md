# 165 Upload Quarantine And Failure Matrix

Source policy: `AAP_141_PHASE1_ATTACHMENT_POLICY_V1`.

| Case ID                             | Family                | Expected Lifecycle      | Classification                      | Submit Disposition              | Browser Posture                 |
| ----------------------------------- | --------------------- | ----------------------- | ----------------------------------- | ------------------------------- | ------------------------------- |
| `UP165_SAFE_PDF`                    | safe_baseline         | `promoted`              | `accepted_safe`                     | `routine_submit_allowed`        | `safe_preview_ready`            |
| `UP165_PREVIEW_FAILURE`             | safe_degraded_preview | `promoted`              | `preview_unavailable_but_file_kept` | `routine_submit_allowed`        | `safe_placeholder_same_shell`   |
| `UP165_MALWARE_POSITIVE`            | quarantine            | `quarantined`           | `quarantined_malware`               | `replace_or_remove_then_review` | `quarantine_visible_same_shell` |
| `UP165_MIME_SPOOF`                  | quarantine            | `quarantined`           | `quarantined_unsupported_type`      | `replace_or_remove_then_review` | `quarantine_visible_same_shell` |
| `UP165_UNREADABLE_PAYLOAD`          | quarantine            | `quarantined`           | `quarantined_unreadable`            | `replace_or_remove_then_review` | `quarantine_visible_same_shell` |
| `UP165_INTEGRITY_FAILURE`           | quarantine            | `quarantined`           | `quarantined_integrity_failure`     | `replace_or_remove_then_review` | `quarantine_visible_same_shell` |
| `UP165_SCAN_TIMEOUT_RETRY`          | unresolved_retry      | `scan_failed_retryable` | none                                | `retry_before_submit`           | `review_required_same_shell`    |
| `UP165_OVERSIZED_REJECTED`          | policy_rejection      | `rejected_policy`       | none                                | `replace_or_remove_then_review` | `local_card_recovery`           |
| `UP165_EXTENSION_MISMATCH_REJECTED` | policy_rejection      | `rejected_policy`       | none                                | `replace_or_remove_then_review` | `local_card_recovery`           |
| `UP165_POLICY_DISALLOWED_REJECTED`  | policy_rejection      | `rejected_policy`       | none                                | `replace_or_remove_then_review` | `local_card_recovery`           |
| `UP165_DUPLICATE_REPLAY`            | duplicate             | `promoted`              | `accepted_safe`                     | `routine_submit_allowed`        | `safe_preview_ready`            |
| `UP165_MIXED_BATCH_UNSAFE`          | mixed_batch           | `quarantined`           | `quarantined_malware`               | `replace_or_remove_then_review` | `mixed_batch_review_required`   |

## Trust Rules

| Rule                                                                                      | Enforced By                                                                                                                           |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| No raw object-store URL may be browser-visible.                                           | Artifact presentation grants must begin with `artifact://attachment-grant/` and only exist for promoted attachments.                  |
| Pending, rejected, quarantined, or retryable uploads cannot show trusted preview posture. | Integration tests assert `previewPolicy = hidden` and `downloadPolicy = forbidden` outside promoted states.                           |
| Quarantined evidence opens review continuity.                                             | Quarantine cases require `replace_or_remove_then_review`, `currentSafeMode = recovery_only`, and fallback review in the fixture row.  |
| Mixed-batch unsafe evidence blocks the batch.                                             | The mixed-batch case combines one promoted safe file and one malware-positive file and asserts no aggregate `routine_submit_allowed`. |
| Duplicate upload does not create silent second trust.                                     | The duplicate replay case asserts an existing attachment lineage is reused and no new event chain is emitted for the replay.          |
