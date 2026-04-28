
        # par_096 Recovery Posture And Staleness Disclosure

        The browser runtime now treats stale, frozen, blocked, replay-gap, and manifest-drift posture as first-class runtime truth. Reconnect only restores transport. It does not restore writable or reassuring truth on its own.

        ## Disclosure Modes

        - `embedded_recovery_banner`
- `governance_control_notice`
- `operations_diagnostic_ribbon`
- `patient_status_strip`
- `public_entry_recovery_banner`
- `support_recovery_notice`
- `support_replay_notice`
- `workspace_status_strip`

        ## Downgrade Rules

        - `transientDisconnectPosture` preserves anchor continuity only where the audience profile explicitly allows it.
        - `replayGapPosture` forces recovery-only or blocked behavior and suspends stale optimistic interaction.
        - `publicationDriftPosture` follows the published runtime bundle and parity tuple rather than route-local opinion.
        - `manifestDriftPosture` and `assuranceTrustDriftPosture` fail closed to the safest audience-appropriate state.
        - `offlineReusePosture` preserves context only through the published offline reuse disposition of the selected cache policy.

        ## Boundaries

        - Patient routes default to summary-preserving or recovery-only posture.
        - Workspace and servicing routes preserve selected anchor and explanation while freezing writes.
        - Operations routes preserve diagnostic summaries but do not imply live control authority.
        - Governance routes fail closed to explicit review posture on trust or manifest ambiguity.

        ## Matrix Integrity

        - Total recovery posture rows: 95
        - Rows with explicit blocked disposition: 95
