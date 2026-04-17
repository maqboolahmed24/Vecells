            # 131 Freeze Blockers And Recovery Rules

            ## Active Blockers

            | Blocker | Ring | Dimension | State |
| --- | --- | --- | --- |
| FZB_131_LOCAL_GATEWAY_SURFACES | local | Gateway surfaces | partial |
| FZB_131_LOCAL_SUMMARY | local | Environment summary | partial |
| FZB_131_CI_PREVIEW_RUNTIME_PUBLICATION_AND_PARITY | ci-preview | Runtime publication and parity | stale |
| FZB_131_CI_PREVIEW_GATEWAY_SURFACES | ci-preview | Gateway surfaces | blocked |
| FZB_131_CI_PREVIEW_MIGRATION_BACKFILL_POSTURE | ci-preview | Migration and backfill posture | stale |
| FZB_131_CI_PREVIEW_OBSERVABILITY_RESTORE_POSTURE | ci-preview | Observability and restore posture | blocked |
| FZB_131_CI_PREVIEW_SUMMARY | ci-preview | Environment summary | blocked |
| FZB_131_INTEGRATION_RUNTIME_PUBLICATION_AND_PARITY | integration | Runtime publication and parity | blocked |
| FZB_131_INTEGRATION_RUNTIME_TOPOLOGY | integration | Runtime topology | blocked |
| FZB_131_INTEGRATION_WORKLOAD_FAMILIES | integration | Workload families | blocked |
| FZB_131_INTEGRATION_TRUST_ZONE_BOUNDARIES | integration | Trust-zone boundaries | blocked |
| FZB_131_INTEGRATION_GATEWAY_SURFACES | integration | Gateway surfaces | blocked |
| FZB_131_INTEGRATION_CHANNEL_BRIDGE_CAPABILITIES | integration | Channel and bridge assumptions | blocked |
| FZB_131_INTEGRATION_MIGRATION_BACKFILL_POSTURE | integration | Migration and backfill posture | blocked |
| FZB_131_INTEGRATION_OBSERVABILITY_RESTORE_POSTURE | integration | Observability and restore posture | blocked |
| FZB_131_INTEGRATION_SUMMARY | integration | Environment summary | blocked |
| FZB_131_PREPROD_RUNTIME_PUBLICATION_AND_PARITY | preprod | Runtime publication and parity | blocked |
| FZB_131_PREPROD_RUNTIME_TOPOLOGY | preprod | Runtime topology | blocked |
| FZB_131_PREPROD_WORKLOAD_FAMILIES | preprod | Workload families | blocked |
| FZB_131_PREPROD_TRUST_ZONE_BOUNDARIES | preprod | Trust-zone boundaries | blocked |

            ## Recovery Rules

            - A blocked or stale ring may not inherit compatibility from a signed artifact or an aligned local tuple.
            - Every blocker remains attached to explicit recovery obligations through the corresponding `recoveryDispositionSetRef`.
            - The candidate dossier stays exact only while those blocker rows remain visible and machine-readable.

