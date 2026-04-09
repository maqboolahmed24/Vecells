
            # 22 Provider Score Weight Rationale

            The two-lane model deliberately uses different weights.

            `Mock_now_execution` is heavier on:
            - sandbox depth
            - simulator fidelity
            - test-data coverage
            - proof-truth semantics before external onboarding exists

            `Actual_provider_strategy_later` is heavier on:
            - onboarding friction and sponsor burden
            - compliance and evidence readiness
            - operational support and observability
            - portability, exit posture, and residency transparency

            Invariant dimensions:
            - proof truth
            - ambiguity handling
            - degraded-mode resilience
            - contract-shape law

            Family lane deltas:
            | Family | Mock-now heavier | Actual-later heavier | Shared-weight anchors |
| --- | --- | --- | --- |
| identity_auth | Sandbox Depth And Environment Isolation, Test Data And Synthetic Fixture Quality, Simulator Fidelity And State Coverage | Privacy, Residency, And Subprocessor Transparency, UK Healthcare Compliance And Assurance Readiness, Onboarding Friction And Sponsor Burden, Operational Support And Incident Handling, Cost Governance And Lock-In Control | Capability And Tuple Coverage, Authoritative Truth Separation, Ambiguity And Partial Failure Semantics, Security, Authentication, And Replay Control |
| telephony_voice_and_recording | Capability And Tuple Coverage, Sandbox Depth And Environment Isolation, Test Data And Synthetic Fixture Quality, Simulator Fidelity And State Coverage | Security, Authentication, And Replay Control, Privacy, Residency, And Subprocessor Transparency, UK Healthcare Compliance And Assurance Readiness, Onboarding Friction And Sponsor Burden, Cost Governance And Lock-In Control | Authoritative Truth Separation, Ambiguity And Partial Failure Semantics, Observability, Audit, And Replay Support, Operational Support And Incident Handling |
| notifications_sms | Ambiguity And Partial Failure Semantics, Sandbox Depth And Environment Isolation, Test Data And Synthetic Fixture Quality, Simulator Fidelity And State Coverage | Security, Authentication, And Replay Control, Privacy, Residency, And Subprocessor Transparency, UK Healthcare Compliance And Assurance Readiness, Onboarding Friction And Sponsor Burden, Observability, Audit, And Replay Support | Capability And Tuple Coverage, Authoritative Truth Separation, UI / Brand / Interaction Constraints |
| notifications_email | Ambiguity And Partial Failure Semantics, Sandbox Depth And Environment Isolation, Test Data And Synthetic Fixture Quality, UI / Brand / Interaction Constraints, Simulator Fidelity And State Coverage | Security, Authentication, And Replay Control, Privacy, Residency, And Subprocessor Transparency, UK Healthcare Compliance And Assurance Readiness, Onboarding Friction And Sponsor Burden, Observability, Audit, And Replay Support | Capability And Tuple Coverage, Authoritative Truth Separation |
| gp_im1_and_booking_supplier | Sandbox Depth And Environment Isolation, Test Data And Synthetic Fixture Quality, Simulator Fidelity And State Coverage | Security, Authentication, And Replay Control, Privacy, Residency, And Subprocessor Transparency, UK Healthcare Compliance And Assurance Readiness, Onboarding Friction And Sponsor Burden, Observability, Audit, And Replay Support | Capability And Tuple Coverage, Authoritative Truth Separation, Ambiguity And Partial Failure Semantics, Resilience And Degraded-Mode Compatibility |
| pharmacy_directory | Sandbox Depth And Environment Isolation, Test Data And Synthetic Fixture Quality, Resilience And Degraded-Mode Compatibility, Simulator Fidelity And State Coverage | Security, Authentication, And Replay Control, Privacy, Residency, And Subprocessor Transparency, UK Healthcare Compliance And Assurance Readiness, Onboarding Friction And Sponsor Burden, Observability, Audit, And Replay Support | Capability And Tuple Coverage, Authoritative Truth Separation, Ambiguity And Partial Failure Semantics |
| pharmacy_dispatch_transport | Sandbox Depth And Environment Isolation, Test Data And Synthetic Fixture Quality, Simulator Fidelity And State Coverage | Capability And Tuple Coverage, Privacy, Residency, And Subprocessor Transparency, UK Healthcare Compliance And Assurance Readiness, Onboarding Friction And Sponsor Burden, Observability, Audit, And Replay Support | Authoritative Truth Separation, Ambiguity And Partial Failure Semantics, Security, Authentication, And Replay Control, Resilience And Degraded-Mode Compatibility |
| pharmacy_outcome_observation | Sandbox Depth And Environment Isolation, Test Data And Synthetic Fixture Quality, Simulator Fidelity And State Coverage | Security, Authentication, And Replay Control, Privacy, Residency, And Subprocessor Transparency, UK Healthcare Compliance And Assurance Readiness, Onboarding Friction And Sponsor Burden, Observability, Audit, And Replay Support | Capability And Tuple Coverage, Authoritative Truth Separation, Ambiguity And Partial Failure Semantics, Resilience And Degraded-Mode Compatibility |

            Assumptions:
            - ASSUMPTION_022_SCORE_SCALE_0_TO_5: future provider evaluations will score every dimension on the shared 0-5 scale defined in this pack.
- ASSUMPTION_022_NO_NAMED_VENDOR_SELECTION: no named vendor research, shortlist, or procurement preference is admissible before this scorecard system is applied.
- ASSUMPTION_022_PDS_OPTIONAL: optional PDS enrichment remains outside the scored provider families and may not silently become baseline identity authority.
