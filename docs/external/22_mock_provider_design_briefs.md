
            # 22 Mock Provider Design Briefs

            Section A — `Mock_now_execution`

            Mock providers in Vecells are not toy stubs. They are contract-first simulators that must preserve the same proof, ambiguity, degraded-mode, and fence semantics later live adapters will need.

            ## Identity / Authentication

                **Mock_now_execution**

                Objective: Build a contract-first simulator for the NHS login identity rail that preserves the full state and proof model before named vendor work begins.

                Mandatory simulator behaviors:
                - Expose authorize, token, userinfo, and logout endpoints with frozen scope bundles and strict redirect-URI registration per environment.
- Model vector-of-trust, insufficient-assurance, consent-declined, replayed callback, expired transaction, and stale return-intent outcomes as first-class states.
- Force route-intent and session-establishment law through one simulator contract so signed-in, read-only, claim-pending, writable, and bounded-recovery states remain distinct.
- Keep mock claims synthetic; never let the simulator imply PDS enrichment or IM1 linkage is part of baseline identity authority.

                Placeholder-only areas:
                - real client IDs
- real redirect URIs
- real JWT signing keys

                Never-authoritative states:
                - mock callback success alone
- synthetic claims outside route-intent and binding fences

                Acceptance rule:
                - Every dimension must meet minimum_bar_mock_now and no mock kill-switch may trip.

## Telephony / IVR / Recording

                **Mock_now_execution**

                Objective: Build a contract-first simulator for telephony voice capture, recording, and transcript processing that preserves the full state and proof model before named vendor work begins.

                Mandatory simulator behaviors:
                - Emulate call started, menu selected, recording expected, recording available, evidence pending, continuation eligible, manual review, evidence ready, and closed states.
- Support out-of-order webhooks, duplicate receipts, missing recordings, degraded transcript coverage, and urgent-live preemption without flattening the state machine.
- Keep transcript readiness separate from evidence readiness and preserve challenge versus seeded continuation paths.
- Make recording, transcript, and artifact-safety evidence visible to contract tests and Playwright flows before any real carrier or recorder account exists.

                Placeholder-only areas:
                - real caller numbers
- real recordings
- real provider account identifiers

                Never-authoritative states:
                - webhook arrival alone
- recording available alone
- transcript ready alone

                Acceptance rule:
                - Every dimension must meet minimum_bar_mock_now and no mock kill-switch may trip.

## Notifications / SMS

                **Mock_now_execution**

                Objective: Build a contract-first simulator for the SMS continuation delivery rail that preserves the full state and proof model before named vendor work begins.

                Mandatory simulator behaviors:
                - Simulate accepted, queued, delayed, bounced, expired, and disputed delivery results with explicit callback authenticity.
- Preserve seeded versus challenge continuation differences and never let provider acceptance imply grant redemption or verified reachability.
- Model wrong-recipient and stale-grant protection paths so the same recovery posture is exercised before real SMS spend exists.
- Keep SMS optional-flagged in programme terms even while the simulator preserves the full contract.

                Placeholder-only areas:
                - real sender IDs
- real phone numbers

                Never-authoritative states:
                - accepted send
- queued provider message

                Acceptance rule:
                - Every dimension must meet minimum_bar_mock_now and no mock kill-switch may trip.

## Notifications / Email

                **Mock_now_execution**

                Objective: Build a contract-first simulator for the email and secure-link delivery rail that preserves the full state and proof model before named vendor work begins.

                Mandatory simulator behaviors:
                - Simulate accepted, queued, delivered, bounced, disputed, and expired delivery chains with webhook authenticity and template versioning.
- Keep secure-link authority separate from delivery evidence so the product never treats a sent email as a redeemed grant.
- Model quiet degraded posture and failed-delivery repair instead of generic success banners.
- Preserve sender-domain and template constraints so later provider selection cannot surprise the UX layer.

                Placeholder-only areas:
                - real sender domains
- real mailbox credentials

                Never-authoritative states:
                - accepted send
