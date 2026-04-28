            # 131 Environment Compatibility Evidence

            The environment matrix publishes one explicit score for every ring and every required dimension.

            ## Ring Summary

            | Ring | Overall | Topology | Gateway surfaces | Migration | Restore |
| --- | --- | --- | --- | --- | --- |
| local | partial | exact | partial | exact | exact |
| ci-preview | blocked | exact | blocked | stale | blocked |
| integration | blocked | blocked | blocked | blocked | blocked |
| preprod | blocked | blocked | blocked | blocked | blocked |
| production | blocked | blocked | blocked | blocked | blocked |

            ## Matrix Policy

            - `runtime_publication_and_parity` proves the live bundle still matches the approved tuple.
            - `runtime_topology`, `workload_families`, and `trust_zone_boundaries` are driven by serialized ring fingerprints.
            - `gateway_surfaces` remains partial in local and blocked elsewhere until the published browser posture actually recovers.
            - `migration_backfill_posture` and `observability_restore_posture` fail closed when ring-specific evidence is stale, blocked, or missing.

