# Binding Supersession And Freeze Awareness Rules

Task: `par_179_phase2_track_identity_build_identity_binding_authority_append_only_decision_engine`

## Sole Authority Rule

`IdentityBindingAuthority` is the only component allowed to append, supersede, correct, revoke, freeze, or release identity binding truth. Auth bridge, session governor, patient linker, evidence vault, support flows, telephony flows, projections, and import jobs may submit evidence or intents, but they may not write binding versions, current binding pointers, or derived request/episode patient refs directly.

This implements `IAR_170_ONLY_IDENTITY_BINDING_AUTHORITY_WRITES_BINDING`, `PLB_170_NO_BINDING_MUTATION`, and the Phase 2 rule that `PatientLink` recommends while `IdentityBindingAuthority` settles.

## Append-Only Version Chain

Every accepted command creates a new `IdentityBindingVersion`; no command updates a prior binding row in place. Supersession is represented by `supersedesBindingVersionRef`. Rebuild and audit processes can replay the version chain from command settlements and binding versions.

Accepted command reason codes include:

| Reason code                                | Meaning                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `BINDING_179_AUTHORITY_SOLE_WRITER`        | The command entered the authority boundary.                              |
| `BINDING_179_ACCEPTED_APPEND_ONLY`         | A new binding version was appended.                                      |
| `BINDING_179_CURRENT_POINTER_CAS`          | The current pointer advanced through compare-and-set.                    |
| `BINDING_179_DERIVED_PATIENT_REF_ADVANCED` | Request/episode patient refs advanced in the same authority transaction. |
| `BINDING_179_REPAIR_AUTHORITY_RELEASED`    | Authorized correction passed the repair/freeze gate.                     |
| `BINDING_179_REVOKED`                      | The binding was revoked and derived refs were cleared.                   |

## Compare-And-Set Rules

If a subject already has a current binding pointer, a command must provide `expectedCurrentBindingVersionRef`. Missing, stale, or conflicting expected versions fail closed with `BINDING_179_STALE_EXPECTED_VERSION`.

Lineage patient refs are also CAS-protected. A request or episode can advance only from the expected previous binding version to the new version produced by the same transaction.

## Idempotency And Replay

`BindingCommandSettlement.idempotencyKey` is unique. Duplicate command delivery returns `BINDING_179_REPLAY_RETURNED` and does not append another binding version. This protects callback, patient-link, claim confirmation, repair, and telephony commands from duplicate side effects.

## Freeze Awareness

`IdentityBindingFreezeHold` is an active repair hook. While active, ordinary `candidate_refresh`, `provisional_verify`, `verified_bind`, and `claim_confirmed` commands are refused with `BINDING_179_FREEZE_ACTIVE_REFUSED`.

Authorized repair commands may proceed:

| Intent               | Freeze behavior                                  |
| -------------------- | ------------------------------------------------ |
| `correction_applied` | Allowed only with `repairAuthorized = true`.     |
| `revoked`            | Allowed to clear binding truth and derived refs. |
| Other intents        | Blocked while the freeze is active.              |

This prevents ordinary flows from racing an identity-repair case or inventing a parallel binding path.

## Derived Patient-Ref Safety

Derived `Request.patientRef` and `Episode.patientRef` values are not independent truth. They are projections of the current authority-settled binding version. They can be advanced only through `DerivedPatientRefSettlement` with `updatedByAuthority = IdentityBindingAuthority`.

Forbidden behavior:

| Forbidden action                                                   | Required alternative                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------- |
| Route-local request patient-ref mutation                           | Submit an authority command.                                  |
| Projection rebuild changing patient refs without a binding version | Rebuild from authority settlements.                           |
| Support override directly correcting a patient ref                 | Create repair/freeze posture and submit `correction_applied`. |
| Patient linker writing binding truth                               | Emit a binding authority intent.                              |

## Observability

Logs and telemetry may include settlement refs, binding version refs, subject refs, reason codes, and confidence summaries. They must not include raw evidence values. Evidence stays behind `IdentityEvidenceVault` refs, and patient-link confidence values are copied from `PatientLinkDecision` rather than recomputed in controllers.

## Gap Closures

| Gap                                                                        | Security closure                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `PARALLEL_INTERFACE_GAP_PHASE2_BINDING_SOLE_AUTHORITY_V1`                  | Binding truth changes are centralized in the authority service.    |
| `PARALLEL_INTERFACE_GAP_PHASE2_BINDING_APPEND_ONLY_VERSION_CHAIN_V1`       | Binding truth is never overwritten in place.                       |
| `PARALLEL_INTERFACE_GAP_PHASE2_BINDING_CURRENT_POINTER_CAS_V1`             | Stale or concurrent commands fail closed.                          |
| `PARALLEL_INTERFACE_GAP_PHASE2_BINDING_DERIVED_PATIENT_REF_TRANSACTION_V1` | Request and episode patient refs advance with the binding version. |
| `PARALLEL_INTERFACE_GAP_PHASE2_BINDING_IDEMPOTENT_COMMAND_REPLAY_V1`       | Duplicate commands return recorded settlements.                    |
| `PARALLEL_INTERFACE_GAP_PHASE2_BINDING_FREEZE_AWARE_REFUSAL_V1`            | Repair freezes block ordinary binding changes.                     |

## External Alignment

The authority follows replay-safe command-settlement, append-only audit, and optimistic concurrency patterns used for high-integrity state machines. It also follows OWASP logging guidance by keeping raw evidence out of authority logs and settlements.
