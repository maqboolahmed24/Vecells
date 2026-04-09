
            # 22 Provider Selection Scorecards

            This pack freezes provider-family evaluation law before any named-vendor shortlist exists. It closes the gaps where API aesthetics, cheap procurement, or toy mocks could otherwise outrank proof semantics, ambiguity handling, or adapter-bound truth.

            Summary:
            - provider families: 8
            - dimension rows: 128
            - mock must-have rows: 110
            - actual kill-switch rows: 128
            - due-diligence questions: 128
            - Phase 0 entry posture inherited from seq_020: `withheld`

            Rating scale:
            - `0`: not demonstrated
            - `1`: placeholder only
            - `2`: partial or unsafe
            - `3`: adequate with bounded risk
            - `4`: strong and reusable
            - `5`: blueprint-grade and proven

            Qualification law:
            - `Mock_now_execution`: every dimension must meet `minimum_bar_mock_now`, and no mock kill-switch may trip.
            - `Actual_provider_strategy_later`: every dimension must meet `minimum_bar_actual_later`, and no actual-provider kill-switch may trip.
            - Weighted score formula for future vendor comparison: `sum(provider_rating * lane_weight) / sum(lane_weight) * 100`.

            | Family | Baseline role | Mapped seams | Top mock-now weights | Top actual-later weights |
| --- | --- | --- | --- | --- |
| identity_auth | baseline_required | NHS login core identity rail | Ambiguity And Partial Failure Semantics (12), Authoritative Truth Separation (12), Sandbox Depth And Environment Isolation (12), Security, Authentication, And Replay Control (12) | Ambiguity And Partial Failure Semantics (12), Authoritative Truth Separation (12), Security, Authentication, And Replay Control (12), Capability And Tuple Coverage (11) |
| telephony_voice_and_recording | baseline_mock_required | Telephony capture, transcript, and artifact-safety backplane | Ambiguity And Partial Failure Semantics (12), Authoritative Truth Separation (12), Sandbox Depth And Environment Isolation (12), Simulator Fidelity And State Coverage (12) | Ambiguity And Partial Failure Semantics (12), Authoritative Truth Separation (12), Resilience And Degraded-Mode Compatibility (11), Capability And Tuple Coverage (10) |
| notifications_sms | optional_flagged | SMS continuation delivery rail | Ambiguity And Partial Failure Semantics (11), Authoritative Truth Separation (11), Simulator Fidelity And State Coverage (11), Capability And Tuple Coverage (10) | Authoritative Truth Separation (11), Ambiguity And Partial Failure Semantics (10), Capability And Tuple Coverage (10), Resilience And Degraded-Mode Compatibility (10) |
| notifications_email | baseline_mock_required | Email and secure-link notification rail | Ambiguity And Partial Failure Semantics (11), Authoritative Truth Separation (11), Simulator Fidelity And State Coverage (11), Capability And Tuple Coverage (10) | Authoritative Truth Separation (11), Ambiguity And Partial Failure Semantics (10), Capability And Tuple Coverage (10), Resilience And Degraded-Mode Compatibility (10) |
| gp_im1_and_booking_supplier | baseline_mock_required | IM1 pairing and capability-governance prerequisite seam, Local booking provider capability and confirmation-truth seam | Authoritative Truth Separation (12), Capability And Tuple Coverage (12), Sandbox Depth And Environment Isolation (12), Simulator Fidelity And State Coverage (12) | Authoritative Truth Separation (12), Capability And Tuple Coverage (12), Onboarding Friction And Sponsor Burden (12), Ambiguity And Partial Failure Semantics (11) |
| pharmacy_directory | baseline_mock_required | Pharmacy directory and patient-choice seam | Simulator Fidelity And State Coverage (12), Ambiguity And Partial Failure Semantics (11), Sandbox Depth And Environment Isolation (11), Authoritative Truth Separation (10) | Ambiguity And Partial Failure Semantics (11), Authoritative Truth Separation (10), Capability And Tuple Coverage (10), Security, Authentication, And Replay Control (10) |
| pharmacy_dispatch_transport | baseline_mock_required | Pharmacy dispatch proof and urgent-return seam, Cross-organisation secure messaging and MESH seam | Authoritative Truth Separation (12), Simulator Fidelity And State Coverage (12), Ambiguity And Partial Failure Semantics (11), Resilience And Degraded-Mode Compatibility (11) | Authoritative Truth Separation (12), Ambiguity And Partial Failure Semantics (11), Capability And Tuple Coverage (11), Observability, Audit, And Replay Support (11) |
| pharmacy_outcome_observation | baseline_mock_required | Pharmacy outcome observation and reconciliation seam | Authoritative Truth Separation (12), Simulator Fidelity And State Coverage (12), Ambiguity And Partial Failure Semantics (11), Sandbox Depth And Environment Isolation (11) | Authoritative Truth Separation (12), Ambiguity And Partial Failure Semantics (11), Observability, Audit, And Replay Support (11), Capability And Tuple Coverage (10) |

            ## Identity / Authentication

                - provider family: `identity_auth`
                - baseline role: `baseline_required`
                - recommended lane from seq_021: `hybrid_mock_then_live`
                - mapped seams: NHS login core identity rail

                **Mock_now_execution**

                Build a contract-first simulator for the NHS login identity rail that preserves the full state and proof model before named vendor work begins.

                **Actual_provider_strategy_later**

                Admit a live provider for the NHS login identity rail only when the provider can satisfy the same truth, ambiguity, degraded-mode, and audit laws already proven in the simulator.

                | Dimension | Class | Mock weight | Mock bar | Actual weight | Actual bar | Lane delta |
| --- | --- | --- | --- | --- | --- | --- |
| Capability And Tuple Coverage | capability | 11 | 4 | 11 | 4 | shared_weight |
| Authoritative Truth Separation | proof_truth | 12 | 5 | 12 | 5 | shared_weight |
| Ambiguity And Partial Failure Semantics | ambiguity_handling | 12 | 5 | 12 | 5 | shared_weight |
| Security, Authentication, And Replay Control | security | 12 | 5 | 12 | 5 | shared_weight |
| Privacy, Residency, And Subprocessor Transparency | privacy | 7 | 3 | 9 | 4 | actual_later_heavier |
| UK Healthcare Compliance And Assurance Readiness | compliance | 8 | 3 | 11 | 5 | actual_later_heavier |
| Onboarding Friction And Sponsor Burden | onboarding_friction | 5 | 2 | 11 | 4 | actual_later_heavier |
| Sandbox Depth And Environment Isolation | sandbox_quality | 12 | 5 | 8 | 4 | mock_now_heavier |
| Test Data And Synthetic Fixture Quality | test_data_quality | 10 | 4 | 8 | 4 | mock_now_heavier |
| Observability, Audit, And Replay Support | observability | 9 | 3 | 9 | 4 | shared_weight |
| Operational Support And Incident Handling | operational_support | 7 | 3 | 9 | 4 | actual_later_heavier |
| Cost Governance And Lock-In Control | cost_governance | 3 | 2 | 6 | 3 | actual_later_heavier |
| Portability And Adapter Exit Posture | portability | 6 | 3 | 8 | 4 | actual_later_heavier |
| Resilience And Degraded-Mode Compatibility | resilience | 10 | 4 | 10 | 4 | shared_weight |
| UI / Brand / Interaction Constraints | ui_brand_constraints | 9 | 4 | 9 | 5 | shared_weight |
| Simulator Fidelity And State Coverage | mock_fidelity | 12 | 5 | 5 | 3 | mock_now_heavier |

                Mock kill-switch digest:
                | Dimension | Mock kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the mock if it collapses capability, route tuple, or actor scope into a generic success flow. |
