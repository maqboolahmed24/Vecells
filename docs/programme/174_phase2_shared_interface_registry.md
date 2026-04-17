# Phase 2 Shared Interface Registry

The authoritative registry is `data/analysis/174_phase2_shared_interface_seams.json`. The registry freezes shared seam ownership before the `175-194` parallel block opens.

## Required Seam Families

| Seam family                              | Owner     | Main consumers                                                                    | Purpose                                                                 |
| ---------------------------------------- | --------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `auth_transaction_callback_dtos`         | `par_175` | `par_176`, `par_177`, `par_179`, `par_180`, `par_181`, `par_186`                  | Callback settlement and frozen scope transaction DTOs.                  |
| `post_auth_return_route_binding`         | `par_175` | `par_176`, `par_180`, `par_181`, `par_184`, `par_185`                             | Governed return intent and route binding.                               |
| `session_governor_ports`                 | `par_176` | auth, binding, capability, claim, repair, ownership, portal                       | Local session establishment, rotation, timeout, logout, and projection. |
| `identity_evidence_vault_ports`          | `par_177` | auth, patient linker, binding, telephony verification, recording, readiness       | Append-only encrypted evidence writes and masked refs.                  |
| `patient_link_decision_calibration`      | `par_178` | auth, session, binding, capability, PDS, audit                                    | Calibrated patient link decisions and confidence lower bounds.          |
| `identity_binding_intent_decision`       | `par_179` | auth, session, patient link, capability, claim, ownership, telephony verification | Sole binding serializer and patientRef advancement authority.           |
| `capability_decision_scope_envelope`     | `par_180` | session, grant, ownership, portal, continuation                                   | Fail-closed capability and scope-envelope inputs.                       |
| `grant_service_claim_continuation`       | `par_181` | claim, portal, continuation, request convergence                                  | Canonical grant issuance, redemption, and supersession.                 |
| `telephony_normalized_event_envelope`    | `par_187` | call session, caller verification, recording, readiness, convergence              | Provider-neutral telephony event boundary.                              |
| `telephony_readiness_continuation_ports` | `par_191` | caller verification, continuation, convergence, duplicate/re-safety               | Readiness, manual review, and continuation recommendation authority.    |

Additional seams cover PDS enrichment, identity repair, portal projection, audit masking, call-session state, caller verification, audio quarantine, request convergence, and duplicate/re-safety handoff through `par_194`.

The registry is enforced by `MG_174_SHARED_CONTRACT`, `MG_174_SECURITY_MASKING`, `MG_174_RUNTIME_PUBLICATION`, `MG_174_REQUEST_CONVERGENCE`, and `MG_174_BROWSER_ACCESSIBILITY`. Missing or ambiguous ownership must be published with a `PARALLEL_INTERFACE_GAP_PHASE2_*` identifier rather than resolved by local shortcut.

## Evidence And Provider Boundaries

Raw auth claims, phone numbers, caller IDs, handset proofs, recordings, and transcript payloads must not be shared as ordinary DTO fields. They are written through the evidence vault or audio quarantine seam and read back through masked references.

Provider-specific payloads stop at adapter boundaries:

- NHS login provider payloads stop inside the auth bridge.
- PDS payloads stop inside the disabled-by-default PDS adapter seam until live onboarding is approved.
- Telephony vendor payloads stop inside the telephony normalized event envelope.
- SMS dispatch carries canonical grant links only; it never chooses grant family or eligibility.

## Protected Ownership Rule

If a type appears in `protectedSharedTypes`, only the seam owner may redefine it. Consumers may add implementation adapters, but those adapters must import or reference the seam's contract instead of cloning the shape.
