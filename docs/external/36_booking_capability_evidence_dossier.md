# 36 Booking Capability Evidence Dossier

The dossier exists so that the provider-path discussion stays bound to named proof objects and not to supplier folklore or route-local optimism.

## Capability dimensions

| Dimension | Why separate |
| --- | --- |
| Patient booking search | Patient search cannot be inferred from staff or API capability claims. |
| Staff-assisted search | Staff-assisted routes may widen actionability without unlocking patient self-service. |
| Slot freshness proof | Showing a slot and proving it remained valid at commit time are different facts. |
| Hold or soft-hold support | Exclusive hold, truthful non-exclusive hold, and no hold are different patient promises. |
| Authoritative commit proof | Accepted, queued, and confirmed outcomes must not collapse into one state. |
| Cancellation support | Cancel may exist even when reschedule or detail update do not. |
| Reschedule support | Reschedule requires stronger tuple and revalidation guarantees than basic cancel. |
| Reminder or detail update support | Reminder readiness flows from confirmed booking truth and manage capability, not from search support. |
| Waitlist continuation compatibility | Local waitlist continuation must stay core-owned even when supplier search or commit differs. |
| Practice-visibility evidence | The practice or origin service may need a separate acknowledgement trail from patient confirmation. |
| Ambiguity mode | Async acceptance, disputed callbacks, and partial evidence must stay visibly pending. |
| Degraded fallback mode | Fallback must be explicit and same-shell, not a hidden operational assumption. |
| Exact proof object required before reassurance | The UI must bind to a named object chain, not generic success language. |

## Canonical proof objects

| Object | Role |
| --- | --- |
| ProviderCapabilityMatrix | Static capability source row for the exact supplier, audience, route, and deployment context. |
| BookingProviderAdapterBinding | The only legal translation and proof contract for search, revalidation, reservation, commit, and manage support. |
| BookingCapabilityResolution | The audience-specific actionability decision for the current tuple and binding hash. |
| ReservationTruthProjection | Truth for exclusive hold, truthful non-exclusive posture, or released state before commit. |
| ExternalConfirmationGate | Mandatory external truth gate whenever supplier confirmation is weak, async, manual, or disputed. |
| AppointmentRecord | Durable booking record only after authoritative success under the active binding. |
| BookingConfirmationTruthProjection | The sole audience-safe authority for booked reassurance and writable manage posture. |
| PracticeAcknowledgementRecord | The practice-visibility proof object when origin services need explicit acknowledgement beyond patient confirmation. |

## Proof ladders

| Proof class | Applies to | Steps | UI rule |
| --- | --- | --- | --- |
| IM1 authoritative commit or read-after-write proof | im1_pairing_optum_emisweb; im1_pairing_tpp_systmone | 1. Resolve one current ProviderCapabilityMatrix row and one current BookingProviderAdapterBinding for the exact tuple.<br>2. Persist BookingCapabilityResolution and revalidate slot freshness against the same tuple and policy envelope.<br>3. Observe durable provider reference or same-commit read-after-write under the active binding.<br>4. Create AppointmentRecord on the same BookingTransaction lineage.<br>5. Refresh BookingConfirmationTruthProjection to confirmed before any booked reassurance or writable manage posture. | Booked summary appears only after step 5. |
| Watch-only consumer estate proof | gp_connect_appointment_management_watch_only | 1. Treat the route as an external watch lane, not a current executable baseline.<br>2. Require estate-specific supplier evidence before any capability claim is promoted.<br>3. If adopted later, normalize every success or pending state into the same canonical truth objects as IM1. | No current patient reassurance is allowed from this lane. |
| BaRS inter-provider proof boundary | bars_watch_only | 1. Keep BaRS classified as a broader referral interoperability rail.<br>2. Require a future bounded use-case decision before any appointment-control claim is made.<br>3. If a later booking use case emerges, bind it through the same canonical proof objects and ExternalConfirmationGate rules. | BaRS does not currently unlock principal-GP booked reassurance. |
| Simulator proof ladder | local_adapter_simulator_required | 1. Compile the current BookingProviderAdapterBinding and BookingCapabilityResolution under deterministic fixtures.<br>2. Simulate slot search, revalidation, exclusive or truthful reservation semantics, and commit attempts.<br>3. Simulate both authoritative success and ambiguous or disputed outcomes under ExternalConfirmationGate.<br>4. Materialize AppointmentRecord and confirmed BookingConfirmationTruthProjection only in the success branch. | The simulator may render every state, but it must obey the same proof law as live paths. |
| Manual handoff acknowledgement ladder | manual_practice_handoff_only | 1. Create manual follow-up or callback obligation instead of pretending slot or hold truth exists.<br>2. Capture explicit practice acknowledgement or fallback transfer evidence.<br>3. Keep ExternalConfirmationGate open until manual confirmation settles or recovery wins.<br>4. Refresh BookingConfirmationTruthProjection only after the manual outcome becomes canonical truth. | Manual contact never implies immediate booked calmness. |

## Path-specific exact proof requirements

| Path | Exact proof object required | Patient search | Staff search | Ambiguity mode |
| --- | --- | --- | --- | --- |
| IM1 Pairing / Optum (EMISWeb) | BookingConfirmationTruthProjection.confirmed plus AppointmentRecord on the same transaction, backed by the current BookingProviderAdapterBinding and BookingCapabilityResolution. | conditional_after_pairing | conditional_after_pairing | confirmation_pending or supplier_reconciliation_pending under ExternalConfirmationGate. |
| IM1 Pairing / TPP (SystmOne) | BookingConfirmationTruthProjection.confirmed plus AppointmentRecord on the same transaction, backed by the current BookingProviderAdapterBinding and BookingCapabilityResolution. | conditional_after_pairing | conditional_after_pairing | confirmation_pending or supplier_reconciliation_pending under ExternalConfirmationGate. |
| GP Connect Appointment Management / Watch only | Same BookingConfirmationTruthProjection and AppointmentRecord chain as IM1; GP Connect does not bypass that. | not_baseline_for_vecells | existing_estate_only | If ever adopted, must still normalize into ExternalConfirmationGate rather than consumer-local acceptance. |
| BaRS / Watch only | If ever used for booking confirmation, the same BookingConfirmationTruthProjection chain still applies. | out_of_scope_for_baseline_principal_gp_booking | possible_in_referral_contexts_only | Treat as external_confirmation_gate_required if any partial or transport-only evidence exists. |
| Local adapter simulator / Required | Same canonical proof chain as live: BookingProviderAdapterBinding, BookingCapabilityResolution, ExternalConfirmationGate when needed, AppointmentRecord, and BookingConfirmationTruthProjection. | supported_in_mock | supported_in_mock | confirmation_pending, reconciliation_required, and stale-binding states all required. |
| Manual practice handoff / Only | ExternalConfirmationGate satisfied plus current BookingConfirmationTruthProjection for the same lineage. | not_supported | manual_only | Always gated until explicit manual confirmation arrives and clears ExternalConfirmationGate. |