| Authoritative Truth Separation | Reject the mock if provider acceptance or webhook arrival is treated as authoritative truth. |
| Ambiguity And Partial Failure Semantics | Reject the mock if contradictory or weak evidence collapses into silent retry or silent success. |
| Security, Authentication, And Replay Control | Reject the mock if it permits direct browser calls, token reuse, or unverified callbacks. |
| Privacy, Residency, And Subprocessor Transparency | Reject the mock if it encourages real credentials, real patient data, or uncontrolled retention. |
| UK Healthcare Compliance And Assurance Readiness | Reject the mock if it implies live approval or hides later assurance obligations. |
| Onboarding Friction And Sponsor Burden | Reject the mock if it pretends onboarding does not matter or hides later human approvals. |
| Sandbox Depth And Environment Isolation | Reject the mock if the sandbox misses states that drive patient-visible truth, safety, or control-plane decisions. |
| Test Data And Synthetic Fixture Quality | Reject the mock if fixture data cannot reproduce the states that later drive calmness, closure, or recovery. |
| Observability, Audit, And Replay Support | Reject the mock if it removes the audit or replay evidence later diagnostics will rely on. |
| Operational Support And Incident Handling | Reject the mock if degraded paths exist with no clear recovery owner or operator action. |
| Cost Governance And Lock-In Control | Reject the mock if it bakes one vendor's commercial model into the product contract. |
| Portability And Adapter Exit Posture | Reject the mock if identifiers, proof objects, or UX copy become inseparable from one supplier model. |
| Resilience And Degraded-Mode Compatibility | Reject the mock if degraded or stale states are absent or if recovery posture diverges from the blueprint. |
| UI / Brand / Interaction Constraints | Reject the mock if it hides provider-driven interaction constraints that later affect UX truth. |
| Simulator Fidelity And State Coverage | Reject the mock if it omits states that later drive patient-visible truth, safety, or closure behavior. |

                Actual-provider kill-switch digest:
                | Dimension | Actual-provider kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the provider if Vecells would need supplier-specific business logic outside the published adapter contract. |
| Authoritative Truth Separation | Reject the provider if it cannot represent authoritative truth separately from accepted transport or local acknowledgement. |
| Ambiguity And Partial Failure Semantics | Reject the provider if failure semantics are opaque or if ambiguity cannot be surfaced for review. |
| Security, Authentication, And Replay Control | Reject the provider if replay protection, callback authenticity, or environment isolation are inadequate. |
| Privacy, Residency, And Subprocessor Transparency | Reject the provider if residency, subprocessor scope, or deletion posture are unclear or incompatible. |
| UK Healthcare Compliance And Assurance Readiness | Reject the provider if compliance posture is incompatible or cannot be evidenced for audit. |
| Onboarding Friction And Sponsor Burden | Reject the provider if critical approvals, sponsor paths, or account prerequisites are undefined. |
| Sandbox Depth And Environment Isolation | Reject the provider if its sandbox is too shallow to verify the required semantics before go-live. |
| Test Data And Synthetic Fixture Quality | Reject the provider if test data cannot reproduce the required control-plane and failure semantics. |
| Observability, Audit, And Replay Support | Reject the provider if audit, replay, or diagnostic support is too weak to prove control-plane behavior. |
| Operational Support And Incident Handling | Reject the provider if support or incident handling cannot sustain the required service posture. |
| Cost Governance And Lock-In Control | Reject the provider if lock-in or pricing posture would undermine later portability or roadmap freedom. |
| Portability And Adapter Exit Posture | Reject the provider if replacement would force core lifecycle logic to be rewritten. |
| Resilience And Degraded-Mode Compatibility | Reject the provider if outage or partial-failure behavior cannot support the declared degraded mode. |
| UI / Brand / Interaction Constraints | Reject the provider if required UX or branding constraints would force misleading or non-compliant flows. |
| Simulator Fidelity And State Coverage | Reject the provider if onboarding would break simulator parity or invalidate the approved contract tests. |

## Telephony / IVR / Recording

                - provider family: `telephony_voice_and_recording`
                - baseline role: `baseline_mock_required`
                - recommended lane from seq_021: `mock_now`
                - mapped seams: Telephony capture, transcript, and artifact-safety backplane

                **Mock_now_execution**

                Build a contract-first simulator for telephony voice capture, recording, and transcript processing that preserves the full state and proof model before named vendor work begins.

                **Actual_provider_strategy_later**

                Admit a live provider for telephony voice capture, recording, and transcript processing only when the provider can satisfy the same truth, ambiguity, degraded-mode, and audit laws already proven in the simulator.

                | Dimension | Class | Mock weight | Mock bar | Actual weight | Actual bar | Lane delta |
| --- | --- | --- | --- | --- | --- | --- |
| Capability And Tuple Coverage | capability | 11 | 4 | 10 | 4 | mock_now_heavier |
| Authoritative Truth Separation | proof_truth | 12 | 5 | 12 | 5 | shared_weight |
| Ambiguity And Partial Failure Semantics | ambiguity_handling | 12 | 5 | 12 | 5 | shared_weight |
| Security, Authentication, And Replay Control | security | 9 | 4 | 10 | 4 | actual_later_heavier |
| Privacy, Residency, And Subprocessor Transparency | privacy | 9 | 4 | 10 | 5 | actual_later_heavier |
| UK Healthcare Compliance And Assurance Readiness | compliance | 8 | 4 | 10 | 5 | actual_later_heavier |
| Onboarding Friction And Sponsor Burden | onboarding_friction | 4 | 2 | 9 | 3 | actual_later_heavier |
| Sandbox Depth And Environment Isolation | sandbox_quality | 12 | 5 | 8 | 4 | mock_now_heavier |
| Test Data And Synthetic Fixture Quality | test_data_quality | 11 | 4 | 8 | 4 | mock_now_heavier |
| Observability, Audit, And Replay Support | observability | 10 | 3 | 10 | 5 | shared_weight |
| Operational Support And Incident Handling | operational_support | 9 | 4 | 9 | 4 | shared_weight |
| Cost Governance And Lock-In Control | cost_governance | 3 | 2 | 6 | 3 | actual_later_heavier |
| Portability And Adapter Exit Posture | portability | 6 | 3 | 8 | 4 | actual_later_heavier |
| Resilience And Degraded-Mode Compatibility | resilience | 11 | 5 | 11 | 5 | shared_weight |
| UI / Brand / Interaction Constraints | ui_brand_constraints | 5 | 3 | 6 | 3 | actual_later_heavier |
| Simulator Fidelity And State Coverage | mock_fidelity | 12 | 5 | 5 | 3 | mock_now_heavier |

                Mock kill-switch digest:
                | Dimension | Mock kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the mock if it collapses capability, route tuple, or actor scope into a generic success flow. |
