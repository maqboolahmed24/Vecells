# 23 Mock Account Bootstrap Plan

        ## Section A — `Mock_now_execution`

        Mock credentials are seeded from deterministic generators and never sourced from real partner consoles. The bootstrap law splits local, CI, and shared-dev paths so mocks remain realistic without creating loose operational state.

        | Family | Seed scope | Generation | Reset trigger |
| --- | --- | --- | --- |
| Booking supplier boundary | local_mock, ci_mock, shared_dev | deterministic_fixture_generator | per_spin_up_or_shared_reset |
| Email and secure-link notification rail | local_mock, ci_mock | deterministic_fixture_generator | per_spin_up_or_shared_reset |
| NHS login identity rail | local_mock, ci_mock, shared_dev | deterministic_fixture_generator | per_spin_up_or_shared_reset |
| Artifact scanning provider | shared_dev | deterministic_fixture_generator | per_spin_up_or_shared_reset |
| Cross-organisation messaging transport | shared_dev | deterministic_fixture_generator | per_spin_up_or_shared_reset |
| Pharmacy directory seam | shared_dev | deterministic_fixture_generator | per_spin_up_or_shared_reset |
| Pharmacy outcome observation | shared_dev | deterministic_fixture_generator | per_spin_up_or_shared_reset |
| Pharmacy dispatch transport | local_mock, ci_mock | deterministic_fixture_generator | per_spin_up_or_shared_reset |
| SMS continuation delivery | local_mock, ci_mock | deterministic_fixture_generator | per_spin_up_or_shared_reset |
| Telephony, IVR, and recording rail | local_mock, shared_dev | deterministic_fixture_generator | per_spin_up_or_shared_reset |
| Transcript processing provider | shared_dev | deterministic_fixture_generator | per_spin_up_or_shared_reset |

        Mock fixture packs:
        - synthetic_identity_claims_and_test_users
        - telephony_call_recording_and_transcript_placeholders
        - notification_sender_and_delivery_webhook_states
        - booking_capability_matrix_and_slot_snapshots
        - pharmacy_directory_dispatch_and_outcome_packages
        - secure_message_mailbox_and_transport_replay_fixtures

        ## Section B — `Actual_provider_strategy_later`

        Real later rows never backfill the mock bootstrap path. Instead, each live row points to its mock equivalent where one exists, so later onboarding can prove contract parity without reusing the mock secret itself.

        Later bootstrap rules:
        - shared-dev retains synthetic accounts even after sandpit or production partners exist
        - CI remains secret-brokered and ephemeral, never seeded from live vault values
        - any mock fixture that becomes misleading after real onboarding must be superseded with a documented `MOCK_DRIFT_*` update instead of silent mutation
