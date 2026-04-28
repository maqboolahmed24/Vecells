# 31 Mock Provider Lane For Communications

The mock-now lane is selected first and remains the only executable combined provider lane in the current baseline:

- selected combined lane: `vecells_signal_fabric`
- telephony twin: `vecells_signal_twin_voice`
- sms twin: `vecells_signal_twin_sms`
- email twin: `vecells_signal_twin_email`
- shared webhook model: HMAC-signed fixtures plus deterministic event IDs and adapter-owned replay caches
- evidence rule: transport acceptance, callback arrival, and authoritative outcome remain separate states

The mock lane is product-grade only if it preserves:

- telephony call lifecycle, IVR/DTMF, urgent-live preemption, recording-present vs recording-absent, transcript-ready vs transcript-degraded
- SMS continuation, wrong-recipient risk, delayed/bounced/expired deliveries, and callback repair
- email accepted/delivered/delayed/bounced/complained/disputed flows with controlled resend under one authoritative chain
- route repair, callback fallback, degraded guidance, and replay-safe callback ingestion across all families

## Telephony / IVR
Selected mock-now telephony twin. Must preserve call session lifecycle, IVR, recording presence vs absence, transcript readiness, urgent-live preemption, webhook retries, and continuation handoff.

| Dimension | Rating |
| --- | --- |
| Capability And Tuple Coverage | 5 |
| Authoritative Truth Separation | 5 |
| Ambiguity And Partial Failure Semantics | 5 |
| Security, Authentication, And Replay Control | 5 |
| Privacy, Residency, And Subprocessor Transparency | 5 |
| UK Healthcare Compliance And Assurance Readiness | 4 |
| Onboarding Friction And Sponsor Burden | 5 |
| Sandbox Depth And Environment Isolation | 5 |
| Test Data And Synthetic Fixture Quality | 5 |
| Observability, Audit, And Replay Support | 5 |
| Operational Support And Incident Handling | 4 |
| Cost Governance And Lock-In Control | 5 |
| Portability And Adapter Exit Posture | 5 |
| Resilience And Degraded-Mode Compatibility | 5 |
| UI / Brand / Interaction Constraints | 5 |
| Simulator Fidelity And State Coverage | 5 |

## SMS
Selected mock-now SMS rail. Must preserve accepted vs delayed vs bounced vs expired delivery, wrong-recipient risk, replay-safe callbacks, and non-authoritative transport acceptance.

| Dimension | Rating |
| --- | --- |
| Capability And Tuple Coverage | 5 |
| Authoritative Truth Separation | 5 |
| Ambiguity And Partial Failure Semantics | 5 |
| Security, Authentication, And Replay Control | 5 |
| Privacy, Residency, And Subprocessor Transparency | 5 |
| UK Healthcare Compliance And Assurance Readiness | 4 |
| Onboarding Friction And Sponsor Burden | 5 |
| Sandbox Depth And Environment Isolation | 5 |
| Test Data And Synthetic Fixture Quality | 5 |
| Observability, Audit, And Replay Support | 5 |
| Operational Support And Incident Handling | 4 |
| Cost Governance And Lock-In Control | 5 |
| Portability And Adapter Exit Posture | 5 |
| Resilience And Degraded-Mode Compatibility | 5 |
| UI / Brand / Interaction Constraints | 5 |
| Simulator Fidelity And State Coverage | 5 |

## Email
Selected mock-now email rail. Must preserve accepted vs delivered vs delayed vs bounced vs complained vs disputed outcomes and controlled resend under the same authoritative chain.

| Dimension | Rating |
| --- | --- |
| Capability And Tuple Coverage | 5 |
| Authoritative Truth Separation | 5 |
| Ambiguity And Partial Failure Semantics | 5 |
| Security, Authentication, And Replay Control | 5 |
| Privacy, Residency, And Subprocessor Transparency | 5 |
| UK Healthcare Compliance And Assurance Readiness | 4 |
| Onboarding Friction And Sponsor Burden | 5 |
| Sandbox Depth And Environment Isolation | 5 |
| Test Data And Synthetic Fixture Quality | 5 |
| Observability, Audit, And Replay Support | 5 |
| Operational Support And Incident Handling | 4 |
| Cost Governance And Lock-In Control | 5 |
| Portability And Adapter Exit Posture | 5 |
| Resilience And Degraded-Mode Compatibility | 5 |
| UI / Brand / Interaction Constraints | 5 |
| Simulator Fidelity And State Coverage | 5 |
