# 69 Contact Route And Reachability Design

        `par_069` installs one canonical contact-route and reachability authority layer for callback, messaging, booking, hub, and pharmacy flows.

        ## Core law

        - `ContactRouteSnapshot` is the frozen route version. No mutable profile row or last-known demographic copy may replace it.
        - `ReachabilityObservation` records signal only. Transport acceptance, queue success, or provider ack remain weak evidence until a later assessment says otherwise.
        - `ReachabilityAssessmentRecord` is the sole object allowed to convert snapshot plus observations into current route authority, delivery risk, and repair posture.
        - `ReachabilityDependency` upgrades contact drift into a patient or operator blocker with action-scope impact, deadline, and same-shell return context.
        - `ContactRouteRepairJourney` keeps repair inside the same shell and preserves anchor plus return context.
        - `ContactRouteVerificationCheckpoint` is the only gate allowed to reopen blocked actions after a new route snapshot is captured and a clear resulting assessment lands.

        ## Generated baseline

        - snapshots: `10`
        - dependencies: `6`
        - assessments: `8`
        - observations: `10`
        - repair journeys: `3`
        - checkpoints: `3`

        ## Source trace

        - `prompt/069.md`
- `prompt/shared_operating_contract_066_to_075.md`
- `prompt/AGENT.md`
- `prompt/checklist.md`
- `blueprint/phase-0-the-foundation-protocol.md#1.8D ContactRouteSnapshot`
- `blueprint/phase-0-the-foundation-protocol.md#1.8E ReachabilityObservation`
- `blueprint/phase-0-the-foundation-protocol.md#1.8F ReachabilityAssessmentRecord`
- `blueprint/phase-0-the-foundation-protocol.md#1.9 ReachabilityDependency`
- `blueprint/phase-0-the-foundation-protocol.md#1.9A ContactRouteRepairJourney`
- `blueprint/phase-0-the-foundation-protocol.md#1.9B ContactRouteVerificationCheckpoint`
- `blueprint/phase-0-the-foundation-protocol.md#7. Universal safety-preemption and reachability-risk algorithm`
- `blueprint/patient-account-and-communications-blueprint.md#Recovery and identity-hold contract`
- `blueprint/callback-and-clinician-messaging-loop.md#Callback domain`
- `blueprint/phase-5-the-network-horizon.md#NetworkReminderPlan`
- `blueprint/phase-6-the-pharmacy-loop.md#This sub-phase makes the loop understandable to the patient.`
- `blueprint/forensic-audit-findings.md#Finding 66 - The event catalogue lacked reachability failure and repair events`
- `blueprint/forensic-audit-findings.md#Finding 89 - Reachability, delivery, and consent blockers remained operational facts rather than dominant patient actions`
- `packages/domains/identity_access/src/reachability-backbone.ts`
- `services/command-api/src/identity-access.ts`
