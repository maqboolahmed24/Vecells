# Audience Surface Runtime Bindings Final

        `seq_130` finalizes the Phase 0 audience-surface runtime truth by publishing one explicit row per current inventoried surface plus one explicit blocked gap row for the standalone assistive control shell. The catalog is derived from the integrated `seq_127` fusion layer and the current local `ReleasePublicationParityRecord`, not from local page discovery.

        ## Current Estate

        | Binding state | Rows |
| --- | --- |
| publishable live | 0 |
| recovery only | 7 |
| partial | 13 |
| blocked | 3 |
| drifted | 0 |

        ## Truth Ceiling

        - Local runtime-publication bundle: `rpb::local::authoritative`
        - Local release-publication parity: `rpp::local::authoritative`
        - Current parity state: `exact`
        - Current route exposure state: `constrained`

        The active parity tuple is exact, but current browser truth remains bounded by these ceiling reasons:

        - One or more frontend manifests remain constrained or recovery-only instead of publishable_live.
- Accessibility coverage is still degraded for at least one audience surface.
- Design contract lint verdicts are not fully passed across the bundle.

        ## Truth Law

        | Truth state | Calm rows | Writable rows |
| --- | --- | --- |
| allowed | 0 | 0 |
| suppressed | 21 | 16 |
| diagnostic_only | 2 | 7 |

        Exact parity does not reopen calm or writable posture on its own. `publishable_live` still requires exact parity plus publishable browser posture, passing design lint, and complete accessibility.
