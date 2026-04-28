# 346 External Reference Notes

Task: `par_346_phase6_track_backend_build_pharmacy_case_state_machine_and_lineage_linkage`

Date reviewed: `2026-04-23`

The local blueprint and frozen `342` contracts remained authoritative. The sources below were used only to sharpen the executable safety, audit, identifier, and idempotency posture.

## Borrowed

1. NHS England, [Digital clinical safety assurance](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/)
   - Reviewed because the kernel needed an explicit safety posture for stale actions and unsafe closure.
   - Borrowed the framing that digital clinical safety assurance is clinical risk management and that health IT used by care professionals must meet the national standards.
   - Applied that by failing closed on stale lease, stale epoch, stale fence, identity-repair freeze, and close attempts with unresolved blocker debt.
   - Current page metadata observed during implementation: published `2023-07-28`, last updated `2025-03-04`.

2. NHS England Digital, [Applicability of DCB 0129 and DCB 0160: Step by step guidance](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance)
   - Reviewed to confirm that real-time and near-real-time direct-care workflow software remains in the clinical-safety scope and should be managed as a governed risk surface.
   - Borrowed the deployment/manufacture distinction only as a support check for why the kernel records authoritative stale-owner recovery and close-blocker evidence instead of treating those as optional operational metadata.

3. NHS England Digital, [Clinical safety](https://digital.nhs.uk/developer/guides-and-documentation/introduction-to-healthcare-technology/clinical-safety)
   - Borrowed the requirement to identify hazards, provide mitigations, nominate a clinical-safety owner, and declare DCB0129 compliance during onboarding.
   - Applied that by preserving explicit rejected audit rows and recovery records for unsafe stale writes rather than relying on silent retries.

4. HL7 FHIR R4, [Provenance](https://hl7.org/fhir/R4/provenance-definitions.html)
   - Borrowed the distinction that provenance should capture activity, participating agents, and the entities used in an activity.
   - Applied that by keeping transition and event journals append-only and by recording actor, command references, dependent refs, and digests for every authoritative mutation.

5. HL7 FHIR R4, [AuditEvent](https://www.hl7.org/fhir/R4/auditevent.html)
   - Borrowed the distinction that an audit event is an event record kept for security purposes and should record action, outcome, recorded time, and agents.
   - Applied that by storing transition outcome, failure code, recorded timestamp, actor, and command identifiers on every applied or rejected mutation.

6. Stripe, [Idempotent requests](https://docs.stripe.com/api/idempotent_requests?lang=curl)
   - Borrowed the operational guidance that an idempotency key should return the first persisted result for repeated retries and should avoid embedding sensitive data.
   - Applied that by deriving replay keys from stable digests over governance tuples instead of storing raw patient identifiers in replay keys.

7. AWS Step Functions, [Learn about state machines in Step Functions](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-statemachines.html)
   - Borrowed only the structured state-machine discipline: named states, explicit transitions, and event-driven flow.
   - Applied that by centralising the pharmacy status graph in one transition index instead of letting controllers or workers define ad hoc state jumps.

## Explicitly rejected

1. Replacing the local blueprint with external workflow-engine semantics
   - Rejected because the repo’s Phase 0 lifecycle, lineage, lease, and closure law is stricter than a generic workflow engine.

2. Treating FHIR `AuditEvent` or `Provenance` as the internal control-plane persistence model
   - Rejected because the blueprint already defines canonical internal control objects such as `RequestLifecycleLease`, `LineageFence`, `ScopedMutationGate`, and `StaleOwnershipRecoveryRecord`.

3. Treating HTTP method idempotency alone as sufficient
   - Rejected because the pharmacy kernel uses POST-like command semantics, so idempotency must be enforced by domain replay keys over business tuples rather than by transport semantics alone.

4. Allowing stale-owner retries to overwrite state if the business payload matches
   - Rejected because the NHS clinical-safety framing and the local Phase 0 laws both require explicit stale-owner recovery and visible failure posture instead of silent acceptance.
