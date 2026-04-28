# 291 External Reference Notes

Accessed on 2026-04-19.

## Borrowed

- [How NHS login works](https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works)
  - Borrowed: NHS login still treats GP System Integration (IM1) linkage credentials as part of an authenticated GP-integrated journey, not as a one-off linkage-key retrieval tool.
  - Borrowed: NHS login also states that partner services own session management and logout, which supports keeping workspace fences, review leases, and focus leases application-owned in this repository.

- [GP practice NHS login guidance](https://digital.nhs.uk/services/nhs-login/nhs-login-for-health-and-care/gp-practice-nhs-login-guidance)
  - Borrowed: GP practices may need to issue or reissue GP Online registration details when patient identity checks fail, when linkage details expire, when patients move practice, or when supplier posture changes.
  - Borrowed: That supports surfacing `linkage_required_blocker` as an explicit assisted-path queue condition rather than pretending the same self-service route is still usable.

- [NHS login session management](https://nhsconnect.github.io/nhslogin/session-management/)
  - Borrowed: Session expiry and reauthentication remain the relying party’s responsibility.
  - Borrowed: The repository’s stricter `ReviewActionLease`, request lease, and focus-protection tuple are therefore valid application-level controls, not redundant copies of NHS login behavior.

- [Using NHS login to create or retrieve GP credentials](https://nhsconnect.github.io/nhslogin/gp-credentials/)
  - Borrowed: IM1-enabled services may retrieve account id, ODS code, and linkage key only as part of GP-integrated authentication.
  - Borrowed: That reinforces the modeled distinction between lawful linkage-required recovery and unlawful silent capability widening.

- [GP Connect: Appointment Management - FHIR API](https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir)
  - Borrowed: GP Connect Appointment Management is still a staff-facing or clinician-facing appointment-management API for booking on behalf of a patient, not a patient-facing API.
  - Borrowed: That aligns with this task’s decision to widen actionability only through lawful staff capability resolution over the same booking core.

- [Appointment Management](https://developer.nhs.uk/apis/gpconnect/appointments.html)
  - Borrowed: Administrative and clinical end users can book, view, amend, or cancel appointments on behalf of the patient.
  - Borrowed: Patient-app deployment is out of scope in the specification text, which supports the local rule that staff-assisted flows must not invent separate patient semantics.

- [GP Connect Appointment Checker](https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/appointment-management-troubleshooting-guide/appointment-checker)
  - Borrowed: Slots may appear locally available while still being invisible or unusable to consumers because of configuration or embargo issues.
  - Borrowed: That supports explicit `supplier_endpoint_unavailable` and `capability_mismatch` queue posture instead of assuming locally visible supply is authoritative.

- [Directly bookable appointments – guidance for practices](https://www.england.nhs.uk/long-read/directly-bookable-appointments-guidance-for-practices/)
  - Borrowed: Practices decide which appointments are directly bookable and which remain behind triage or navigation.
  - Borrowed: That supports modeling `patient_self_service_blocked` honestly while still allowing a governed staff-assisted path on the same booking case.

- [GP Appointments in the NHS App](https://digital.nhs.uk/services/nhs-app/nhs-app-features/appointments)
  - Borrowed: Patient-facing bookability, visibility, embargo timing, and cancellation exposure remain controlled by the clinical system configuration.
  - Borrowed: That supports separating patient-visible availability from staff-assisted operational capability.

- [FHIR Appointment R4](https://hl7.org/fhir/r4/appointment.html)
  - Borrowed: `Appointment` is the booking of a healthcare event for a specific time among patient, practitioner, or related actors.
  - Borrowed: The assisted API therefore keeps confirmation and manage posture tied to authoritative appointment truth rather than staff notes.

- [FHIR Slot R4](https://hl7.org/fhir/r4/slot.html)
  - Borrowed: `Slot` is availability that may be bookable for appointments, not a booked appointment in itself.
  - Borrowed: That supports preserving the repository’s slot, offer, reservation, and confirmation stages instead of collapsing them into one staff-only action.

## Rejected

- Rejected: treating internal staff status as permission to bypass supplier, provider binding, or capability tuple checks.
- Rejected: treating a locally visible slot or a GP-system configuration screen as authoritative supply without the booking-core search, offer, and confirmation pipeline.
- Rejected: treating NHS login or IM1 linkage material as a generic recovery shortcut outside authenticated GP-integrated use.
- Rejected: treating identity-provider session state as sufficient protection for workspace mutation, focus protection, or stale-owner recovery.

## Local Blueprint Priority

No public official documentation exists for this repository’s internal lease-fence, workspace-focus, or task-settlement objects.
For those controls, the local blueprint documents remained authoritative and the external sources were used only to validate the surrounding NHS and FHIR operational assumptions.
