# 135 Duplicate Cluster And Fallback Truth Matrix

        Generated: `2026-04-14T09:13:09+00:00`

        The rows below keep duplicate-review, fallback-review, and closure-blocker truth explicit instead of allowing them to hide inside ordinary workflow state.

        ## Truth Rows

        | Case | Group | Family | Patient-visible state | Closure blocked | Browser proof | Machine proof | Blocker refs | Gap refs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CASE_135_EXACT_SUBMIT_REPLAY | adapter_replay | exact_submit_replay | read_only_return | no | partial_surface_proof | exact_machine_proof | none | GAP_REFERENCE_FLOW_EVENT_SPINE_REPLAY_MAPPING_PENDING, GAP_REFERENCE_FLOW_EVENT_MAPPING_INTAKE_PROMOTION_STARTED, GAP_REFERENCE_FLOW_EVENT_MAPPING_INTAKE_PROMOTION_SUPERSEDED_GRANTS_APPLIED, GAP_REFERENCE_FLOW_EVENT_MAPPING_INTAKE_PROMOTION_COMMITTED, GAP_REFERENCE_FLOW_EVENT_MAPPING_INTAKE_PROMOTION_REPLAY_RETURNED |
| CASE_135_SEMANTIC_REPLAY_RETURN | adapter_replay | semantic_replay_or_collision_review | unchanged | no | full_surface_proof | exact_machine_proof | none | none |
| CASE_135_SOURCE_COLLISION_REVIEW | adapter_replay | semantic_replay_or_collision_review | under_manual_review | yes | full_surface_proof | exact_machine_proof | RCR_067_SOURCE_ID_REUSE | none |
| CASE_135_CALLBACK_RECEIPT_REPLAY | adapter_replay | adapter_callback_replay_safe | under_manual_review | yes | full_surface_proof | exact_machine_proof | RCR_067_CALLBACK_SCOPE_DRIFT | none |
| CASE_135_OUTBOX_DUPLICATE_REUSED | adapter_replay | adapter_callback_replay_safe | unchanged | no | full_surface_proof | exact_machine_proof | none | none |
| CASE_135_DUPLICATE_CLUSTER_REVIEW_REQUIRED | duplicate_cluster | review_required_duplicate_cluster | recovery_only | yes | partial_surface_proof | exact_machine_proof | DCL_070_SAME_EPISODE, duplicate_cluster_review_001, command_api_duplicate_review_duplicate_cluster_0006 | GAP_REFERENCE_FLOW_SURFACE_DUPLICATE_REVIEW_LINKAGE_SEMANTIC_MATCH_ONLY |
| CASE_135_SAME_REQUEST_ATTACH_PROVEN | duplicate_cluster | same_request_attach_requires_proof | same_lineage_continuation | no | full_surface_proof | exact_machine_proof | none | none |
| CASE_135_CLOSURE_BLOCKED_BY_DUPLICATE_REVIEW | duplicate_cluster | closure_blocked_while_review_open | recovery_only | yes | full_surface_proof | exact_machine_proof | duplicate_cluster_001 | none |
| CASE_135_QUARANTINE_FALLBACK_CONTINUITY | quarantine_fallback | quarantine_opens_fallback_review | submitted_degraded | yes | partial_surface_proof | exact_machine_proof | command_api_request_closure_fallbackReviewCase_0001, fallback_case_restore_review_001 | GAP_REFERENCE_FLOW_SURFACE_SUPPORT_REPLAY_MUTATION_PATH_UNPUBLISHED, GAP_REFERENCE_FLOW_SURFACE_SUPPORT_REPLAY_CONTINUES_VIA_READ_ONLY_PUBLISHED_SHELL |
| CASE_135_FALLBACK_REVIEW_STAYS_EXPLICIT | quarantine_fallback | fallback_review_stays_explicit | submitted_degraded | yes | partial_surface_proof | exact_machine_proof | command_api_request_closure_fallbackReviewCase_0001 | none |
| CASE_135_CLOSURE_BLOCKED_BY_FALLBACK | quarantine_fallback | closure_blocked_while_review_open | submitted_degraded | yes | full_surface_proof | exact_machine_proof | command_api_request_closure_fallbackReviewCase_0001, fallback_case_restore_review_001 | none |
| CASE_135_SUSPICIOUS_ARTIFACT_REMAINS_QUARANTINED | quarantine_fallback | fallback_review_stays_explicit | under_manual_review | yes | partial_surface_proof | bounded_contract_proof | security_review_required | GAP_EVIDENCE_SCANNER_RUNTIME_NOT_YET_EXECUTABLE |
| CASE_135_UNREADABLE_RECORDING_REACQUIRE | quarantine_fallback | quarantine_opens_fallback_review | submitted_degraded | yes | partial_surface_proof | bounded_contract_proof | request_reacquire | GAP_EVIDENCE_SCANNER_RUNTIME_NOT_YET_EXECUTABLE |
| CASE_135_UNSUPPORTED_SCANNER_RUNTIME_GAP | quarantine_fallback | fallback_review_stays_explicit | submitted_degraded | yes | partial_surface_proof | bounded_contract_proof | GAP_MISSING_SIMULATOR_RUNTIME_ADP_MALWARE_ARTIFACT_SCANNING_V1 | GAP_MISSING_SIMULATOR_RUNTIME_ADP_MALWARE_ARTIFACT_SCANNING_V1 |

        ## Event Expectations

        | Event | Registry state | Case ids | Obligation |
| --- | --- | --- | --- |
| exception.review_case.opened | published | CASE_135_QUARANTINE_FALLBACK_CONTINUITY, CASE_135_FALLBACK_REVIEW_STAYS_EXPLICIT, CASE_135_UNREADABLE_RECORDING_REACQUIRE | Fallback review must open explicitly when accepted progress later degrades. |
| intake.attachment.quarantined | published | CASE_135_QUARANTINE_FALLBACK_CONTINUITY, CASE_135_SUSPICIOUS_ARTIFACT_REMAINS_QUARANTINED, CASE_135_UNREADABLE_RECORDING_REACQUIRE | Unsafe or unreadable evidence must remain quarantined on the lineage. |
| intake.promotion.replay_returned | bounded_gap | CASE_135_EXACT_SUBMIT_REPLAY | Replay returns the prior authoritative settlement without minting a second request. |
| request.closure_blockers.changed | published | CASE_135_DUPLICATE_CLUSTER_REVIEW_REQUIRED, CASE_135_CLOSURE_BLOCKED_BY_DUPLICATE_REVIEW, CASE_135_CLOSURE_BLOCKED_BY_FALLBACK | Duplicate review blockers remain visible on the lineage. |
| request.duplicate.attach_applied | published | CASE_135_SAME_REQUEST_ATTACH_PROVEN | Attach may settle only after explicit continuity proof is present. |
| request.duplicate.review_required | published | CASE_135_DUPLICATE_CLUSTER_REVIEW_REQUIRED | A thin-margin duplicate cluster must stay explicit review work. |
| safety.reassessed | published | CASE_135_SAME_REQUEST_ATTACH_PROVEN | Material clinical deltas on an attached continuation require new safety assessment. |
