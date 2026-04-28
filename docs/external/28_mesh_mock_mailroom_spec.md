# 28 Mesh Mock Mailroom Spec

        `Task:` `seq_028`  
        `Visual mode:` `Signal_Post_Room`

        Create a premium internal MESH mailroom that keeps transport acceptance, business acknowledgement, downstream proof, and canonical settlement visibly separate.

        Section A — `Mock_now_execution`

        The local `mock-mesh` twin is the executable transport seam for current work. It must model mailbox identity, workflow restrictions, delayed acknowledgement, duplicate delivery, replay fencing, expiry, pickup, and attachment quarantine without claiming that MESH transport success equals business truth.

        ## Mailbox inventory

        | mailbox_id | display_name | manager_mode | environment_band | workflow_keys |
| --- | --- | --- | --- | --- |
| mock-vec-hub-coord | Vecells hub coordination | self_managed | local_sandbox | VEC_HUB_BOOKING_NOTICE; VEC_HUB_BOOKING_ACK; VEC_HUB_RECOVERY_ACTION |
| mock-practice-ack-proxy | Origin practice acknowledgement proxy | third_party_managed | path_to_live_like | VEC_HUB_BOOKING_NOTICE; VEC_HUB_BOOKING_ACK |
| mock-vec-pharmacy-dispatch | Vecells pharmacy dispatch | self_managed | local_sandbox | VEC_PF_REFERRAL_INIT; VEC_PF_REFERRAL_ACK; VEC_PF_OUTCOME_RESP; VEC_PF_URGENT_RETURN_RESP |
| mock-pharmacy-return-proxy | Receiving pharmacy proxy | third_party_managed | path_to_live_like | VEC_PF_REFERRAL_INIT; VEC_PF_REFERRAL_ACK; VEC_PF_OUTCOME_RESP; VEC_PF_URGENT_RETURN_RESP |
| mock-vec-support-replay | Vecells support replay desk | self_managed | local_sandbox | VEC_ATTACHMENT_QUARANTINE; VEC_REPLAY_EVIDENCE_REQUEST |

        ## Behaviour contract

        - Mailbox registration, ownership ODS, and third-party manager posture are first-class facts.
        - Workflow IDs are validated before dispatch. Unknown IDs, wrong-direction IDs, or mailbox-ID mismatches are rejected explicitly.
        - Timeline law stays fixed as `compose -> submit -> accepted -> picked_up -> proof_pending -> settled_or_recovered`, but individual scenarios can branch into `expired`, `quarantined`, `replay_blocked`, or `recovery_required`.
        - Attachment quarantine, duplicate delivery, and replay guard remain separate states.
        - Local sandbox mode and path-to-live-like mode are distinct simulator postures.
        - Patient-facing calmness and canonical closure stay blocked until the downstream proof class required by the route matrix is current.

        ## Scenario coverage

        | scenario_id | label | message_outcome | operator_warning |
| --- | --- | --- | --- |
| happy_path | Happy path | settled_or_recovered | Still preserve transport and proof as separate events. |
| delayed_ack | Delayed acknowledgement | proof_pending | Do not imply calmness or closure. |
| duplicate_delivery | Duplicate delivery | recovery_required | Requires replay review and duplicate suppression. |
| expired_pickup | Expired pickup window | expired | Expiry is distinct from failure or quarantine. |
| quarantine_attachment | Attachment quarantine | quarantined | Quarantine must remain first class. |
| replay_guard | Replay guard | replay_blocked | Replay block is not a generic transport error. |

        ## Premium mailroom console contract

        - The left rail is mailbox-first and shows owner ODS, manager posture, and workflow health.
        - The centre workbench is timeline-first and exposes message composition, submission, pickup, and proof debt.
        - The right inspector is proof-first and explains why transport evidence is weaker than authoritative downstream truth.
        - The lower strip preserves the restrained transport-line diagram and makes replay, expiry, and quarantine visibly distinct.

        Section B — `Actual_provider_strategy_later`

        The same registry drives the live-later dossier. The official mailbox form, workflow-request form, and internal live gate are separate checkpoints. Vecells may rehearse locally now and in Path-to-Live-like mode later, but the pack intentionally blocks any real mailbox or workflow request until the current live gate clears.
