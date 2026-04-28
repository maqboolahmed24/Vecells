# 132 Phase 0 Exit Artifacts

## Exit Pack State

- Exit pack ref: `P0_EXIT_PACK_132_V1`
- Exit pack verdict: `exact`
- Current Phase 0 exit claim: `withheld`
- Selected release candidate: `RC_LOCAL_V1`
- Selected ring: `local`
- Candidate freeze verdict: `exact`
- Current environment compatibility: `partial`

The repository now has one exact, current-candidate-bound Phase 0 exit pack. That does **not** mean Phase 0 is approved. The programme gate remains withheld, and the local candidate still carries explicit surface ceilings through `FZB_131_LOCAL_GATEWAY_SURFACES`.

## Proof Families

| Family | State | Class | Artifacts | Summary |
| --- | --- | --- | --- | --- |
| Current release candidate dossier | partial | release_control | 6 | RC_LOCAL_V1 is exact as a freeze tuple, while local gateway surfaces remain explicitly partial. |
| Runtime publication and surface truth | partial | publication_truth | 8 | Publication, parity, and audience-surface truth are published, but multiple surfaces remain recovery-only or blocked. |
| Synthetic reference flow traces | current | operational_demo | 5 | Six deterministic reference-flow scenarios already prove canonical request, replay, duplicate, quarantine, identity hold, and confirmation debt paths. |
| Adapter and simulator validation | partial | dependency_truth | 4 | Most adapters validate against real local paths; malware scanning remains an explicit blocked simulator gap. |
| Recovery, resilience, and migration posture | current | operational_readiness | 6 | Migration, release-watch, and resilience packs are present and still bind the local candidate. |
| Assurance and compliance foundation | partial | assurance | 5 | Clinical safety, IM1 readiness, and privacy proof are published, while prerequisite gaps remain explicit instead of hidden. |
| Shell contract and design foundation | partial | frontend_foundation | 6 | Persistent shell, frontend manifests, and design publication are in place, but design lint and accessibility ceilings still constrain multiple surfaces. |
| Phase 0 gate context | blocked | programme_control | 2 | The programme-level Phase 0 gate remains withheld even though the exit pack is now consolidated. |
| Phase 0 exit pack validation | current | verification | 7 | This task binds the current candidate, scenario atlas, and verification surfaces into one proof pack. |

## Demonstration Scenarios

| Scenario | Disposition | Proof posture | Route family | Surface | Notes |
| --- | --- | --- | --- | --- | --- |
| Happy path | happy | partial_surface_proof | rf_intake_self_service | surf_patient_intake_web | Preview baseline proving a truthful receipt and same-shell return without any live provider tuple. |
| Exact replay | unhappy | partial_surface_proof | rf_patient_requests | surf_patient_requests | Duplicate replay proves prior accepted result reuse without reminting request truth or pretending a fresh success path occurred. |
| Collision review | unhappy | partial_surface_proof | rf_support_ticket_workspace | surf_support_ticket_workspace | Integration duplicate collision keeps review truth explicit for support and blocks silent collapse into an accepted replay. |
| Fallback review | unhappy | partial_surface_proof | rf_support_replay_observe | surf_support_replay_observe | Wave-probe case proving degraded accepted progress re-enters governed fallback review without losing same-shell provenance. |
| Identity hold | unhappy | blocked_proof | rf_patient_secure_link_recovery | surf_patient_secure_link_recovery | Preview repair case proving wrong-patient holds remain explicit and recover through the same secure-link shell. |
| Publication drift | unhappy | recovery_only_proof | rf_support_replay_observe | surf_support_replay_observe | Preprod replay case proving support restore can reopen same-shell work only after restore settlement and reachability proof align. \| The local ring keeps one exact tuple but current gateway-backed surfaces remain bounded by design lint, accessibility, and browser posture ceilings. |
| Confirmation blocked | unhappy | partial_surface_proof | rf_hub_case_management | surf_hub_case_management | Preprod hub-managed booking case proving confirmation debt and ambiguity remain explicit across patient and hub semantics. |

## Mock Now Execution

- The atlas binds to the real current simulator-backed candidate rather than a presentation-only demo model.
- Six scenarios reuse the deterministic `seq_128` trace corpus.
- The publication-drift scenario is artifact-backed from the current release candidate, freeze blocker set, and audience-surface truth.

## Actual Production Strategy Later

- Keep the same scenario ids and proof semantics.
- Swap simulator-backed evidence for live ring evidence only under the same tuple structure.
- Do not replace the exit pack with a new release narrative or environment-specific slideware.
