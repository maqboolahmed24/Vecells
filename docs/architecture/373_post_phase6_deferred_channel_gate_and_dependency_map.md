# 373 Post Phase 6 Deferred Channel Gate And Dependency Map

Task: `seq_373_post_phase6_open_deferred_nhs_app_and_parallel_assistive_assurance_tracks_gate`

## Gate Decision

The deferred NHS App wave is open as `open_phase7_with_constraints`.

This opens the first Phase 7 wave for tracks `374` to `379`. It does not approve NHS App go-live, Sandpit sign-off, AOS sign-off, SCAL sign-off, limited release, full release, or live partner onboarding.

## Why The Gate Can Open

- Phase 6 closed with `go_with_constraints`, zero repository-owned blocking defects, and six bounded carry-forward constraints.
- Phase 6 gives Phase 7 stable pharmacy truth, patient status truth, same-shell proof, browser accessibility proof, and rollout guardrail inputs.
- Phase 7 is explicitly a channel conversion over existing patient journeys, not a second product or clinical workflow.
- The first wave freezes or implements manifest, context, SSO, and embedded-session seams before later routes, frontend surfaces, Sandpit configuration, or testing tracks can proceed.

## Immediate Wave

| Track | Boundary | Readiness |
| --- | --- | --- |
| `374` | NHS App manifest, journey inventory, jump-off mapping, onboarding pack | `ready` |
| `375` | embedded context, SSO bridge, navigation contracts | `ready` |
| `376` | webview file handling, accessibility, telemetry, SCAL, release guardrails | `ready` |
| `377` | manifest and jump-off runtime service | `ready` |
| `378` | embedded context resolver and session projection | `ready` |
| `379` | NHS App SSO bridge and identity assertion flow | `ready` |

Each ready track has a launch packet in `data/launchpacks/373_track_launch_packet_374.json` through `data/launchpacks/373_track_launch_packet_379.json`.

## Later Phase 7 Posture

Tracks `380` to `397` are not opened by implication. They remain `blocked` until the first freeze and runtime wave publishes the exact contracts they consume.

Tracks `394` to `396`, `398` to `402` are `deferred` because they require either NHS App environment access, executable implementation evidence, external release evidence, or a Phase 7 proof pack.

## Dependency Rules

- manifest truth governs NHS App route exposure
- trusted embedded behavior requires signed or fenced server evidence
- `assertedLoginIdentity` is capture-only and must be redacted immediately
- NHS App must reuse canonical patient shell, identity, access-grant, route-intent, artifact, and release contracts
- unsupported browser behavior must degrade through governed artifact and route-freeze dispositions
- live NHS App release is blocked until SCAL, incident rehearsal, limited-release plan, accessibility audit, rollback rehearsal, and post-live obligations are evidenced

## Future Phase Reserve

Phase 8 and Phase 9 are not opened by this gate. They receive reserved dependency rows only:

- `after_phase7_guardrail_pack`
- `after_phase7_exit`
- `blocked_on_new_freeze`

The reserve ledger is `data/contracts/373_future_phase_dependency_reserve.json`.
