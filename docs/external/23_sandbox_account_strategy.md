# 23 Sandbox Account Strategy

        Current gate posture from seq_020 remains `withheld`. This pack closes the account-and-secret governance gap by freezing one ownership, storage, ingest, and revocation model across mock-now execution and later real-provider onboarding.

        ## Summary

        - inventory rows: 66
        - dependency families: 16
        - mock rows: 28
        - actual-later rows: 35
        - hybrid rows: 3
        - dual-control rows: 30
        - manual checkpoint rows: 38
        - missing-owner rows: 0

        ## Section A — `Mock_now_execution`

        Mock accounts and secrets are deterministic, synthetic, and environment-scoped. Local and CI rows reset automatically; shared-dev rows remain synthetic but auditable so Playwright, contract tests, and seed jobs can rehearse the same flow without borrowing any live partner material.

        | Family | Mock now | Hybrid | Environments |
| --- | --- | --- | --- |
| Booking supplier boundary | 3 | 0 | local_mock, ci_mock, shared_dev, integration |
| Email and secure-link notification rail | 3 | 0 | local_mock, ci_mock, preprod, production |
| Deferred NHS App embedded channel | 0 | 0 | sandpit |
| GP system and IM1 programme boundary | 0 | 0 | integration |
| NHS login identity rail | 4 | 3 | local_mock, ci_mock, shared_dev, sandpit, integration, preprod, production |
| Artifact scanning provider | 2 | 0 | shared_dev |
| Cross-organisation messaging transport | 2 | 0 | shared_dev, integration, preprod, production |
| Future-optional assistive vendor boundary | 0 | 0 | preprod |
| Network capacity partner feed | 0 | 0 | integration |
| Optional PDS enrichment seam | 0 | 0 | sandpit |
| Pharmacy directory seam | 2 | 0 | shared_dev, integration |
| Pharmacy outcome observation | 1 | 0 | shared_dev, integration |
| Pharmacy dispatch transport | 2 | 0 | local_mock, ci_mock, preprod, production |
| SMS continuation delivery | 3 | 0 | local_mock, ci_mock, integration |
| Telephony, IVR, and recording rail | 4 | 0 | local_mock, shared_dev, preprod, production |
| Transcript processing provider | 2 | 0 | shared_dev |

        Mock-now law:
        - No real credential or secret may be committed to the repository, markdown examples, screenshots, or Playwright artifacts.
- Browsers may never hold long-lived provider secrets; browser automation consumes brokered values only during gated dry runs.
- Environments do not inherit secrets from each other; every widen, redirect, key, sender, mailbox, or number change requires explicit governance.
- Shared production credentials must always have a named owner, backup owner, approver, rotation proof, and revocation path.
- Test users, sandpit accounts, and shared-dev fixtures may never silently gain production privilege or live patient authority.

        ## Section B — `Actual_provider_strategy_later`

        Later real-provider onboarding is pre-modeled but still blocked behind explicit live gates. Every live row has a named owner, backup owner, approver, storage backend, ingest path, and revocation path before seq_024-040 touch any provider portal or live credentials.

        | Family | Actual later | Manual checkpoints | Dual control |
| --- | --- | --- | --- |
| Booking supplier boundary | 1 | 1 | 1 |
| Email and secure-link notification rail | 3 | 3 | 3 |
| Deferred NHS App embedded channel | 1 | 1 | 0 |
| GP system and IM1 programme boundary | 4 | 4 | 3 |
| NHS login identity rail | 10 | 13 | 8 |
| Artifact scanning provider | 0 | 0 | 0 |
| Cross-organisation messaging transport | 3 | 3 | 3 |
| Future-optional assistive vendor boundary | 1 | 1 | 1 |
| Network capacity partner feed | 1 | 1 | 1 |
| Optional PDS enrichment seam | 2 | 2 | 2 |
| Pharmacy directory seam | 1 | 1 | 1 |
| Pharmacy outcome observation | 1 | 1 | 1 |
| Pharmacy dispatch transport | 2 | 2 | 2 |
| SMS continuation delivery | 2 | 2 | 1 |
| Telephony, IVR, and recording rail | 3 | 3 | 3 |
| Transcript processing provider | 0 | 0 | 0 |

        Live-provider posture:
        - Every live capture lands first in `partner_capture_quarantine` or the metadata review queue.
        - Every production secret row is dual controlled and has both owner and backup owner.
        - Redirect URI, key, mailbox, sender, phone number, and environment changes are treated as governed change events, not operator convenience edits.
        - Deferred NHS App and future-optional assistive vendor rows stay placeholder-only and never rebaseline the current path.
