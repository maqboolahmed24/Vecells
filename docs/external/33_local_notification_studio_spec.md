# 33 Local Notification Studio Spec

        Generated: `2026-04-10T09:52:31+00:00`
        Visual mode: `Quiet_Send_Studio`
        Phase 0 posture: `withheld`

        ## Mission

        Create the SMS and email project-provisioning pack with a contract-first local notification studio now and a fail-closed provider-project, sender, domain, webhook, and spend-gated live strategy later.

        ## Coverage

        - field-map rows: `44`
- sender/domain rows: `14`
- template rows: `12`
- routing plans: `6`
- delivery scenarios: `7`
- seeded messages: `6`
- live gates: `12`
- official vendor guidance rows: `18`

        ## Section A — `Mock_now_execution`

        The local implementation has two coordinated surfaces:

        - `services/mock-notification-rail` is the contract-first SMS and email rail twin.
        - `apps/mock-notification-studio` is the premium internal control-plane studio.

        The studio keeps the blueprint split explicit:

        - transport acceptance is not authoritative success
        - delivery evidence can be `delivered`, `failed`, `disputed`, `expired`, or `suppressed`
        - patient-visible repair posture flows through the same authoritative chain
        - controlled resend is a governed recovery path, not a second silent send

        ### Page Set

        | Page | Responsibility |
| --- | --- |
| Project_and_Environment_Setup | Project scopes, environment split, ownership, and later dry-run field pack. |
| Template_Gallery | Version-aware template preview with canonical variables and copy rules. |
| Routing_Plan_Studio | Route previews, validation checks, and sender separation. |
| Delivery_Truth_Inspector | Transport, evidence, dispute, repair, and settlement timeline view. |
| Live_Gates_and_Sender_Readiness | Fail-closed live posture, sender readiness, and spend gates. |

        ### Scenario Coverage

        | Scenario | Label | Delivery Evidence | Authoritative Outcome |
| --- | --- | --- | --- |
| email_happy_delivery | Email accepted then delivered | delivered | awaiting_delivery_truth |
| email_bounce_repair_required | Email bounced and repair required | failed | recovery_required |
| email_disputed_delivery | Email disputed after contradictory signals | disputed | recovery_required |
| email_unsubscribe_suppressed | Email suppressed after unsubscribe | suppressed | suppressed |
| sms_delayed_then_delivered | SMS delayed then delivered | delivered | awaiting_delivery_truth |
| sms_wrong_recipient_disputed | SMS wrong-recipient suspicion | disputed | recovery_required |
| email_webhook_signature_retry | Webhook signature retry then recovery | pending | awaiting_delivery_truth |

        The mock rail supports:

        - template rendering and version switching
        - sender and domain placeholder separation
        - signed webhook success and signature-failure retry
        - bounce, dispute, suppression, wrong-recipient suspicion, and repair flows
        - environment separation across `local_mock`, `preview_mock`, and `provider_like_preprod`

        ## Section B — `Actual_provider_strategy_later`

        Later live onboarding is intentionally gated:

        - only seq_031 shortlisted vendors are allowed
        - sender and domain ownership must be explicit before real mutation
        - signed webhooks plus replay fences must exist before provider projects are created
        - named approver, target environment, `ALLOW_REAL_PROVIDER_MUTATION=true`, and `ALLOW_SPEND=true` are all mandatory
        - Phase 0 external readiness remains blocked, so the real posture is still fail-closed

        The live-later plan keeps provider project setup downstream of product truth:

        - templates stay canonical inside Vecells and project outward only as configuration mirrors
        - sender-domain verification is separate from transport or project existence
        - delivery callbacks remain evidence inputs until Vecells records the matching proof bundle
        - resend and repair remain governed product actions rather than provider-console shortcuts
