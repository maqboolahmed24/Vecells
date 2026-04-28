# 205 Audio Custody And Recording Integrity Matrix

## Recording And Custody

| Case                                          | Trigger                                          | Custody disposition                    | Readiness effect                 | Downstream effect                             |
| --------------------------------------------- | ------------------------------------------------ | -------------------------------------- | -------------------------------- | --------------------------------------------- |
| `TEL205_RECORDING_AVAILABLE_ON_TIME`          | Recording callback and fetch succeed             | governed object plus DocumentReference | ready candidate                  | recoverable promotion allowed after readiness |
| `TEL205_LATE_RECORDING_STATUS_CALLBACK`       | Recording callback arrives after call completion | accepted to custody                    | pending until state reconciles   | no direct request promotion                   |
| `TEL205_DUPLICATE_RECORDING_STATUS_CALLBACK`  | Duplicate recording callback                     | duplicate collapsed                    | unchanged                        | no second governed object                     |
| `TEL205_MISSING_RECORDING_ARTIFACT`           | Provider asset missing                           | no storage, manual review              | readiness insufficient           | blocked or callback required                  |
| `TEL205_TRUNCATED_AUDIO`                      | Duration below policy                            | quarantine object                      | readiness insufficient           | manual audio review                           |
| `TEL205_CORRUPT_AUDIO`                        | Checksum or decode failure                       | quarantine object                      | unusable                         | manual audio review                           |
| `TEL205_UNSUPPORTED_FORMAT`                   | Unsupported media type                           | blocked before governed storage        | unusable                         | no DocumentReference                          |
| `TEL205_HASH_MISMATCH_AFTER_FETCH`            | Transport hash mismatch                          | quarantine object                      | unusable                         | no normal readiness                           |
| `TEL205_QUARANTINE_STORAGE_SUCCESS`           | Malware-safe quarantine succeeds                 | quarantine assessment recorded         | pending/manual depending verdict | recoverable                                   |
| `TEL205_QUARANTINE_STORAGE_FAILURE`           | Quarantine store failure                         | custody error                          | readiness insufficient           | blocked until retry/repair                    |
| `TEL205_TRANSCRIPT_RETRY_TEMP_PROVIDER_ERROR` | Transcript provider temporary error              | governed audio retained                | readiness pending                | transcript worker retry                       |

## Readiness Law

Transcript completion alone is not proof. The readiness assessment must join custody, quarantine, transcript quality, structured safety facts, and manual-review disposition before a phone-origin request can promote or issue a seeded continuation grant.

## Mock-Now Versus Live-Later

The matrix is mock-now and runs against staged audio fixtures plus Playwright browser proof. Live-provider-later webhook timing, recording downloads, callback timing, continuation handoff, and scanner vendors must adapt into these custody states instead of bypassing quarantine, readiness assessment, or grant boundaries.
