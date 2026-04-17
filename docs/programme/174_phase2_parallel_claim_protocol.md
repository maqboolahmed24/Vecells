# Phase 2 Parallel Claim Protocol

This protocol applies after `seq_174` is marked `[X]` in `prompt/checklist.md`.

## Claimable Block

The current contiguous parallel block is `par_175` through `par_194`. Agents may claim any `[ ]` task in that block when no earlier `seq_` task is marked `[-]`.

Required claim order:

1. Read `prompt/AGENT.md`.
2. Read `prompt/checklist.md`.
3. Confirm `seq_174` is `[X]`.
4. Claim exactly one task by changing `[ ]` to `[-]`.
5. Re-read the checklist to confirm the claim.
6. Read the assigned prompt plus adjacent prompts for context.
7. Implement only the owned task boundary and shared seam changes required by `data/analysis/174_phase2_track_matrix.csv`.
8. Mark the task `[X]` only after implementation and verification.

## File And Seam Ownership

Each task owns the authority boundary named in the matrix column `authority_boundary_owned`. A task may add shared port definitions only when the port maps to one `SEAM_174_*` entry and does not duplicate a protected type name.

Protected names are centralized in `data/analysis/174_phase2_shared_interface_seams.json`. The following are especially guarded:

- `AuthTransaction`
- `PostAuthReturnIntent`
- `Session`
- `PatientLink`
- `IdentityBinding`
- `CapabilityDecision`
- `AccessGrant`
- `TelephonyProviderEvent`
- `CallSession`
- `TelephonyEvidenceReadinessAssessment`
- `TelephonyContinuationEligibility`

## Merge Gate Discipline

Every task must pass its row's `blocking_merge_dependencies` before merge. The gates mean:

- `MG_174_SHARED_CONTRACT`: no duplicate protected schema, DTO, event, or authority owner.
- `MG_174_SECURITY_MASKING`: no raw claims, phone identifiers, recordings, transcript payloads, or PHI in logs, DOM, URLs, screenshots, metrics labels, or generic operational rows.
- `MG_174_RUNTIME_PUBLICATION`: simulator-first behavior is production-shaped, and live-provider assumptions are isolated in the provider matrix.
- `MG_174_REQUEST_CONVERGENCE`: request, patientRef, grant, and telephony promotion paths converge through canonical authority gates.
- `MG_174_BROWSER_ACCESSIBILITY`: browser-visible surfaces have deterministic test IDs, keyboard traversal, reduced-motion behavior, responsive layout, and adjacent table/list parity.

## Conflict Handling

If two tasks appear to need the same protected type or command handler, the owner in the seam registry keeps it. The other task consumes it through the published port.

If a required seam is under-specified, publish a bounded `PARALLEL_INTERFACE_GAP_PHASE2_*` record in the implementation artifact and fail closed where authority cannot be proven. Do not resolve the gap by local shortcut.
