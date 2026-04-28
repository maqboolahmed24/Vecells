# 324 Network Reminders Manage And Practice Visibility Backend

`par_324` freezes the backend truth chain for booked network appointments after commit and before the later UI work mounts on it.

## Runtime objects

- `NetworkReminderPlan` is the durable reminder aggregate for one current hub appointment lineage. It carries route trust, reachability, artifact, recovery, and timeline-binding refs in the same object instead of reducing reminder truth to a transport queue row.
- `NetworkManageCapabilities` is the leased patient-manage authority for the current appointment version. It binds supplier truth, policy tuple, visibility envelope, session fence, subject fence, and continuity evidence.
- `HubManageSettlement` is the one same-shell outcome for cancel, reschedule, callback-request, or details-update mutations. It keeps recovery posture, blocker refs, surface refs, and release recovery refs in the shell lineage.
- `PracticeVisibilityProjection` is the minimum-necessary origin-practice projection. It is generated only under one current visibility envelope, one acting scope tuple, one policy evaluation, and one acknowledgement generation.
- `PracticeVisibilityDeltaRecord` remains the monotone delta ledger introduced by `322`; `324` makes reminder failure and manage settlement first-class delta producers instead of passive side effects.

## Execution order

1. Authoritative hub confirmation exists in `HubAppointmentRecord` and `HubOfferToConfirmationTruthProjection`.
2. `createOrRefreshReminderPlan(...)` evaluates confirmation truth, route trust, reachability, and continuity before a booked reminder becomes schedulable.
3. `compileNetworkManageCapabilities(...)` compiles a short-lived manage lease from live truth. If acknowledgement debt, supplier drift, stale subject binding, stale publication, release freeze, or route repair exists, the lease degrades to `blocked`, `stale`, or `expired`.
4. `executeHubManageAction(...)` returns exactly one `HubManageSettlement` and degrades the prior lease to `post_mutation_refresh_required` when the mutation is materially accepted.
5. `refreshPracticeVisibilityProjection(...)` re-materialises the origin-practice view under the current cross-org envelope and current policy evaluation.
6. Reminder failure and accepted manage mutations reopen practice acknowledgement debt through the `322` continuity service and append a new `PracticeVisibilityDeltaRecord`.

## Reminder law

- Ordinary booked reminders are legal only when hub confirmation is authoritative for the active appointment lineage.
- Reminder scheduling binds the current route snapshot, route version, reachability assessment, repair journey, template version, route profile, outbound navigation grant policy, appointment version, and truth tuple hash.
- Reminder transport acceptance is not delivery truth. Delivery evidence is stored separately and can move the plan into `delivery_blocked`, `disputed`, `suppressed`, or `recovery_required`.
- Reminder publication is unified through `ReminderTimelinePublication` using the same `threadId`, `conversationSubthreadRef`, and `communicationEnvelopeRef` that later patient timeline work will render.

## Manage law

- Manage posture is never a cached button set. It is a leased authority compiled from the live appointment version and live consistency envelope.
- A live lease requires authoritative confirmation, trusted continuity evidence, current route trust, no acknowledgement debt, no identity hold, no supplier drift freeze, and no stale subject or publication fences.
- `cancel` and `details_update` settle as `applied` when they remain inside the supported non-clinical shell. `reschedule` and `callback_request` settle as `provider_pending` until downstream provider-side completion exists.
- Clinically meaningful re-entry is still blocked from the manage layer; rich symptom or clinical text content must route back through the governed request shell.

## Practice visibility law

- Patient confirmation, practice informed, and practice acknowledged remain separate truths.
- `PracticeVisibilityProjection` is generated from the current visibility envelope and minimum-necessary audience projection, not from stitched local appointment fields.
- Projection refresh is monotone with respect to acknowledgement generation and visibility envelope version.
- Reminder failure, supplier drift, callback fallback, cancellation, reschedule, and other material changes reopen or refresh acknowledgement debt instead of silently mutating practice posture in place.

## Intentional seam

The repo does not yet have the final patient conversation timeline publisher owned by `330`. `324` therefore publishes deterministic `ReminderTimelinePublication` rows through a strict adapter seam and records the remaining integration note in `PHASE5_BATCH_324_331_INTERFACE_GAP_MANAGE_VISIBILITY_TIMELINE_PUBLICATION.json`.