| Authoritative Truth Separation | Reject the mock if provider acceptance or webhook arrival is treated as authoritative truth. |
| Ambiguity And Partial Failure Semantics | Reject the mock if contradictory or weak evidence collapses into silent retry or silent success. |
| Security, Authentication, And Replay Control | Reject the mock if it permits direct browser calls, token reuse, or unverified callbacks. |
| Privacy, Residency, And Subprocessor Transparency | Reject the mock if it encourages real credentials, real patient data, or uncontrolled retention. |
| UK Healthcare Compliance And Assurance Readiness | Reject the mock if it implies live approval or hides later assurance obligations. |
| Onboarding Friction And Sponsor Burden | Reject the mock if it pretends onboarding does not matter or hides later human approvals. |
| Sandbox Depth And Environment Isolation | Reject the mock if the sandbox misses states that drive patient-visible truth, safety, or control-plane decisions. |
| Test Data And Synthetic Fixture Quality | Reject the mock if fixture data cannot reproduce the states that later drive calmness, closure, or recovery. |
| Observability, Audit, And Replay Support | Reject the mock if it removes the audit or replay evidence later diagnostics will rely on. |
| Operational Support And Incident Handling | Reject the mock if degraded paths exist with no clear recovery owner or operator action. |
| Cost Governance And Lock-In Control | Reject the mock if it bakes one vendor's commercial model into the product contract. |
| Portability And Adapter Exit Posture | Reject the mock if identifiers, proof objects, or UX copy become inseparable from one supplier model. |
| Resilience And Degraded-Mode Compatibility | Reject the mock if degraded or stale states are absent or if recovery posture diverges from the blueprint. |
| UI / Brand / Interaction Constraints | Reject the mock if it hides provider-driven interaction constraints that later affect UX truth. |
| Simulator Fidelity And State Coverage | Reject the mock if it omits states that later drive patient-visible truth, safety, or closure behavior. |

                Actual-provider kill-switch digest:
                | Dimension | Actual-provider kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the provider if Vecells would need supplier-specific business logic outside the published adapter contract. |
| Authoritative Truth Separation | Reject the provider if it cannot represent authoritative truth separately from accepted transport or local acknowledgement. |
| Ambiguity And Partial Failure Semantics | Reject the provider if failure semantics are opaque or if ambiguity cannot be surfaced for review. |
| Security, Authentication, And Replay Control | Reject the provider if replay protection, callback authenticity, or environment isolation are inadequate. |
| Privacy, Residency, And Subprocessor Transparency | Reject the provider if residency, subprocessor scope, or deletion posture are unclear or incompatible. |
| UK Healthcare Compliance And Assurance Readiness | Reject the provider if compliance posture is incompatible or cannot be evidenced for audit. |
| Onboarding Friction And Sponsor Burden | Reject the provider if critical approvals, sponsor paths, or account prerequisites are undefined. |
| Sandbox Depth And Environment Isolation | Reject the provider if its sandbox is too shallow to verify the required semantics before go-live. |
| Test Data And Synthetic Fixture Quality | Reject the provider if test data cannot reproduce the required control-plane and failure semantics. |
| Observability, Audit, And Replay Support | Reject the provider if audit, replay, or diagnostic support is too weak to prove control-plane behavior. |
| Operational Support And Incident Handling | Reject the provider if support or incident handling cannot sustain the required service posture. |
| Cost Governance And Lock-In Control | Reject the provider if lock-in or pricing posture would undermine later portability or roadmap freedom. |
| Portability And Adapter Exit Posture | Reject the provider if replacement would force core lifecycle logic to be rewritten. |
| Resilience And Degraded-Mode Compatibility | Reject the provider if outage or partial-failure behavior cannot support the declared degraded mode. |
| UI / Brand / Interaction Constraints | Reject the provider if required UX or branding constraints would force misleading or non-compliant flows. |
| Simulator Fidelity And State Coverage | Reject the provider if onboarding would break simulator parity or invalidate the approved contract tests. |

## Notifications / SMS

                - provider family: `notifications_sms`
                - baseline role: `optional_flagged`
                - recommended lane from seq_021: `actual_later`
                - mapped seams: SMS continuation delivery rail

                **Mock_now_execution**

                Build a contract-first simulator for the SMS continuation delivery rail that preserves the full state and proof model before named vendor work begins.

                **Actual_provider_strategy_later**

                Admit a live provider for the SMS continuation delivery rail only when the provider can satisfy the same truth, ambiguity, degraded-mode, and audit laws already proven in the simulator.

                | Dimension | Class | Mock weight | Mock bar | Actual weight | Actual bar | Lane delta |
| --- | --- | --- | --- | --- | --- | --- |
| Capability And Tuple Coverage | capability | 10 | 4 | 10 | 4 | shared_weight |
| Authoritative Truth Separation | proof_truth | 11 | 5 | 11 | 5 | shared_weight |
| Ambiguity And Partial Failure Semantics | ambiguity_handling | 11 | 5 | 10 | 5 | mock_now_heavier |
| Security, Authentication, And Replay Control | security | 9 | 4 | 10 | 4 | actual_later_heavier |
| Privacy, Residency, And Subprocessor Transparency | privacy | 7 | 3 | 9 | 4 | actual_later_heavier |
| UK Healthcare Compliance And Assurance Readiness | compliance | 6 | 3 | 10 | 4 | actual_later_heavier |
| Onboarding Friction And Sponsor Burden | onboarding_friction | 4 | 2 | 7 | 3 | actual_later_heavier |
| Sandbox Depth And Environment Isolation | sandbox_quality | 10 | 5 | 7 | 4 | mock_now_heavier |
| Test Data And Synthetic Fixture Quality | test_data_quality | 9 | 4 | 7 | 4 | mock_now_heavier |
| Observability, Audit, And Replay Support | observability | 8 | 3 | 9 | 4 | actual_later_heavier |
| Operational Support And Incident Handling | operational_support | 7 | 3 | 9 | 4 | actual_later_heavier |
| Cost Governance And Lock-In Control | cost_governance | 4 | 2 | 7 | 3 | actual_later_heavier |
| Portability And Adapter Exit Posture | portability | 6 | 3 | 8 | 4 | actual_later_heavier |
| Resilience And Degraded-Mode Compatibility | resilience | 9 | 4 | 10 | 4 | actual_later_heavier |
| UI / Brand / Interaction Constraints | ui_brand_constraints | 7 | 4 | 7 | 4 | shared_weight |
| Simulator Fidelity And State Coverage | mock_fidelity | 11 | 5 | 4 | 3 | mock_now_heavier |

                Mock kill-switch digest:
                | Dimension | Mock kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the mock if it collapses capability, route tuple, or actor scope into a generic success flow. |
