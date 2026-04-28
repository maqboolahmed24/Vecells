# 405 Phase 8 Regulatory Trigger Matrix

This matrix is a fail-closed release-control crosswalk. If a proposed change does not match a row cleanly, route it as `regulatory_posture_change` until a new published trigger rule exists.

| Change class | IM1 RFC | SCAL update | DTAC delta | DCB0129 delta | DCB0160 note | DPIA delta | MHRA or medical-device reassessment | Minimum release law |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `template_copy_only_no_behavior` | No, unless patient-facing or use-case wording changes | No | Conditional | No | No | Conditional | No | Candidate hash must remain stable or a new impact assessment is required. |
| `prompt_template_change` | Conditional | Conditional | Conditional | Conditional | Conditional | Conditional | Conditional | Replay against pinned evaluation corpus and safety owner review. |
| `threshold_calibration_policy_change` | Conditional | Conditional | Conditional | Yes | Conditional | No unless data processing changes | Conditional | Calibration and threshold artifacts must be repinned in the candidate. |
| `model_version_change` | Conditional | Conditional | Yes | Yes | Conditional | Conditional | Conditional | New candidate hash, replay proof, supplier freshness, rollback proof, and safety review. |
| `subprocessor_or_inference_host_change` | Conditional | Yes | Yes | Conditional | Conditional | Yes | Conditional | Subprocessor assurance, DPIA, security, and runtime publication checks are mandatory. |
| `capability_expansion` | Yes | Yes | Yes | Yes | Yes | Yes | Conditional | Full impact assessment, safety-case delta, approval graph, and rollback bundle. |
| `intended_use_change` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Medical-purpose boundary reassessment and product wording update. |
| `endpoint_suggestion_or_decision_support` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Independent clinical-safety review, medical-device assessment, and bounded rollout only. |
| `regulatory_posture_change` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Treat as blocker until the new posture is approved and baselined. |
| `safety_incident_or_hazard_response` | Conditional | Conditional | Conditional | Yes | Yes | Conditional | Conditional | Freeze first, then assess incident, safety case, and rollback or corrective action. |

## Deterministic Routing Rules

- `im1RfcRequired` is true when the originally assured IM1 use case materially evolves through AI integration, significant functional enhancement, endpoint suggestion, intended-use change, regulatory posture change, or capability expansion.
- `scalUpdateRequired` is true when IM1 RFC is true, supplier documentation changes, product evidence changes, or assurance evidence used for pairing changes.
- `dtacDeltaRequired` is true when clinical safety, data protection, technical security, interoperability, usability, accessibility, or DHT scope changes.
- `dcb0129DeltaRequired` is true when manufacturer-side hazards, controls, model/prompt behavior, safety case, or verification evidence changes.
- `dcb0160DependencyNoteRequired` is true when deployment organisations need updated safety, workflow, monitoring, integration, or runbook evidence.
- `dpiaDeltaRequired` is true when data categories, processors, subprocessors, telemetry disclosure, retention, geography, or purpose of processing changes.
- `mhraAssessmentRequired` is true when intended purpose, medical-purpose boundary, clinical decision support, significant device functionality, post-market safety issue, or registration posture changes.

## Boundary Examples

- Plain verified transcription remains below endpoint decision support, but it still requires integration, IG, safety, and monitoring controls.
- Generative summarisation, structured inference, coding, patient/referral letters, or record population raises the boundary and requires explicit impact assessment.
- Endpoint suggestions, triage recommendations, escalation recommendations, or clinically consequential workflow guidance are treated as highest-risk release candidates until a stricter published rule says otherwise.
