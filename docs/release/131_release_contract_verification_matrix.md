            # 131 Release Contract Verification Matrix

            The freeze pack republishes the exact verification matrix consumed by the selected candidate.

            ## Matrix Summary

            | Field | Value |
| --- | --- |
| releaseContractVerificationMatrixId | RCVM_LOCAL_V1 |
| releaseRef | RC_LOCAL_V1 |
| candidateBundleHash | 4490af647ed440da |
| baselineTupleHash | af03431e5c9f2caf |
| compilationTupleHash | 0bab371bd97f01a1 |
| releaseContractMatrixHash | 76b66ed13a3a4bce |
| route digest count | 19 |
| frontend digest count | 9 |
| design digest count | 9 |
| design lint verdict count | 9 |

            ## Rule

            Later promotion work must consume `data/release/release_contract_verification_matrix.json` directly.
            It may not reconstruct a softer matrix from subset artifacts.