| Authoritative Truth Separation | Reject the mock if provider acceptance or webhook arrival is treated as authoritative truth. |
| Ambiguity And Partial Failure Semantics | Reject the mock if contradictory or weak evidence collapses into silent retry or silent success. |
| Security, Authentication, And Replay Control | Reject the mock if it permits direct browser calls, token reuse, or unverified callbacks. |
| Privacy, Residency, And Subprocessor Transparency | Reject the mock if it encourages real credentials, real patient data, or uncontrolled retention. |
| UK Healthcare Compliance And Assurance Readiness | Reject the mock if it implies live approval or hides later assurance obligations. |
| Onboarding Friction And Sponsor Burden | Reject the mock if it pretends onboarding does not matter or hides later human approvals. |
| Sandbox Depth And Environment Isolation | Reject the mock if the sandbox misses states that drive patient-visible truth, safety, or control-plane decisions. |
| Test Data And Synthetic Fixture Quality | Reject the mock if fixture data cannot reproduce the states that later drive calmness, closure, or recovery. |
| Observability, Audit, And Replay Support | Reject the mock if it removes the audit or replay evidence later diagnostics will rely on. |
| Operational Support And Incident Handling | Reject the mock if degraded paths exist with no clear recovery owner or operator action. |
| Cost Governance And Lock-In Control | Reject the mock if it bakes one vendor's commercial model into the product contract. |
| Portability And Adapter Exit Posture | Reject the mock if identifiers, proof objects, or UX copy become inseparable from one supplier model. |
| Resilience And Degraded-Mode Compatibility | Reject the mock if degraded or stale states are absent or if recovery posture diverges from the blueprint. |
| UI / Brand / Interaction Constraints | Reject the mock if it hides provider-driven interaction constraints that later affect UX truth. |
| Simulator Fidelity And State Coverage | Reject the mock if it omits states that later drive patient-visible truth, safety, or closure behavior. |

                Actual-provider kill-switch digest:
                | Dimension | Actual-provider kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the provider if Vecells would need supplier-specific business logic outside the published adapter contract. |
| Authoritative Truth Separation | Reject the provider if it cannot represent authoritative truth separately from accepted transport or local acknowledgement. |
| Ambiguity And Partial Failure Semantics | Reject the provider if failure semantics are opaque or if ambiguity cannot be surfaced for review. |
| Security, Authentication, And Replay Control | Reject the provider if replay protection, callback authenticity, or environment isolation are inadequate. |
| Privacy, Residency, And Subprocessor Transparency | Reject the provider if residency, subprocessor scope, or deletion posture are unclear or incompatible. |
| UK Healthcare Compliance And Assurance Readiness | Reject the provider if compliance posture is incompatible or cannot be evidenced for audit. |
| Onboarding Friction And Sponsor Burden | Reject the provider if critical approvals, sponsor paths, or account prerequisites are undefined. |
| Sandbox Depth And Environment Isolation | Reject the provider if its sandbox is too shallow to verify the required semantics before go-live. |
| Test Data And Synthetic Fixture Quality | Reject the provider if test data cannot reproduce the required control-plane and failure semantics. |
| Observability, Audit, And Replay Support | Reject the provider if audit, replay, or diagnostic support is too weak to prove control-plane behavior. |
| Operational Support And Incident Handling | Reject the provider if support or incident handling cannot sustain the required service posture. |
| Cost Governance And Lock-In Control | Reject the provider if lock-in or pricing posture would undermine later portability or roadmap freedom. |
| Portability And Adapter Exit Posture | Reject the provider if replacement would force core lifecycle logic to be rewritten. |
| Resilience And Degraded-Mode Compatibility | Reject the provider if outage or partial-failure behavior cannot support the declared degraded mode. |
| UI / Brand / Interaction Constraints | Reject the provider if required UX or branding constraints would force misleading or non-compliant flows. |
| Simulator Fidelity And State Coverage | Reject the provider if onboarding would break simulator parity or invalidate the approved contract tests. |

## Notifications / Email

                - provider family: `notifications_email`
                - baseline role: `baseline_mock_required`
                - recommended lane from seq_021: `mock_now`
                - mapped seams: Email and secure-link notification rail

                **Mock_now_execution**

                Build a contract-first simulator for the email and secure-link delivery rail that preserves the full state and proof model before named vendor work begins.

                **Actual_provider_strategy_later**

                Admit a live provider for the email and secure-link delivery rail only when the provider can satisfy the same truth, ambiguity, degraded-mode, and audit laws already proven in the simulator.

                | Dimension | Class | Mock weight | Mock bar | Actual weight | Actual bar | Lane delta |
| --- | --- | --- | --- | --- | --- | --- |
| Capability And Tuple Coverage | capability | 10 | 4 | 10 | 4 | shared_weight |
| Authoritative Truth Separation | proof_truth | 11 | 5 | 11 | 5 | shared_weight |
| Ambiguity And Partial Failure Semantics | ambiguity_handling | 11 | 5 | 10 | 5 | mock_now_heavier |
| Security, Authentication, And Replay Control | security | 9 | 4 | 10 | 4 | actual_later_heavier |
| Privacy, Residency, And Subprocessor Transparency | privacy | 7 | 3 | 9 | 4 | actual_later_heavier |
| UK Healthcare Compliance And Assurance Readiness | compliance | 6 | 3 | 10 | 4 | actual_later_heavier |
| Onboarding Friction And Sponsor Burden | onboarding_friction | 4 | 2 | 9 | 3 | actual_later_heavier |
| Sandbox Depth And Environment Isolation | sandbox_quality | 10 | 5 | 7 | 4 | mock_now_heavier |
| Test Data And Synthetic Fixture Quality | test_data_quality | 9 | 4 | 7 | 4 | mock_now_heavier |
| Observability, Audit, And Replay Support | observability | 8 | 3 | 9 | 4 | actual_later_heavier |
| Operational Support And Incident Handling | operational_support | 7 | 3 | 9 | 4 | actual_later_heavier |
| Cost Governance And Lock-In Control | cost_governance | 3 | 2 | 6 | 3 | actual_later_heavier |
| Portability And Adapter Exit Posture | portability | 6 | 3 | 8 | 4 | actual_later_heavier |
| Resilience And Degraded-Mode Compatibility | resilience | 9 | 4 | 10 | 4 | actual_later_heavier |
| UI / Brand / Interaction Constraints | ui_brand_constraints | 8 | 4 | 7 | 4 | mock_now_heavier |
| Simulator Fidelity And State Coverage | mock_fidelity | 11 | 5 | 4 | 3 | mock_now_heavier |

                Mock kill-switch digest:
                | Dimension | Mock kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the mock if it collapses capability, route tuple, or actor scope into a generic success flow. |
| Authoritative Truth Separation | Reject the mock if provider acceptance or webhook arrival is treated as authoritative truth. |
| Ambiguity And Partial Failure Semantics | Reject the mock if contradictory or weak evidence collapses into silent retry or silent success. |
| Security, Authentication, And Replay Control | Reject the mock if it permits direct browser calls, token reuse, or unverified callbacks. |
| Privacy, Residency, And Subprocessor Transparency | Reject the mock if it encourages real credentials, real patient data, or uncontrolled retention. |
| UK Healthcare Compliance And Assurance Readiness | Reject the mock if it implies live approval or hides later assurance obligations. |
| Onboarding Friction And Sponsor Burden | Reject the mock if it pretends onboarding does not matter or hides later human approvals. |
| Sandbox Depth And Environment Isolation | Reject the mock if the sandbox misses states that drive patient-visible truth, safety, or control-plane decisions. |
| Test Data And Synthetic Fixture Quality | Reject the mock if fixture data cannot reproduce the states that later drive calmness, closure, or recovery. |
| Observability, Audit, And Replay Support | Reject the mock if it removes the audit or replay evidence later diagnostics will rely on. |
| Operational Support And Incident Handling | Reject the mock if degraded paths exist with no clear recovery owner or operator action. |
| Cost Governance And Lock-In Control | Reject the mock if it bakes one vendor's commercial model into the product contract. |
| Portability And Adapter Exit Posture | Reject the mock if identifiers, proof objects, or UX copy become inseparable from one supplier model. |
| Resilience And Degraded-Mode Compatibility | Reject the mock if degraded or stale states are absent or if recovery posture diverges from the blueprint. |
| UI / Brand / Interaction Constraints | Reject the mock if it hides provider-driven interaction constraints that later affect UX truth. |
| Simulator Fidelity And State Coverage | Reject the mock if it omits states that later drive patient-visible truth, safety, or closure behavior. |

                Actual-provider kill-switch digest:
                | Dimension | Actual-provider kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the provider if Vecells would need supplier-specific business logic outside the published adapter contract. |
