# 334 Algorithm Alignment Notes

## Local source order

1. `blueprint/platform-frontend-blueprint.md`
2. `blueprint/accessibility-and-content-system-contract.md`
3. `blueprint/phase-5-the-network-horizon.md`
4. `blueprint/patient-account-and-communications-blueprint.md`
5. `blueprint/patient-portal-experience-architecture-blueprint.md`
6. `docs/frontend/328_patient_network_alternative_choice_spec.md`
7. `docs/frontend/329_cross_org_commit_confirmation_and_visibility_spec.md`
8. `docs/frontend/330_network_manage_and_message_timeline_spec.md`
9. `docs/frontend/331_hub_no_slot_reopen_and_recovery_spec.md`
10. `docs/frontend/332_org_aware_access_controls_and_acting_context_switcher_spec.md`
11. `docs/frontend/333_mobile_and_narrow_screen_hub_workflows_spec.md`

## Phrase-to-truth alignment

- `Appointment confirmed`
  - governing objects: current patient-facing confirmation truth, current generation settlement receipt
  - route effect: lawful reassurance only; does not imply practice acknowledgement
- `Practice informed`
  - governing objects: current continuity dispatch and origin-practice visibility envelope
  - route effect: operational notice sent; remains separate from patient reassurance
- `Practice acknowledged`
  - governing objects: current acknowledgement receipt for the origin-practice generation
  - route effect: acknowledgement debt cleared only for the current generation
- `Manage live`
  - governing objects: current capability tuple and current manage posture
  - route effect: mutation is lawful from the current route
- `Provider pending`
  - governing objects: provider-side settlement still unresolved
  - route effect: route remains explicit that change is visible but not settled
- `Callback fallback`
  - governing objects: callback fallback path and current no-slot or return linkage
  - route effect: fallback remains a separate governed branch

## Artifact mode alignment

- `summary_first`
  - governing objects: current route summary, disclosure truth, and return anchor
  - visible posture: default on patient confirmation, patient manage, hub commit, and recovery
- `preview`
  - governing objects: current parity, active grant state, lawful host posture
  - visible posture: inline preview only; no shell ejection
- `print`, `download`, `export`, `external_handoff`
  - governing objects: same grant-bound artifact stage and same return anchor
  - visible posture: secondary action family inside one action bar
- `summary_only`
  - governing objects: embedded host, read-only manage posture, quiet audit posture, or review posture
  - visible posture: richer movement is withheld but explained in place

## Placeholder alignment

- hidden detail never disappears without explanation
- placeholder rows must explain current host or parity ceiling, why detail is reduced, and what summary remains authoritative
- recovery routes use the same governed placeholder grammar as confirmation and manage routes
