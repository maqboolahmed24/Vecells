# Identity Binding Authority Design

Task: `par_179_phase2_track_identity_build_identity_binding_authority_append_only_decision_engine`

## Purpose

`IdentityBindingAuthority` is the sole writer for identity binding truth. It accepts authority intents from auth, patient-linker, repair, telephony, support, and future flows, then serializes them into append-only binding versions with current-pointer compare-and-set and transactional derived patient-reference updates.

The implementation lives in `services/command-api/src/identity-binding-authority.ts` and exposes `createIdentityBindingAuthorityApplication()`.

## Authoritative Objects

| Object | Rule |
| --- | --- |
| `IdentityBindingVersion` | Append-only binding version. It carries subject, patient ref, binding state, ownership state, assurance level, intent type, supersession link, confidence snapshot, provenance refs, and `createdByAuthority = IdentityBindingAuthority`. |
| `IdentityBindingCurrentPointer` | Compare-and-set pointer for the subject's current binding version and current patient ref. |
| `BindingCommandSettlement` | Idempotent command settlement keyed by `idempotencyKey`; replay returns the recorded settlement instead of creating another version. |
| `DerivedPatientRefSettlement` | Transactional advancement for request and episode lineage refs under the same binding version. |
| `IdentityBindingFreezeHold` | Repair/freeze hook that blocks ordinary commands while identity repair is active. |
| `IdentityBindingAuthorityAuditRecord` | Append-only audit for accepted, replayed, denied, stale, CAS-conflict, and freeze-blocked commands. |

## Intent Semantics

| Intent | Binding state | Patient ref effect | Typical source |
| --- | --- | --- | --- |
| `candidate_refresh` | `candidate` | No patient ref. | PatientLinker ambiguous or no-candidate refresh. |
| `provisional_verify` | `provisional_verified` | No patient ref. | PatientLinker provisional step-up. |
| `verified_bind` | `verified_patient` | Sets current patient ref. | PatientLinker durable verified bind. |
| `claim_confirmed` | `claimed` | Confirms current patient ref. | Claim confirmation flow. |
| `correction_applied` | `corrected` | Replaces current patient ref under repair authorization. | Identity repair release. |
| `revoked` | `revoked` | Clears current patient ref. | Revocation or terminal repair outcome. |

Every accepted intent creates a new `IdentityBindingVersion`. Existing versions are never overwritten; supersession is represented by `supersedesBindingVersionRef`.

## Command Flow

1. `settleIdentityBindingCommand()` checks `idempotencyKey`.
2. If a settlement already exists, it returns `BINDING_179_REPLAY_RETURNED` and does not append a second version.
3. The authority reads the current pointer for `subjectRef`.
4. If a current pointer exists, the command must provide `expectedCurrentBindingVersionRef`; stale or missing expectations fail closed.
5. Active `IdentityBindingFreezeHold` blocks ordinary commands with `BINDING_179_FREEZE_ACTIVE_REFUSED`.
6. `correction_applied` can proceed through an active freeze only when `repairAuthorized = true`.
7. The repository commits binding version, current pointer, derived request/episode patient refs, command settlement, and audit as one authority transaction.

## Derived Patient References

`Request.patientRef` and `Episode.patientRef` advance only through `DerivedPatientRefSettlement`. The service never exposes a direct setter. The transaction stores:

| Field | Purpose |
| --- | --- |
| `lineageKind` and `lineageRef` | Names the request or episode lineage row being advanced. |
| `previousPatientRef` and `nextPatientRef` | Records the authority-owned patient-ref transition. |
| `previousBindingVersionRef` and `nextBindingVersionRef` | Binds derived refs to the exact binding version. |
| `updatedByAuthority` | Always `IdentityBindingAuthority`. |

Lineage CAS prevents stale commands from advancing a request or episode from an unexpected binding fence.

## Persistence

Migration `services/command-api/migrations/094_phase2_identity_binding_authority.sql` adds:

| Table | Purpose |
| --- | --- |
| `identity_binding_authority_versions` | Append-only binding version chain. |
| `identity_binding_current_pointers` | Current subject pointer with pointer epoch. |
| `identity_binding_command_settlements` | Idempotent command settlements and replay records. |
| `identity_binding_lineage_patient_refs` | Request/episode derived patient-ref settlements. |
| `identity_binding_freeze_holds` | Repair freeze hooks. |
| `identity_binding_authority_audit` | Authority command audit. |

## Gap Closures

| Gap | Closure |
| --- | --- |
| `PARALLEL_INTERFACE_GAP_PHASE2_BINDING_SOLE_AUTHORITY_V1` | All binding changes enter `IdentityBindingAuthority`; ordinary services submit intents only. |
| `PARALLEL_INTERFACE_GAP_PHASE2_BINDING_APPEND_ONLY_VERSION_CHAIN_V1` | Every accepted command appends a new binding version. |
| `PARALLEL_INTERFACE_GAP_PHASE2_BINDING_CURRENT_POINTER_CAS_V1` | Current binding pointer advances by expected-version compare-and-set. |
| `PARALLEL_INTERFACE_GAP_PHASE2_BINDING_DERIVED_PATIENT_REF_TRANSACTION_V1` | Request and episode refs advance only inside the authority transaction. |
| `PARALLEL_INTERFACE_GAP_PHASE2_BINDING_IDEMPOTENT_COMMAND_REPLAY_V1` | Duplicate idempotency keys return the recorded settlement. |
| `PARALLEL_INTERFACE_GAP_PHASE2_BINDING_FREEZE_AWARE_REFUSAL_V1` | Active repair freezes block ordinary commands and allow authorized correction/revocation paths. |

## Integration Points

The patient-linker emits candidate, provisional, and verified intents. Future claim, repair, telephony, and support flows should use `settleIdentityBindingCommand()` rather than writing binding truth or derived patient refs locally.