| Authoritative Truth Separation | Reject the provider if it cannot represent authoritative truth separately from accepted transport or local acknowledgement. |
| Ambiguity And Partial Failure Semantics | Reject the provider if failure semantics are opaque or if ambiguity cannot be surfaced for review. |
| Security, Authentication, And Replay Control | Reject the provider if replay protection, callback authenticity, or environment isolation are inadequate. |
| Privacy, Residency, And Subprocessor Transparency | Reject the provider if residency, subprocessor scope, or deletion posture are unclear or incompatible. |
| UK Healthcare Compliance And Assurance Readiness | Reject the provider if compliance posture is incompatible or cannot be evidenced for audit. |
| Onboarding Friction And Sponsor Burden | Reject the provider if critical approvals, sponsor paths, or account prerequisites are undefined. |
| Sandbox Depth And Environment Isolation | Reject the provider if its sandbox is too shallow to verify the required semantics before go-live. |
| Test Data And Synthetic Fixture Quality | Reject the provider if test data cannot reproduce the required control-plane and failure semantics. |
| Observability, Audit, And Replay Support | Reject the provider if audit, replay, or diagnostic support is too weak to prove control-plane behavior. |
| Operational Support And Incident Handling | Reject the provider if support or incident handling cannot sustain the required service posture. |
| Cost Governance And Lock-In Control | Reject the provider if lock-in or pricing posture would undermine later portability or roadmap freedom. |
| Portability And Adapter Exit Posture | Reject the provider if replacement would force core lifecycle logic to be rewritten. |
| Resilience And Degraded-Mode Compatibility | Reject the provider if outage or partial-failure behavior cannot support the declared degraded mode. |
| UI / Brand / Interaction Constraints | Reject the provider if required UX or branding constraints would force misleading or non-compliant flows. |
| Simulator Fidelity And State Coverage | Reject the provider if onboarding would break simulator parity or invalidate the approved contract tests. |

## GP / IM1 / Booking Supplier

                - provider family: `gp_im1_and_booking_supplier`
                - baseline role: `baseline_mock_required`
                - recommended lane from seq_021: `mock_now`
                - mapped seams: IM1 pairing and capability-governance prerequisite seam, Local booking provider capability and confirmation-truth seam

                **Mock_now_execution**

                Build a contract-first simulator for GP-system pairing and local booking supplier boundaries that preserves the full state and proof model before named vendor work begins.

                **Actual_provider_strategy_later**

                Admit a live provider for GP-system pairing and local booking supplier boundaries only when the provider can satisfy the same truth, ambiguity, degraded-mode, and audit laws already proven in the simulator.

                | Dimension | Class | Mock weight | Mock bar | Actual weight | Actual bar | Lane delta |
| --- | --- | --- | --- | --- | --- | --- |
| Capability And Tuple Coverage | capability | 12 | 5 | 12 | 5 | shared_weight |
| Authoritative Truth Separation | proof_truth | 12 | 5 | 12 | 5 | shared_weight |
| Ambiguity And Partial Failure Semantics | ambiguity_handling | 11 | 5 | 11 | 5 | shared_weight |
| Security, Authentication, And Replay Control | security | 9 | 4 | 10 | 4 | actual_later_heavier |
| Privacy, Residency, And Subprocessor Transparency | privacy | 7 | 3 | 9 | 4 | actual_later_heavier |
| UK Healthcare Compliance And Assurance Readiness | compliance | 8 | 3 | 11 | 5 | actual_later_heavier |
| Onboarding Friction And Sponsor Burden | onboarding_friction | 5 | 2 | 12 | 4 | actual_later_heavier |
| Sandbox Depth And Environment Isolation | sandbox_quality | 12 | 5 | 8 | 4 | mock_now_heavier |
| Test Data And Synthetic Fixture Quality | test_data_quality | 11 | 4 | 9 | 5 | mock_now_heavier |
| Observability, Audit, And Replay Support | observability | 9 | 3 | 10 | 5 | actual_later_heavier |
| Operational Support And Incident Handling | operational_support | 8 | 3 | 9 | 4 | actual_later_heavier |
| Cost Governance And Lock-In Control | cost_governance | 3 | 2 | 6 | 3 | actual_later_heavier |
| Portability And Adapter Exit Posture | portability | 8 | 3 | 9 | 5 | actual_later_heavier |
| Resilience And Degraded-Mode Compatibility | resilience | 11 | 5 | 11 | 5 | shared_weight |
| UI / Brand / Interaction Constraints | ui_brand_constraints | 2 | 3 | 3 | 3 | actual_later_heavier |
| Simulator Fidelity And State Coverage | mock_fidelity | 12 | 5 | 5 | 3 | mock_now_heavier |

                Mock kill-switch digest:
                | Dimension | Mock kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the mock if it collapses capability, route tuple, or actor scope into a generic success flow. |
| Authoritative Truth Separation | Reject the mock if provider acceptance or webhook arrival is treated as authoritative truth. |
| Ambiguity And Partial Failure Semantics | Reject the mock if contradictory or weak evidence collapses into silent retry or silent success. |
| Security, Authentication, And Replay Control | Reject the mock if it permits direct browser calls, token reuse, or unverified callbacks. |
| Privacy, Residency, And Subprocessor Transparency | Reject the mock if it encourages real credentials, real patient data, or uncontrolled retention. |
| UK Healthcare Compliance And Assurance Readiness | Reject the mock if it implies live approval or hides later assurance obligations. |
| Onboarding Friction And Sponsor Burden | Reject the mock if it pretends onboarding does not matter or hides later human approvals. |
| Sandbox Depth And Environment Isolation | Reject the mock if the sandbox misses states that drive patient-visible truth, safety, or control-plane decisions. |
| Test Data And Synthetic Fixture Quality | Reject the mock if fixture data cannot reproduce the states that later drive calmness, closure, or recovery. |
| Observability, Audit, And Replay Support | Reject the mock if it removes the audit or replay evidence later diagnostics will rely on. |
| Operational Support And Incident Handling | Reject the mock if degraded paths exist with no clear recovery owner or operator action. |
| Cost Governance And Lock-In Control | Reject the mock if it bakes one vendor's commercial model into the product contract. |
| Portability And Adapter Exit Posture | Reject the mock if identifiers, proof objects, or UX copy become inseparable from one supplier model. |
| Resilience And Degraded-Mode Compatibility | Reject the mock if degraded or stale states are absent or if recovery posture diverges from the blueprint. |
| UI / Brand / Interaction Constraints | Reject the mock if it hides provider-driven interaction constraints that later affect UX truth. |
| Simulator Fidelity And State Coverage | Reject the mock if it omits states that later drive patient-visible truth, safety, or closure behavior. |

                Actual-provider kill-switch digest:
                | Dimension | Actual-provider kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the provider if Vecells would need supplier-specific business logic outside the published adapter contract. |
