# 122 Essential Functions And Dependency Restore Order

The authoritative source is [essential_function_dependency_map.json](../../data/assurance/essential_function_dependency_map.json).

## Restore Order

| Priority | Essential function | Why it restores in this position |
| --- | --- | --- |
| `0` | `EF_122_AUDIT_BACKUP_AND_OPERATIONAL_RECOVERY` | the control plane has to prove what is safe before other surfaces can look healthy |
| `1` | `EF_122_SAFE_INTAKE_AND_URGENT_DIVERSION` | urgent and safety-sensitive intake cannot wait behind downstream convenience features |
| `2` | `EF_122_IDENTITY_SESSION_AND_CONTROLLED_RECOVERY` | safe access and subject scope are required before writable or sensitive surfaces resume |
| `3` | `EF_122_STAFF_REVIEW_AND_MUTATION_SAFETY` | clinical and operational work queues come back only after scope and control truth are re-established |
| `4` | `EF_122_PATIENT_VISIBILITY_AND_COMMUNICATION_CONTINUITY` | communication continuity depends on earlier control-plane and identity recovery |
| `5` | `EF_122_BOOKING_NETWORK_AND_PHARMACY_TRUTHFUL_STATUS` | provider-facing status routes recover after the platform can prove their dependencies are trustworthy again |

## Essential Function Set

- safe intake and urgent diversion
- identity and session establishment with controlled recovery
- staff task review and scoped mutation safety
- patient visibility and communication continuity
- local booking network and pharmacy truthful status
- audit backup restore and operational recovery

## Dependency Principles

- every essential function names its supporting systems and its dependency refs explicitly
- restore proof requires more than service health and more than backup existence
- every function keeps one current list of evidence refs and one current list of open gaps
- deployer-specific operational dependencies stay visible as placeholders until the deployer is known

## Mock Now Execution

- derive the dependency map from the current runtime and shell architecture
- use local rehearsal and simulator outputs where that is the most truthful available evidence
- keep deployer-specific dependencies under `deployer_detail_pending` rather than burying them in notes

## Actual Production Strategy Later

- attach named runbooks and contact trees to the same essential function refs
- attach preprod and live rehearsal outputs to the same restore order
- keep the current restore priority numbers unless the product architecture itself changes
