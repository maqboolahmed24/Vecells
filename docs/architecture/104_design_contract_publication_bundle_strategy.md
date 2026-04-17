# 104 Design Contract Publication Bundle Strategy

Each `DesignContractPublicationBundle` now acts as the contract join between route families, the canonical token export, the current kernel bindings, and the lint verdict that decides whether the bundle may remain published.

## Bundle strategy

- Bundle ids and route refs stay compatible with the existing seq_052 publication plane.
- Digest calculation is deterministic and includes token export, kernel propagation, accessibility tuple hashes, and the lint verdict id.
- Bundle publication is fail-closed: if any route in a bundle blocks or drifts, the bundle verdict blocks rather than claiming mixed-vocabulary calmness.

## Lint result

- Pass bundles: 5
- Blocked bundles: 4

### Bundle Verdict Snapshot

```json
[
  {
    "designContractLintVerdictId": "dclv::clinical_workspace::pending",
    "designContractPublicationBundleRef": "dcpb::clinical_workspace::planned",
    "kernelStatePropagationState": "exact",
    "accessibilitySemanticCoverageState": "exact",
    "artifactModeParityState": "exact",
    "result": "pass"
  },
  {
    "designContractLintVerdictId": "dclv::governance_admin::pending",
    "designContractPublicationBundleRef": "dcpb::governance_admin::planned",
    "kernelStatePropagationState": "blocked",
    "accessibilitySemanticCoverageState": "blocked",
    "artifactModeParityState": "exact",
    "result": "blocked"
  },
  {
    "designContractLintVerdictId": "dclv::hub_desk::pending",
    "designContractPublicationBundleRef": "dcpb::hub_desk::planned",
    "kernelStatePropagationState": "exact",
    "accessibilitySemanticCoverageState": "exact",
    "artifactModeParityState": "exact",
    "result": "pass"
  },
  {
    "designContractLintVerdictId": "dclv::operations_console::pending",
    "designContractPublicationBundleRef": "dcpb::operations_console::planned",
    "kernelStatePropagationState": "blocked",
    "accessibilitySemanticCoverageState": "blocked",
    "artifactModeParityState": "exact",
    "result": "blocked"
  },
  {
    "designContractLintVerdictId": "dclv::patient_authenticated_portal::pending",
    "designContractPublicationBundleRef": "dcpb::patient_authenticated_shell::planned",
    "kernelStatePropagationState": "exact",
    "accessibilitySemanticCoverageState": "exact",
    "artifactModeParityState": "exact",
    "result": "pass"
  },
  {
    "designContractLintVerdictId": "dclv::patient_public_entry::pending",
    "designContractPublicationBundleRef": "dcpb::patient_public_entry::planned",
    "kernelStatePropagationState": "exact",
    "accessibilitySemanticCoverageState": "exact",
    "artifactModeParityState": "exact",
    "result": "pass"
  },
  {
    "designContractLintVerdictId": "dclv::patient_transaction_recovery::pending",
    "designContractPublicationBundleRef": "dcpb::patient_transaction_recovery::planned",
    "kernelStatePropagationState": "drifted",
    "accessibilitySemanticCoverageState": "exact",
    "artifactModeParityState": "drifted",
    "result": "blocked"
  },
  {
    "designContractLintVerdictId": "dclv::pharmacy_console::pending",
    "designContractPublicationBundleRef": "dcpb::pharmacy_console::planned",
    "kernelStatePropagationState": "exact",
    "accessibilitySemanticCoverageState": "exact",
    "artifactModeParityState": "exact",
    "result": "pass"
  },
  {
    "designContractLintVerdictId": "dclv::support_workspace::pending",
    "designContractPublicationBundleRef": "dcpb::support_workspace::planned",
    "kernelStatePropagationState": "blocked",
    "accessibilitySemanticCoverageState": "blocked",
    "artifactModeParityState": "exact",
    "result": "blocked"
  }
]
```