| Authoritative Truth Separation | Reject the provider if it cannot represent authoritative truth separately from accepted transport or local acknowledgement. |
| Ambiguity And Partial Failure Semantics | Reject the provider if failure semantics are opaque or if ambiguity cannot be surfaced for review. |
| Security, Authentication, And Replay Control | Reject the provider if replay protection, callback authenticity, or environment isolation are inadequate. |
| Privacy, Residency, And Subprocessor Transparency | Reject the provider if residency, subprocessor scope, or deletion posture are unclear or incompatible. |
| UK Healthcare Compliance And Assurance Readiness | Reject the provider if compliance posture is incompatible or cannot be evidenced for audit. |
| Onboarding Friction And Sponsor Burden | Reject the provider if critical approvals, sponsor paths, or account prerequisites are undefined. |
| Sandbox Depth And Environment Isolation | Reject the provider if its sandbox is too shallow to verify the required semantics before go-live. |
| Test Data And Synthetic Fixture Quality | Reject the provider if test data cannot reproduce the required control-plane and failure semantics. |
| Observability, Audit, And Replay Support | Reject the provider if audit, replay, or diagnostic support is too weak to prove control-plane behavior. |
| Operational Support And Incident Handling | Reject the provider if support or incident handling cannot sustain the required service posture. |
| Cost Governance And Lock-In Control | Reject the provider if lock-in or pricing posture would undermine later portability or roadmap freedom. |
| Portability And Adapter Exit Posture | Reject the provider if replacement would force core lifecycle logic to be rewritten. |
| Resilience And Degraded-Mode Compatibility | Reject the provider if outage or partial-failure behavior cannot support the declared degraded mode. |
| UI / Brand / Interaction Constraints | Reject the provider if required UX or branding constraints would force misleading or non-compliant flows. |
| Simulator Fidelity And State Coverage | Reject the provider if onboarding would break simulator parity or invalidate the approved contract tests. |

## Pharmacy Directory / Choice

                - provider family: `pharmacy_directory`
                - baseline role: `baseline_mock_required`
                - recommended lane from seq_021: `mock_now`
                - mapped seams: Pharmacy directory and patient-choice seam

                **Mock_now_execution**

                Build a contract-first simulator for pharmacy directory and patient-choice discovery that preserves the full state and proof model before named vendor work begins.

                **Actual_provider_strategy_later**

                Admit a live provider for pharmacy directory and patient-choice discovery only when the provider can satisfy the same truth, ambiguity, degraded-mode, and audit laws already proven in the simulator.

                | Dimension | Class | Mock weight | Mock bar | Actual weight | Actual bar | Lane delta |
| --- | --- | --- | --- | --- | --- | --- |
| Capability And Tuple Coverage | capability | 10 | 4 | 10 | 4 | shared_weight |
| Authoritative Truth Separation | proof_truth | 10 | 4 | 10 | 4 | shared_weight |
| Ambiguity And Partial Failure Semantics | ambiguity_handling | 11 | 5 | 11 | 5 | shared_weight |
| Security, Authentication, And Replay Control | security | 9 | 4 | 10 | 4 | actual_later_heavier |
| Privacy, Residency, And Subprocessor Transparency | privacy | 5 | 2 | 6 | 3 | actual_later_heavier |
| UK Healthcare Compliance And Assurance Readiness | compliance | 6 | 3 | 10 | 4 | actual_later_heavier |
| Onboarding Friction And Sponsor Burden | onboarding_friction | 4 | 2 | 9 | 3 | actual_later_heavier |
| Sandbox Depth And Environment Isolation | sandbox_quality | 11 | 5 | 8 | 4 | mock_now_heavier |
| Test Data And Synthetic Fixture Quality | test_data_quality | 10 | 4 | 8 | 4 | mock_now_heavier |
| Observability, Audit, And Replay Support | observability | 8 | 3 | 9 | 4 | actual_later_heavier |
| Operational Support And Incident Handling | operational_support | 6 | 3 | 8 | 4 | actual_later_heavier |
| Cost Governance And Lock-In Control | cost_governance | 3 | 2 | 6 | 3 | actual_later_heavier |
| Portability And Adapter Exit Posture | portability | 6 | 3 | 8 | 4 | actual_later_heavier |
| Resilience And Degraded-Mode Compatibility | resilience | 10 | 4 | 9 | 4 | mock_now_heavier |
| UI / Brand / Interaction Constraints | ui_brand_constraints | 3 | 3 | 4 | 3 | actual_later_heavier |
| Simulator Fidelity And State Coverage | mock_fidelity | 12 | 5 | 5 | 3 | mock_now_heavier |

                Mock kill-switch digest:
                | Dimension | Mock kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the mock if it collapses capability, route tuple, or actor scope into a generic success flow. |
| Authoritative Truth Separation | Reject the mock if provider acceptance or webhook arrival is treated as authoritative truth. |
| Ambiguity And Partial Failure Semantics | Reject the mock if contradictory or weak evidence collapses into silent retry or silent success. |
| Security, Authentication, And Replay Control | Reject the mock if it permits direct browser calls, token reuse, or unverified callbacks. |
| Privacy, Residency, And Subprocessor Transparency | Reject the mock if it encourages real credentials, real patient data, or uncontrolled retention. |
| UK Healthcare Compliance And Assurance Readiness | Reject the mock if it implies live approval or hides later assurance obligations. |
| Onboarding Friction And Sponsor Burden | Reject the mock if it pretends onboarding does not matter or hides later human approvals. |
| Sandbox Depth And Environment Isolation | Reject the mock if the sandbox misses states that drive patient-visible truth, safety, or control-plane decisions. |
| Test Data And Synthetic Fixture Quality | Reject the mock if fixture data cannot reproduce the states that later drive calmness, closure, or recovery. |
| Observability, Audit, And Replay Support | Reject the mock if it removes the audit or replay evidence later diagnostics will rely on. |
| Operational Support And Incident Handling | Reject the mock if degraded paths exist with no clear recovery owner or operator action. |
| Cost Governance And Lock-In Control | Reject the mock if it bakes one vendor's commercial model into the product contract. |
| Portability And Adapter Exit Posture | Reject the mock if identifiers, proof objects, or UX copy become inseparable from one supplier model. |
| Resilience And Degraded-Mode Compatibility | Reject the mock if degraded or stale states are absent or if recovery posture diverges from the blueprint. |
| UI / Brand / Interaction Constraints | Reject the mock if it hides provider-driven interaction constraints that later affect UX truth. |
| Simulator Fidelity And State Coverage | Reject the mock if it omits states that later drive patient-visible truth, safety, or closure behavior. |

                Actual-provider kill-switch digest:
                | Dimension | Actual-provider kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the provider if Vecells would need supplier-specific business logic outside the published adapter contract. |
