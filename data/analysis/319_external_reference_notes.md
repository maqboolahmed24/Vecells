# 319 External Reference Notes

Task: `par_319_phase5_track_backend_build_coordination_queue_ranking_workbench_projections_and_sla_timer_engine`

Checked on 23 April 2026.

## Borrowed

1. [NHS England: Digital clinical safety assurance](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/)
   - page version `1.2`, dated `03 March 2025`, last updated `4 March 2025`
   - borrowed the operational expectation that digital clinical safety assurance is a clinical risk management activity and that DCB0129/DCB0160 documentation, hazard review, and CSO ownership are first-class controls
   - applied to 319 as: typed escalation posture, fail-closed queue convergence, and explicit timer and banner evidence rather than quiet browser inference

2. [NHS Digital / NHS England Digital: Step by step guidance for DCB 0129 and DCB 0160](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance)
   - page last edited `4 August 2022`
   - borrowed the applicability framing for publicly funded, real-time or near-real-time direct-care products
   - applied to 319 as: the hub queue is treated as direct-care workflow logic, so ranking and escalation evidence has to be replayable and clinically governed, not an operational convenience layer

3. [NHS England: Digital clinical safety strategy](https://www.england.nhs.uk/long-read/digital-clinical-safety-strategy/)
   - page last updated `31 March 2026`
   - borrowed the emphasis on transparent escalation of safety risk, workforce capability, and clear access to safety documentation
   - applied to 319 as: queue breach explanations, banner types, and consistency-freeze states are persisted as explicit facts that later UI and assurance layers can inspect

## Rejected

1. Playwright trace guidance
   - not used for this task because 319 does not expose an interactive diagnostic harness; the proof surface is backend-first and validator-driven

2. Non-official queueing or scheduling literature
   - not required because the local blueprint already declares the risk model, fairness sequencing, and timer semantics

## Notes

- The local blueprint remained authoritative whenever it was more specific than the NHS guidance.
- External guidance informed posture and assurance discipline, not the queue formula itself.