- mailbox delivery alone

                Acceptance rule:
                - Every dimension must meet minimum_bar_mock_now and no mock kill-switch may trip.

## GP / IM1 / Booking Supplier

                **Mock_now_execution**

                Objective: Build a contract-first simulator for GP-system pairing and local booking supplier boundaries that preserves the full state and proof model before named vendor work begins.

                Mandatory simulator behaviors:
                - Model supplier, integration mode, deployment type, local-consumer requirement, and audience scope as first-class capability tuples.
- Preserve slot search partial coverage, stale snapshots, revalidation failure, truthful nonexclusive versus held reservations, and confirmation-pending versus confirmed truth.
- Support compensation, stale candidate rejection, and manage-freeze behavior without assuming one supplier path.
- Make the simulator stronger than ordinary vendor sandboxes so booking truth is proven before real pairing and portal work exists.

                Placeholder-only areas:
                - real practice identifiers
- real supplier credentials
- real patient booking records

                Never-authoritative states:
                - search results alone
- provider 202-style acceptance
- historic feature flags

                Acceptance rule:
                - Every dimension must meet minimum_bar_mock_now and no mock kill-switch may trip.

## Pharmacy Directory / Choice

                **Mock_now_execution**

                Objective: Build a contract-first simulator for pharmacy directory and patient-choice discovery that preserves the full state and proof model before named vendor work begins.

                Mandatory simulator behaviors:
                - Simulate fresh, stale, withdrawn, and zero-provider directory states together with opening-hours and suitability filters.
- Preserve visible-choice-set hashes, warned-choice explanations, no-safe-choice states, and consent reset when provider or pathway drift occurs.
- Prevent the simulator from presenting a hidden default provider or fake full choice.
- Keep real pharmacy names and addresses out of the repository while preserving the exact choice contract.

                Placeholder-only areas:
                - real pharmacy names
- real pharmacy addresses

                Never-authoritative states:
                - legacy lookup heuristics
- directory row without frozen choice proof

                Acceptance rule:
                - Every dimension must meet minimum_bar_mock_now and no mock kill-switch may trip.

## Pharmacy Dispatch / Transport

                **Mock_now_execution**

                Objective: Build a contract-first simulator for pharmacy referral dispatch and urgent-return transport that preserves the full state and proof model before named vendor work begins.

                Mandatory simulator behaviors:
                - Emulate package freeze, dispatch plan compilation, idempotent attempts, authoritative proof deadlines, disputed receipts, and stale evidence rejection.
- Keep urgent return separate from Update Record and require professional contact fallback paths such as monitored email or phone escalation.
- Preserve manual-assisted dispatch, dual review, redispatch, and recovery owner state.
- Treat accepted transport, mailbox delivery, and authoritative proof as separate evidence lanes at all times.

                Placeholder-only areas:
                - real mailbox addresses
- real professional phone numbers
- real transport credentials

                Never-authoritative states:
                - transport accepted
- mailbox delivery alone
- Update Record for urgent return

                Acceptance rule:
                - Every dimension must meet minimum_bar_mock_now and no mock kill-switch may trip.

## Pharmacy Outcome Observation

                **Mock_now_execution**

                Objective: Build a contract-first simulator for pharmacy outcome observation and reconciliation that preserves the full state and proof model before named vendor work begins.

                Mandatory simulator behaviors:
                - Simulate exact replay, semantic replay, collision review, strong match, weak match, unmatched, resolved_apply, resolved_reopen, and resolved_unmatched outcomes.
- Keep outcome gates and closure blockers explicit so weak evidence cannot auto-close the case.
- Preserve supplier-specific evidence shapes and separate urgent return from ordinary consultation summary flows.
- Exercise patient review placeholder, staff assurance, and reopened-for-safety branches through the same shell contracts.

                Placeholder-only areas:
                - real patient summaries
- real Update Record payloads

                Never-authoritative states:
                - single inbound message without correlation proof
- weakly matched email or manual capture

                Acceptance rule:
                - Every dimension must meet minimum_bar_mock_now and no mock kill-switch may trip.
