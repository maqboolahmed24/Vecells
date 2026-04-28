# 228 Phase 3 Decision Epoch And Consequence Registry

Task: `seq_228`

Primary policy source: `data/contracts/228_approval_policy_matrix.yaml`

## Core consequence family

| Contract | Role |
| --- | --- |
| `EndpointDecision` | Typed endpoint choice plus endpoint-specific payload minimum |
| `DecisionEpoch` | Sole writable consequence fence |
| `DecisionSupersessionRecord` | Replayable reason why a once-live rail stopped being actionable |
| `EndpointDecisionBinding` | Determines whether the endpoint rail is writable, preview-only, stale, or blocked |
| `EndpointDecisionActionRecord` | Canonical route-intent-bound consequence action |
| `EndpointDecisionSettlement` | Authoritative settlement result for select, edit, preview, regenerate, and submit |
| `EndpointOutcomePreviewArtifact` | Governed summary-first preview artifact |
| `TriageOutcomePresentationArtifact` | Governed post-submit or handoff presentation artifact |

## Approval and urgent branch family

| Contract | Role |
| --- | --- |
| `ApprovalPolicyMatrix` | Frozen approval burden rules |
| `ApprovalRequirementAssessment` | Evaluates whether the current epoch requires approval |
| `ApprovalCheckpoint` | Epoch-bound approval state machine |
| `DutyEscalationRecord` | Urgent escalation root record |
| `UrgentContactAttempt` | Append-only urgent contact log |
| `UrgentEscalationOutcome` | Typed urgent result branch |

## Downstream consequence seed family

| Contract | Role |
| --- | --- |
| `BookingIntent` | Forward-stable booking handoff seed |
| `PharmacyIntent` | Forward-stable pharmacy handoff seed |
| `TriageReopenRecord` | Canonical reopen record after stale or superseded consequence |

## Fixed endpoint taxonomy

The only legal `EndpointDecision.chosenEndpoint` values are:

- `admin_resolution`
- `self_care_and_safety_net`
- `clinician_message`
- `clinician_callback`
- `appointment_required`
- `pharmacy_first_candidate`
- `duty_clinician_escalation`

## Canonical workspace actions

The endpoint rail action vocabulary is frozen to:

- `select_endpoint`
- `update_payload`
- `preview_outcome`
- `submit_endpoint`
- `regenerate_preview`

These remain workspace actions, not detached modal commits or browser-only form submits.

## Read surfaces

Canonical consequence-facing reads:

- `GET /v1/workspace/tasks/{taskId}/endpoint-decision`
- `GET /v1/workspace/tasks/{taskId}/decision-epoch`
- `GET /v1/workspace/tasks/{taskId}/approval`
- `GET /v1/workspace/tasks/{taskId}/urgent-escalation`
- `GET /v1/workspace/tasks/{taskId}/outcome-preview`

## Write surfaces

Canonical consequence-bearing writes remain governed through the task command chain frozen in `226`:

- `POST /v1/workspace/tasks/{taskId}:select-endpoint`
- `POST /v1/workspace/tasks/{taskId}:update-endpoint-payload`
- `POST /v1/workspace/tasks/{taskId}:preview-endpoint-outcome`
- `POST /v1/workspace/tasks/{taskId}:submit-endpoint`
- `POST /v1/workspace/tasks/{taskId}:request-approval`
- `POST /v1/workspace/tasks/{taskId}:record-approval`
- `POST /v1/workspace/tasks/{taskId}:start-urgent-escalation`
- `POST /v1/workspace/tasks/{taskId}:record-urgent-contact-attempt`
- `POST /v1/workspace/tasks/{taskId}:record-urgent-outcome`

## Binding and recovery rules

### Writable rail

Writable consequence requires:

- current `DecisionEpoch(epochState = live)`
- current `EndpointDecisionBinding(bindingState = live)`
- current trust, publication, and selected-anchor tuple parity
- any required `ApprovalRequirementAssessment`

### Stale rail

Stale consequence may remain visible as provenance through:

- `EndpointDecisionBinding(bindingState = preview_only | stale | blocked)`
- `DecisionSupersessionRecord`
- `ReleaseRecoveryDisposition`

It may not remain writable.

### Boundary-coupled rails

`admin_resolution` and `self_care_and_safety_net` must remain aligned to:

- `selfCareBoundaryDecisionRef`
- `boundaryTupleHash`
- `boundaryDecisionState`
- `clinicalMeaningState`
- `operationalFollowUpScope`

### Handoff seed law

`BookingIntent`, `PharmacyIntent`, urgent escalation outcomes, and reopen records must keep `decisionEpochRef` lineage-visible. Any stale seed fails closed to `stale_recoverable`.

## Presentation registry

Primary consequence UX is governed by `ArtifactPresentationContract` and `OutboundNavigationGrant` rather than route-local behavior.

That requirement now applies to:

- endpoint rationale summary
- patient outcome preview
- escalation summary
- booking handoff confirmation
- pharmacy handoff confirmation
- reopened case banner
