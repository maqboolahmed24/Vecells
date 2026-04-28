# 56 Route Intent Binding Contract

            ## Field Law

            | Field | Why It Exists | Hash Member | Drift Effect |
| --- | --- | --- | --- |
| routeIntentId | Stable identifier for the bound route-intent tuple. | yes | Unique row identity. |
| audienceSurface | Published audience surface consuming the writable route. | yes | Mismatch downgrades runtime authority. |
| shellType | Owning shell family for the route. | yes | Same-shell recovery must stay in this shell family. |
| routeFamily | Canonical route family being armed for mutation. | yes | Route-local aliases are descriptive only. |
| actionScope | Typed mutation scope resolved before dispatch. | yes | Commands route only through this scope. |
| governingObjectType | Authoritative lifecycle owner object kind. | yes | Ambiguity fails closed. |
| governingObjectRef | Exact current governing object ref. | yes | URL or cache may not retarget it. |
| canonicalObjectDescriptorRef | Canonical descriptor for the authoritative target. | yes | Missing descriptor forces recovery_only. |
| governingBoundedContextRef | Owning bounded context for mutation truth. | yes | Contributor surfaces cannot substitute a new owner. |
| governingObjectVersionRef | Current authoritative version or fence. | yes | Drift opens stale recovery. |
| lineageScope | Lineage axis the mutation is bound to. | yes | Cross-lineage replay is forbidden. |
| requiredContextBoundaryRefs[] | Explicit cross-context seams needed for the route. | yes | Launch source cannot infer authority. |
| parentAnchorRef | Selected anchor or dominant object summary preserved in recovery. | yes | Missing anchor forces recovery_only. |
| subjectRef | Subject or platform principal bound by the tuple. | yes | Wrong subject opens denial or repair. |
| grantFamily | Grant or role family legal for the action. | yes | Capability alone is insufficient. |
| sessionEpochRef | Current session epoch proving freshness. | yes | Session drift freezes mutation. |
| subjectBindingVersionRef | Current subject-binding version. | yes | Binding supersession downgrades the route. |
| actingScopeTupleRequirementRef | Named acting-scope requirement or tuple reference. | yes | Cross-org staff work must validate the tuple. |
| audienceSurfaceRuntimeBindingRef | Current published runtime binding required for actionability. | yes | Runtime publication may not be inferred elsewhere. |
| releaseApprovalFreezeRef | Pinned release approval freeze required for write posture. | yes | Drift blocks writable posture. |
| channelReleaseFreezeState | Current channel freeze state carried into the tuple. | yes | Freeze and kill-switch posture remain explicit. |
| requiredAssuranceSliceTrustRefs[] | Trust or watch tuple refs that must still validate. | yes | Trust drift degrades in place. |
| routeContractDigestRef | Digest proving the exact published route contract. | yes | Missing digest forces recovery_only. |
| routeIntentTupleHash | Immutable hash over the exact target tuple members. | derived | All writable reconstruction must use this hash. |
| bindingState | Current route-intent state: live, stale, superseded, or recovery_only. | no | State drives filter and downgrade behavior. |
| staleDisposition | Governed stale-handling posture for tuple drift. | no | Must return same-shell recovery. |
| recoveryEnvelopeFamily | Named same-shell recovery envelope family. | no | Detached error pages are forbidden. |

            ## Tuple Hash Members

            The immutable `routeIntentTupleHash` is computed over:

            - audienceSurface, shellType, routeFamily, actionScope, governingObjectType, governingObjectRef, canonicalObjectDescriptorRef
            - governingBoundedContextRef, governingObjectVersionRef, lineageScope, requiredContextBoundaryRefs[], parentAnchorRef, subjectRef, grantFamily
            - sessionEpochRef, subjectBindingVersionRef, actingScopeTupleRequirementRef, audienceSurfaceRuntimeBindingRef, releaseApprovalFreezeRef, channelReleaseFreezeState, routeContractDigestRef

            Writable authority may be reconstructed only from that full tuple. URL params, detached projection fragments, list-row snapshots, local selected-card state, or browser cache are descriptive only.

            ## Binding State Semantics

            | State | Meaning | Visible Posture |
| --- | --- | --- |
| live | All tuple members, runtime binding, release posture, and acting scope validate together. | Writable controls may render. |
| stale | A current route exists, but a governing version, fence, or parity dependency drifted. | Return same-shell stale recovery. |
| superseded | A newer governing tuple or anchor displaced the current route intent. | Resume or disambiguate in the same shell. |
| recovery_only | Legacy, partial, expired, or policy-blocked tuples may preserve summary only. | Writable posture is suppressed until reissued. |

            ## Drift Classes

            - Session drift: freeze mutation and reissue the current route intent.
            - Subject-binding drift: preserve the same shell but deny or repair authority in place.
            - Governing-object version drift: reopen through stale recovery or disambiguation.
            - Runtime publication or parity drift: degrade through the declared release recovery or route freeze disposition.
            - Acting-scope drift: deny cross-organisation or support mutation until the current seq_054 tuple is revalidated.
            - Legacy or partial tuple: force `bindingState = recovery_only`.

            ## Sample Tuple Matrix

            | Route intent | Route family | Action scope | Binding state | Tuple hash |
| --- | --- | --- | --- | --- |
| RIB_056_PATIENT_CLAIM_CURRENT_V1 | rf_patient_secure_link_recovery | claim | live | 3e89b5bd46d48d2f |
| RIB_056_PATIENT_CLAIM_LEGACY_PARTIAL_V1 | rf_patient_secure_link_recovery | claim | recovery_only | 3e89b5bd46d48d2f |
| RIB_056_PATIENT_MORE_INFO_REPLY_V1 | rf_patient_secure_link_recovery | respond_more_info | live | 285218faab2708f4 |
| RIB_056_PATIENT_MESSAGE_REPLY_V1 | rf_patient_messages | reply_message | live | aa2b74ebfdc89c55 |
| RIB_056_PATIENT_MESSAGE_REPLY_SUPERSEDED_V1 | rf_patient_messages | reply_message | superseded | b5075ce1cbda1a3a |
| RIB_056_PATIENT_CALLBACK_RESPONSE_V1 | rf_patient_messages | respond_callback | live | 32ae81f627b9e02d |
| RIB_056_PATIENT_MANAGE_BOOKING_V1 | rf_patient_appointments | manage_booking | live | 25c24436086aefba |
| RIB_056_PATIENT_WAITLIST_ACCEPT_V1 | rf_patient_appointments | accept_waitlist_offer | live | 946251af0e98a70f |

            ## Validator Hooks

            - The validator recomputes `routeIntentTupleHash` from the exact tuple members.
            - Every row must carry `parentAnchorRef`, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `routeContractDigestRef`, and `requiredContextBoundaryRefs[]`.
            - Every row must forbid authority reconstruction from URL params, cached projection fragments, and detached CTA state.
