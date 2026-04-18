# 277 Phase 3 Clinical Beta And Live-Later Boundary

        ## Mock-now execution accepted now

        The following are accepted as valid Phase 3 exit evidence in the current repository:

        - simulator-backed provider seams exercising the canonical callback, message, reminder, and notification contracts
        - seeded browser projection helpers preserving the published route, parity, and recovery contracts
        - seeded control-plane refs for release-watch, content, and continuity proof where the domain kernels already bind those refs deterministically

        ## Live-later boundaries

        The gate explicitly withholds production-live claims for these items:

        | Id | Live-later item | Owner task | Risk | Next action |
| --- | --- | --- | --- | --- |
| PH3_CF_007 | Replace simulator-backed telephony and secure-message providers with live adapters | future_live_provider_activation | Production transport, receipt, and delivery semantics are not yet proven against live providers. | Replay the 243 to 245 and 274 proof families against live provider bindings without changing the Phase 3 kernels. |
| PH3_CF_008 | Replace simulator-backed reminders and admin notifications with live outbound delivery workers | future_transport_integration_track | Reminder and notification timing remains functionally correct in-kernel but not yet operationally proven on live delivery rails. | Bind the existing outbox effects and idempotency keys to real transport workers and rerun 236 and 254 hardening. |
| PH3_CF_009 | Replace seeded Phase 3 merge-bundle reads with live command-api fetch consumption | future_phase3_live_projection_fetch_hardening | Browser parity is proven today, but runtime drift could still hide behind seeded helpers until live fetches take over. | Move patient-web and clinical-workspace routes to live command-api reads without changing the published route family or parity contract. |
| PH3_CF_010 | Bind release-watch, channel-freeze, and content-authoring refs to live operational control planes | future_phase9_control_plane_activation | Current consequence and content proofs can be mistaken for live operational readiness if the seeded control-plane boundary is not preserved. | Replace seeded control-plane refs with live watch, publication, and authoring feeds before live rollout claims are made. |

        ## Practical reading

        Phase 3 is complete enough to freeze and open the Booking Engine wave. It is not complete enough to call external-channel production onboarding done.
