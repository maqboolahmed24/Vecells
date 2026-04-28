        # 38 Local Adapter Simulator Execution Order

        ## Execution discipline

        The queue is ordered by current blocker removal, proof sensitivity, and live-onboarding lead time. Later phases still stay visible in the same manifest so work does not drift into hidden mock debt.

                        ### Phase 0 blocker removal

                - entry rule: Needed before later provider motion or product integration can stay coherent.
                - simulator count: `6`
                - top simulators: Pharmacy dispatch transport twin, NHS login auth and session twin, Booking provider confirmation twin

                | Rank | Simulator | Score | Tasks later | Tests now |
                | --- | --- | --- | --- | --- |
                | 1 | Pharmacy dispatch transport twin | 205 | seq_028<br>seq_037<br>seq_039<br>seq_040 | contract<br>fault-injection<br>playwright<br>replay<br>migration |
| 2 | NHS login auth and session twin | 197 | seq_024<br>seq_025<br>seq_039<br>seq_040 | contract<br>playwright<br>replay<br>security<br>accessibility |
| 3 | Booking provider confirmation twin | 197 | seq_026<br>seq_036<br>seq_039<br>seq_040 | contract<br>replay<br>projection<br>playwright<br>migration |
| 4 | Telephony and IVR twin | 197 | seq_031<br>seq_032<br>seq_039<br>seq_040 | contract<br>fault-injection<br>playwright<br>replay<br>accessibility |
| 5 | Pharmacy visibility and Update Record twin | 187 | seq_037<br>seq_039<br>seq_040 | contract<br>replay<br>projection<br>playwright |
| 6 | MESH message path twin | 185 | seq_028<br>seq_039<br>seq_040 | contract<br>replay<br>fault-injection<br>playwright |

                ### Phase 1 provider truth

                - entry rule: Starts once the blocker-removal twins already publish stable contracts and proof ladders.
                - simulator count: `4`
                - top simulators: Booking capacity feed twin, IM1 principal-system EMIS twin, IM1 principal-system TPP twin

                | Rank | Simulator | Score | Tasks later | Tests now |
                | --- | --- | --- | --- | --- |
                | 7 | Booking capacity feed twin | 176 | seq_036<br>seq_039<br>seq_040 | contract<br>projection<br>fault-injection<br>playwright |
| 8 | IM1 principal-system EMIS twin | 172 | seq_026<br>seq_036<br>seq_039<br>seq_040 | contract<br>migration<br>replay<br>playwright |
| 9 | IM1 principal-system TPP twin | 172 | seq_026<br>seq_036<br>seq_039<br>seq_040 | contract<br>migration<br>replay<br>playwright |
| 11 | Pharmacy directory and choice twin | 164 | seq_037<br>seq_039<br>seq_040 | contract<br>playwright<br>accessibility<br>policy |

                ### Phase 2 channel evidence

                - entry rule: Requires stable proof envelopes and shared replay vocabulary from earlier phases.
                - simulator count: `5`
                - top simulators: Support replay and resend twin, Email notification twin, Transcription processing twin

                | Rank | Simulator | Score | Tasks later | Tests now |
                | --- | --- | --- | --- | --- |
                | 10 | Support replay and resend twin | 167 | seq_033<br>seq_039<br>seq_040 | contract<br>replay<br>playwright<br>audit |
| 12 | Email notification twin | 164 | seq_031<br>seq_033<br>seq_039<br>seq_040 | contract<br>replay<br>playwright<br>accessibility |
| 13 | Transcription processing twin | 163 | seq_034<br>seq_035<br>seq_039<br>seq_040 | contract<br>fault-injection<br>replay<br>projection |
| 14 | Malware and artifact scanning twin | 163 | seq_034<br>seq_035<br>seq_039<br>seq_040 | contract<br>fault-injection<br>replay<br>projection |
| 15 | SMS delivery twin | 152 | seq_031<br>seq_033<br>seq_039<br>seq_040 | contract<br>replay<br>playwright |

                ### Phase 3 deferred and optional

                - entry rule: Only after current-baseline contract twins are already stable and testable.
                - simulator count: `2`
                - top simulators: NHS App embedded bridge twin, Optional PDS enrichment twin

                | Rank | Simulator | Score | Tasks later | Tests now |
                | --- | --- | --- | --- | --- |
                | 16 | NHS App embedded bridge twin | 148 | seq_029<br>seq_030<br>seq_040 | contract<br>playwright<br>accessibility<br>release |
| 17 | Optional PDS enrichment twin | 122 | seq_027<br>seq_040 | contract<br>replay<br>fault-injection |



        ## Scheduling rule

        Build the simulator contract and validator first, then the browser studio, then any provider-like seed data. Do not start a later phase by skipping the proof-bearing rows above it.
