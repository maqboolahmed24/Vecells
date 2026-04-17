# Phase 2 Track Dependency Matrix

The authoritative matrix is `data/analysis/174_phase2_track_matrix.csv`. This document summarizes the ownership model and merge implications for human review.

## Identity Tracks

| Task      | Owns                                                          | Must consume                                                                            | Primary merge gates                                          |
| --------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `par_175` | Auth bridge, frozen scope, return intent, callback settlement | `seq_170`, `seq_171`, patient-link, evidence vault, session governor, binding authority | shared contract, security/masking, runtime/publication       |
| `par_176` | Session governor, local session lifecycle, projection         | auth callback, return intent, patient link, binding, capability                         | shared contract, security/masking, browser/accessibility     |
| `par_177` | Identity evidence vault and masked references                 | auth claims, telephony identifiers, audio refs                                          | shared contract, security/masking, runtime/publication       |
| `par_178` | Patient linker and calibrated match-confidence pipeline       | evidence vault, optional PDS seam                                                       | shared contract, security/masking, runtime/publication       |
| `par_179` | Identity binding authority and patientRef advancement         | patient link, evidence vault, auth/telephony binding intents                            | shared contract, security/masking, request convergence       |
| `par_180` | Capability decision and scope envelope rules                  | route profiles, session, binding, patient link                                          | shared contract, security/masking, browser/accessibility     |
| `par_181` | Claim redemption and canonical AccessGrant supersession       | capability, session, binding, return intent                                             | shared contract, security/masking, request convergence       |
| `par_182` | Wrong-patient repair signal, freeze, and release              | binding, session, grants, repair fallout                                                | shared contract, security/masking, request convergence       |
| `par_183` | Optional PDS adapter and feature-flagged enrichment           | patient-link calibration and PDS disabled fixture                                       | shared contract, security/masking, runtime/publication       |
| `par_184` | Authenticated request ownership and patientRef derivation     | session, binding, capability, grant                                                     | shared contract, security/masking, request convergence       |
| `par_185` | Portal projection and authenticated status access             | session projection, capability, ownership                                               | browser/accessibility, security/masking, request convergence |
| `par_186` | Audit and masking for identity events and claims              | every identity/telephony seam emitting sensitive evidence or operational events         | security/masking, shared contract, browser/accessibility     |

## Telephony Tracks

| Task      | Owns                                                            | Must consume                                              | Primary merge gates                                          |
| --------- | --------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `par_187` | Telephony edge, webhook ingestion, provider event normalization | seq173 provider-event mapping and audit masking           | shared contract, security/masking, runtime/publication       |
| `par_188` | CallSession state machine and menu selection                    | normalized events and readiness ports                     | shared contract, request convergence                         |
| `par_189` | Caller verification and captured identifier pipeline            | evidence vault, binding intent, normalized events         | shared contract, security/masking, request convergence       |
| `par_190` | Recording fetch worker and audio quarantine storage             | normalized events, evidence vault, call session           | shared contract, security/masking, runtime/publication       |
| `par_191` | Transcript readiness and evidence-readiness derivation          | call session, caller verification, audio quarantine       | shared contract, security/masking, request convergence       |
| `par_192` | Seeded/challenge SMS continuation AccessGrant handoff           | readiness, grant service, capability, caller verification | shared contract, security/masking, request convergence       |
| `par_193` | One-pipeline convergence into canonical intake                  | readiness, ownership, grant, call session                 | request convergence, shared contract, security/masking       |
| `par_194` | Duplicate attachment and re-safety trigger handling             | convergence, readiness, audit masking, repair chain       | request convergence, security/masking, browser/accessibility |

## Allowed Parallelism

Tasks may run in parallel when they implement their owned boundary and consume sibling seams through ports or fixtures. Every row still passes through one or more of `MG_174_SHARED_CONTRACT`, `MG_174_SECURITY_MASKING`, `MG_174_RUNTIME_PUBLICATION`, `MG_174_REQUEST_CONVERGENCE`, and `MG_174_BROWSER_ACCESSIBILITY`.

Parallel work is not allowed to:

- claim a sibling task's authority boundary;
- redefine a protected contract type locally;
- persist raw evidence outside the evidence vault or quarantine boundary;
- infer readiness, session, grant, or binding authority from a partial state.

If a sibling implementation is absent, the task may create only the smallest shared port or adapter needed to keep moving. That port must reference the relevant `SEAM_174_*` entry and any unresolved issue must use a `PARALLEL_INTERFACE_GAP_PHASE2_*` code.
