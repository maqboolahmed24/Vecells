        # 38 Simulator Fidelity Policy

        ## Policy statement

        Fidelity class is a contract promise, not a UI polish label. The backlog uses the lightest class that still preserves proof, degraded, expiry, replay, and manual-fallback truth.

        ## Class catalogue

        | Class | Allowed for | Must preserve | Must not omit | Default tests | Used now |
        | --- | --- | --- | --- | --- | --- |
        | `shape_only` | Non-baseline placeholders or scaffold chrome only. | Schema names and route boundaries. | Nothing beyond shape and naming. | schema | no |
| `workflow_twin` | Seams where orchestration matters more than exact external proofs. | State progression, bounded fallback, and operator-visible blockers. | Deferred, paused, repair-required, or environment-split states. | contract<br>playwright<br>projection | yes |
| `proof_twin` | Identity, pharmacy, replay, and other truth-bearing seams. | Named proof objects, blocking facts, and non-authoritative signals. | Claim-pending, weak-match, read-only, disputed, or manual-review semantics. | contract<br>replay<br>playwright | yes |
| `fault_injection_twin` | Seams where delayed, missing, contradictory, or degraded signals are core law. | Proof plus deterministic failure, timeout, replay, and supersession behavior. | Contradictory callbacks, missing artifacts, manual repair, or quarantine. | contract<br>fault-injection<br>replay<br>playwright | yes |
| `near-live_contract_twin` | High-friction provider seams with stable live shapes but withheld onboarding. | External contract shape, proof thresholds, timing windows, and gate law. | Acknowledgement/expiry split, provider capability drift, or environment separation. | contract<br>migration<br>playwright<br>replay | yes |


        ## Backlog coverage by fidelity class

        | Class | Simulators |
        | --- | --- |
        | `workflow_twin` | Booking capacity feed twin<br>Email notification twin<br>SMS delivery twin<br>NHS App embedded bridge twin<br>Optional PDS enrichment twin |
| `proof_twin` | NHS login auth and session twin<br>Pharmacy visibility and Update Record twin<br>Support replay and resend twin<br>Pharmacy directory and choice twin |
| `fault_injection_twin` | Telephony and IVR twin<br>Transcription processing twin<br>Malware and artifact scanning twin |
| `near-live_contract_twin` | Pharmacy dispatch transport twin<br>Booking provider confirmation twin<br>MESH message path twin<br>IM1 principal-system EMIS twin<br>IM1 principal-system TPP twin |


        ## Enforcement

        - `shape_only` is not allowed for any baseline-critical row in seq_038
        - any row carrying proof objects or closure blockers must be at least `proof_twin`
        - any row whose risk model depends on delayed, missing, contradictory, or quarantined outcomes must be `fault_injection_twin`
        - any row mapped to later provider onboarding must publish unchanged contract elements before live work starts