| Authoritative Truth Separation | Reject the provider if it cannot represent authoritative truth separately from accepted transport or local acknowledgement. |
| Ambiguity And Partial Failure Semantics | Reject the provider if failure semantics are opaque or if ambiguity cannot be surfaced for review. |
| Security, Authentication, And Replay Control | Reject the provider if replay protection, callback authenticity, or environment isolation are inadequate. |
| Privacy, Residency, And Subprocessor Transparency | Reject the provider if residency, subprocessor scope, or deletion posture are unclear or incompatible. |
| UK Healthcare Compliance And Assurance Readiness | Reject the provider if compliance posture is incompatible or cannot be evidenced for audit. |
| Onboarding Friction And Sponsor Burden | Reject the provider if critical approvals, sponsor paths, or account prerequisites are undefined. |
| Sandbox Depth And Environment Isolation | Reject the provider if its sandbox is too shallow to verify the required semantics before go-live. |
| Test Data And Synthetic Fixture Quality | Reject the provider if test data cannot reproduce the required control-plane and failure semantics. |
| Observability, Audit, And Replay Support | Reject the provider if audit, replay, or diagnostic support is too weak to prove control-plane behavior. |
| Operational Support And Incident Handling | Reject the provider if support or incident handling cannot sustain the required service posture. |
| Cost Governance And Lock-In Control | Reject the provider if lock-in or pricing posture would undermine later portability or roadmap freedom. |
| Portability And Adapter Exit Posture | Reject the provider if replacement would force core lifecycle logic to be rewritten. |
| Resilience And Degraded-Mode Compatibility | Reject the provider if outage or partial-failure behavior cannot support the declared degraded mode. |
| UI / Brand / Interaction Constraints | Reject the provider if required UX or branding constraints would force misleading or non-compliant flows. |
| Simulator Fidelity And State Coverage | Reject the provider if onboarding would break simulator parity or invalidate the approved contract tests. |

## Pharmacy Dispatch / Transport

                - provider family: `pharmacy_dispatch_transport`
                - baseline role: `baseline_mock_required`
                - recommended lane from seq_021: `mock_now`
                - mapped seams: Pharmacy dispatch proof and urgent-return seam, Cross-organisation secure messaging and MESH seam

                **Mock_now_execution**

                Build a contract-first simulator for pharmacy referral dispatch and urgent-return transport that preserves the full state and proof model before named vendor work begins.

                **Actual_provider_strategy_later**

                Admit a live provider for pharmacy referral dispatch and urgent-return transport only when the provider can satisfy the same truth, ambiguity, degraded-mode, and audit laws already proven in the simulator.

                | Dimension | Class | Mock weight | Mock bar | Actual weight | Actual bar | Lane delta |
| --- | --- | --- | --- | --- | --- | --- |
| Capability And Tuple Coverage | capability | 10 | 4 | 11 | 4 | actual_later_heavier |
| Authoritative Truth Separation | proof_truth | 12 | 5 | 12 | 5 | shared_weight |
| Ambiguity And Partial Failure Semantics | ambiguity_handling | 11 | 5 | 11 | 5 | shared_weight |
| Security, Authentication, And Replay Control | security | 10 | 4 | 10 | 5 | shared_weight |
| Privacy, Residency, And Subprocessor Transparency | privacy | 7 | 3 | 9 | 4 | actual_later_heavier |
| UK Healthcare Compliance And Assurance Readiness | compliance | 8 | 4 | 10 | 5 | actual_later_heavier |
| Onboarding Friction And Sponsor Burden | onboarding_friction | 5 | 2 | 10 | 4 | actual_later_heavier |
| Sandbox Depth And Environment Isolation | sandbox_quality | 10 | 5 | 8 | 4 | mock_now_heavier |
| Test Data And Synthetic Fixture Quality | test_data_quality | 9 | 4 | 8 | 4 | mock_now_heavier |
| Observability, Audit, And Replay Support | observability | 10 | 4 | 11 | 5 | actual_later_heavier |
| Operational Support And Incident Handling | operational_support | 9 | 4 | 10 | 5 | actual_later_heavier |
| Cost Governance And Lock-In Control | cost_governance | 3 | 2 | 6 | 3 | actual_later_heavier |
| Portability And Adapter Exit Posture | portability | 6 | 3 | 8 | 4 | actual_later_heavier |
| Resilience And Degraded-Mode Compatibility | resilience | 11 | 5 | 11 | 5 | shared_weight |
| UI / Brand / Interaction Constraints | ui_brand_constraints | 1 | 2 | 2 | 2 | actual_later_heavier |
| Simulator Fidelity And State Coverage | mock_fidelity | 12 | 5 | 5 | 3 | mock_now_heavier |

                Mock kill-switch digest:
                | Dimension | Mock kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the mock if it collapses capability, route tuple, or actor scope into a generic success flow. |
| Authoritative Truth Separation | Reject the mock if provider acceptance or webhook arrival is treated as authoritative truth. |
| Ambiguity And Partial Failure Semantics | Reject the mock if contradictory or weak evidence collapses into silent retry or silent success. |
| Security, Authentication, And Replay Control | Reject the mock if it permits direct browser calls, token reuse, or unverified callbacks. |
| Privacy, Residency, And Subprocessor Transparency | Reject the mock if it encourages real credentials, real patient data, or uncontrolled retention. |
| UK Healthcare Compliance And Assurance Readiness | Reject the mock if it implies live approval or hides later assurance obligations. |
| Onboarding Friction And Sponsor Burden | Reject the mock if it pretends onboarding does not matter or hides later human approvals. |
| Sandbox Depth And Environment Isolation | Reject the mock if the sandbox misses states that drive patient-visible truth, safety, or control-plane decisions. |
| Test Data And Synthetic Fixture Quality | Reject the mock if fixture data cannot reproduce the states that later drive calmness, closure, or recovery. |
| Observability, Audit, And Replay Support | Reject the mock if it removes the audit or replay evidence later diagnostics will rely on. |
| Operational Support And Incident Handling | Reject the mock if degraded paths exist with no clear recovery owner or operator action. |
| Cost Governance And Lock-In Control | Reject the mock if it bakes one vendor's commercial model into the product contract. |
| Portability And Adapter Exit Posture | Reject the mock if identifiers, proof objects, or UX copy become inseparable from one supplier model. |
| Resilience And Degraded-Mode Compatibility | Reject the mock if degraded or stale states are absent or if recovery posture diverges from the blueprint. |
| UI / Brand / Interaction Constraints | Reject the mock if it hides provider-driven interaction constraints that later affect UX truth. |
| Simulator Fidelity And State Coverage | Reject the mock if it omits states that later drive patient-visible truth, safety, or closure behavior. |

                Actual-provider kill-switch digest:
                | Dimension | Actual-provider kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the provider if Vecells would need supplier-specific business logic outside the published adapter contract. |
| Authoritative Truth Separation | Reject the provider if it cannot represent authoritative truth separately from accepted transport or local acknowledgement. |
| Ambiguity And Partial Failure Semantics | Reject the provider if failure semantics are opaque or if ambiguity cannot be surfaced for review. |
| Security, Authentication, And Replay Control | Reject the provider if replay protection, callback authenticity, or environment isolation are inadequate. |
| Privacy, Residency, And Subprocessor Transparency | Reject the provider if residency, subprocessor scope, or deletion posture are unclear or incompatible. |
| UK Healthcare Compliance And Assurance Readiness | Reject the provider if compliance posture is incompatible or cannot be evidenced for audit. |
| Onboarding Friction And Sponsor Burden | Reject the provider if critical approvals, sponsor paths, or account prerequisites are undefined. |
| Sandbox Depth And Environment Isolation | Reject the provider if its sandbox is too shallow to verify the required semantics before go-live. |
| Test Data And Synthetic Fixture Quality | Reject the provider if test data cannot reproduce the required control-plane and failure semantics. |
| Observability, Audit, And Replay Support | Reject the provider if audit, replay, or diagnostic support is too weak to prove control-plane behavior. |
| Operational Support And Incident Handling | Reject the provider if support or incident handling cannot sustain the required service posture. |
| Cost Governance And Lock-In Control | Reject the provider if lock-in or pricing posture would undermine later portability or roadmap freedom. |
| Portability And Adapter Exit Posture | Reject the provider if replacement would force core lifecycle logic to be rewritten. |
| Resilience And Degraded-Mode Compatibility | Reject the provider if outage or partial-failure behavior cannot support the declared degraded mode. |
| UI / Brand / Interaction Constraints | Reject the provider if required UX or branding constraints would force misleading or non-compliant flows. |
| Simulator Fidelity And State Coverage | Reject the provider if onboarding would break simulator parity or invalidate the approved contract tests. |

