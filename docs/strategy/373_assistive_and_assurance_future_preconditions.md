# 373 Assistive And Assurance Future Preconditions

Phase 8 and Phase 9 remain reserved. This gate publishes what they must inherit later, not permission to start them now.

The Phase 7 launch posture is `open_phase7_with_constraints`, so future phases inherit reserved preconditions but do not open from this decision.

## Phase 8 Reserve

| Inheritance gate              | Required Phase 7 artifact              | Why                                                                                           |
| ----------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `after_phase7_guardrail_pack` | `NHSAppIntegrationManifest`            | assistive surfaces need the same route and visibility envelope                                |
| `after_phase7_exit`           | `PatientEmbeddedSessionProjection`     | assistive invocation cannot infer embedded subject or session trust                           |
| `after_phase7_guardrail_pack` | `ArtifactPresentationContract`         | assistive note and document controls must not widen embedded artifact posture                 |
| `blocked_on_new_freeze`       | `ChannelTelemetryPlan`                 | assistive telemetry and trainability need their own Phase 8 freeze                            |
| `after_phase7_guardrail_pack` | `AccessibilitySemanticCoverageProfile` | assistive surfaces must inherit focus, announcement, reduced-motion, and host-return behavior |

## Phase 9 Reserve

| Inheritance gate        | Required Phase 7 artifact        | Why                                                                   |
| ----------------------- | -------------------------------- | --------------------------------------------------------------------- |
| `after_phase7_exit`     | `LinkResolutionAudit`            | assurance investigations need channel-entry lineage                   |
| `after_phase7_exit`     | `NHSAppPerformancePack`          | monthly and limited-release evidence must feed assurance packs        |
| `after_phase7_exit`     | `ChannelReleaseFreezeRecord`     | incident and freeze states must remain admissible evidence            |
| `blocked_on_new_freeze` | `AssuranceEvidenceGraphSnapshot` | Phase 9 must freeze graph admissibility before using Phase 7 evidence |

## Machine Ledgers

- `data/contracts/373_parallel_assistive_assurance_preconditions.json`
- `data/contracts/373_future_phase_dependency_reserve.json`
