# 35 Live Gate And Spend Controls

        Phase 0 is still `withheld`. Real provider setup stays blocked.

        Section A — `Mock_now_execution`

        The mock lab exposes the real-later field model and selector map, but keeps submit disabled.

        Section B — `Actual_provider_strategy_later`

        Live gates:

        | Gate | Status | Severity | Reason |
| --- | --- | --- | --- |
| LIVE_GATE_EVIDENCE_PHASE0_EXTERNAL_READY | blocked | hard_blocker | Phase 0 entry remains withheld, so no real provider mutation may start. |
| LIVE_GATE_EVIDENCE_SHORTLIST_APPROVED | pass | required | Only shortlisted providers may be configured later. |
| LIVE_GATE_EVIDENCE_REGION_POLICY_EXPLICIT | review_required | required | Provider project creation stays blocked until region posture is named. |
| LIVE_GATE_EVIDENCE_RETENTION_POLICY_EXPLICIT | review_required | required | Deletion or retention cannot be inferred from job completion. |
| LIVE_GATE_EVIDENCE_WEBHOOK_SECURITY_READY | review_required | required | Unsigned or replayed callbacks must stay non-authoritative. |
| LIVE_GATE_EVIDENCE_STORAGE_SCOPE_DEFINED | review_required | required | Storage and prefix scope are part of the scanning contract. |
| LIVE_GATE_EVIDENCE_QUARANTINE_POLICY_FROZEN | review_required | required | Clean, suspicious, unreadable, and failed branches cannot collapse into one badge. |
| LIVE_GATE_EVIDENCE_NAMED_APPROVER_AND_ENV | blocked | hard_blocker | Live mutations require a named human approver and environment target. |
| LIVE_GATE_EVIDENCE_MUTATION_FLAG | blocked | hard_blocker | Real provider changes must fail closed without the mutation flag. |
| LIVE_GATE_EVIDENCE_SPEND_FLAG | blocked | hard_blocker | Project creation and live traffic can incur spend immediately. |
| LIVE_GATE_EVIDENCE_FINAL_OPERATOR_ACK | blocked | hard_blocker | Real project setup is blocked until a human acknowledges the live posture and artifact sensitivity. |

        Required environment variables for any future real dry run:

        | Variable |
| --- |
| EVIDENCE_PROVIDER_VENDOR_ID |
| EVIDENCE_PROJECT_SCOPE |
| EVIDENCE_TARGET_ENVIRONMENT |
| EVIDENCE_REGION_POLICY_REF |
| EVIDENCE_RETENTION_POLICY_REF |
| EVIDENCE_WEBHOOK_BASE_URL |
| EVIDENCE_WEBHOOK_SECRET_REF |
| EVIDENCE_STORAGE_BUCKET_REF |
| EVIDENCE_SCAN_POLICY_REF |
| EVIDENCE_NAMED_APPROVER |
| ALLOW_REAL_PROVIDER_MUTATION |
| ALLOW_SPEND |

        A real run must still fail closed while `phase0_verdict = withheld`.