## Pharmacy Outcome Observation

                - provider family: `pharmacy_outcome_observation`
                - baseline role: `baseline_mock_required`
                - recommended lane from seq_021: `mock_now`
                - mapped seams: Pharmacy outcome observation and reconciliation seam

                **Mock_now_execution**

                Build a contract-first simulator for pharmacy outcome observation and reconciliation that preserves the full state and proof model before named vendor work begins.

                **Actual_provider_strategy_later**

                Admit a live provider for pharmacy outcome observation and reconciliation only when the provider can satisfy the same truth, ambiguity, degraded-mode, and audit laws already proven in the simulator.

                | Dimension | Class | Mock weight | Mock bar | Actual weight | Actual bar | Lane delta |
| --- | --- | --- | --- | --- | --- | --- |
| Capability And Tuple Coverage | capability | 10 | 4 | 10 | 4 | shared_weight |
| Authoritative Truth Separation | proof_truth | 12 | 5 | 12 | 5 | shared_weight |
| Ambiguity And Partial Failure Semantics | ambiguity_handling | 11 | 5 | 11 | 5 | shared_weight |
| Security, Authentication, And Replay Control | security | 9 | 4 | 10 | 4 | actual_later_heavier |
| Privacy, Residency, And Subprocessor Transparency | privacy | 9 | 4 | 10 | 5 | actual_later_heavier |
| UK Healthcare Compliance And Assurance Readiness | compliance | 8 | 4 | 10 | 5 | actual_later_heavier |
| Onboarding Friction And Sponsor Burden | onboarding_friction | 5 | 2 | 10 | 4 | actual_later_heavier |
| Sandbox Depth And Environment Isolation | sandbox_quality | 11 | 5 | 8 | 4 | mock_now_heavier |
| Test Data And Synthetic Fixture Quality | test_data_quality | 10 | 4 | 8 | 4 | mock_now_heavier |
| Observability, Audit, And Replay Support | observability | 10 | 4 | 11 | 5 | actual_later_heavier |
| Operational Support And Incident Handling | operational_support | 9 | 4 | 10 | 5 | actual_later_heavier |
| Cost Governance And Lock-In Control | cost_governance | 3 | 2 | 6 | 3 | actual_later_heavier |
| Portability And Adapter Exit Posture | portability | 6 | 3 | 8 | 4 | actual_later_heavier |
| Resilience And Degraded-Mode Compatibility | resilience | 10 | 4 | 10 | 4 | shared_weight |
| UI / Brand / Interaction Constraints | ui_brand_constraints | 1 | 2 | 2 | 2 | actual_later_heavier |
| Simulator Fidelity And State Coverage | mock_fidelity | 12 | 5 | 5 | 3 | mock_now_heavier |

                Mock kill-switch digest:
                | Dimension | Mock kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the mock if it collapses capability, route tuple, or actor scope into a generic success flow. |
| Authoritative Truth Separation | Reject the mock if provider acceptance or webhook arrival is treated as authoritative truth. |
| Ambiguity And Partial Failure Semantics | Reject the mock if contradictory or weak evidence collapses into silent retry or silent success. |
| Security, Authentication, And Replay Control | Reject the mock if it permits direct browser calls, token reuse, or unverified callbacks. |
| Privacy, Residency, And Subprocessor Transparency | Reject the mock if it encourages real credentials, real patient data, or uncontrolled retention. |
| UK Healthcare Compliance And Assurance Readiness | Reject the mock if it implies live approval or hides later assurance obligations. |
| Onboarding Friction And Sponsor Burden | Reject the mock if it pretends onboarding does not matter or hides later human approvals. |
| Sandbox Depth And Environment Isolation | Reject the mock if the sandbox misses states that drive patient-visible truth, safety, or control-plane decisions. |
| Test Data And Synthetic Fixture Quality | Reject the mock if fixture data cannot reproduce the states that later drive calmness, closure, or recovery. |
| Observability, Audit, And Replay Support | Reject the mock if it removes the audit or replay evidence later diagnostics will rely on. |
| Operational Support And Incident Handling | Reject the mock if degraded paths exist with no clear recovery owner or operator action. |
| Cost Governance And Lock-In Control | Reject the mock if it bakes one vendor's commercial model into the product contract. |
| Portability And Adapter Exit Posture | Reject the mock if identifiers, proof objects, or UX copy become inseparable from one supplier model. |
| Resilience And Degraded-Mode Compatibility | Reject the mock if degraded or stale states are absent or if recovery posture diverges from the blueprint. |
| UI / Brand / Interaction Constraints | Reject the mock if it hides provider-driven interaction constraints that later affect UX truth. |
| Simulator Fidelity And State Coverage | Reject the mock if it omits states that later drive patient-visible truth, safety, or closure behavior. |

                Actual-provider kill-switch digest:
                | Dimension | Actual-provider kill-switch |
| --- | --- |
| Capability And Tuple Coverage | Reject the provider if Vecells would need supplier-specific business logic outside the published adapter contract. |
| Authoritative Truth Separation | Reject the provider if it cannot represent authoritative truth separately from accepted transport or local acknowledgement. |
| Ambiguity And Partial Failure Semantics | Reject the provider if failure semantics are opaque or if ambiguity cannot be surfaced for review. |
| Security, Authentication, And Replay Control | Reject the provider if replay protection, callback authenticity, or environment isolation are inadequate. |
| Privacy, Residency, And Subprocessor Transparency | Reject the provider if residency, subprocessor scope, or deletion posture are unclear or incompatible. |
| UK Healthcare Compliance And Assurance Readiness | Reject the provider if compliance posture is incompatible or cannot be evidenced for audit. |
| Onboarding Friction And Sponsor Burden | Reject the provider if critical approvals, sponsor paths, or account prerequisites are undefined. |
| Sandbox Depth And Environment Isolation | Reject the provider if its sandbox is too shallow to verify the required semantics before go-live. |
| Test Data And Synthetic Fixture Quality | Reject the provider if test data cannot reproduce the required control-plane and failure semantics. |
| Observability, Audit, And Replay Support | Reject the provider if audit, replay, or diagnostic support is too weak to prove control-plane behavior. |
| Operational Support And Incident Handling | Reject the provider if support or incident handling cannot sustain the required service posture. |
| Cost Governance And Lock-In Control | Reject the provider if lock-in or pricing posture would undermine later portability or roadmap freedom. |
| Portability And Adapter Exit Posture | Reject the provider if replacement would force core lifecycle logic to be rewritten. |
| Resilience And Degraded-Mode Compatibility | Reject the provider if outage or partial-failure behavior cannot support the declared degraded mode. |
| UI / Brand / Interaction Constraints | Reject the provider if required UX or branding constraints would force misleading or non-compliant flows. |
| Simulator Fidelity And State Coverage | Reject the provider if onboarding would break simulator parity or invalidate the approved contract tests. |
