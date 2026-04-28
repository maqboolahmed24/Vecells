# 350 External Reference Notes

Reviewed on 23 April 2026 while implementing `par_350`.

## Official NHS references used

1. [Booking and Referral Standard](https://digital.nhs.uk/services/booking-and-referral-standard)
   Used to keep the transport layer framed as referral transport rather than calm outcome truth. I borrowed the interoperability boundary, but the local blueprint remained authoritative for object names and truth projections.

2. [Digital clinical safety assurance](https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/)
   Used for the requirement that clinical risk management stays explicit through hazard, mitigation, and safety-case style reasoning. That supported the fail-closed expiry and contradiction posture.

3. [Applicability of DCB 0129 and DCB 0160](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160) and the [step-by-step guidance](https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance)
   Used to justify keeping manufacturer-side and deployment-side safety seams visible instead of collapsing them into one local “safe enough” flag.

4. [Message Exchange for Social Care and Health (MESH)](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh)
   Used for the transport-family posture that MESH is a secure asynchronous transport and that message delivery and business acknowledgement are separate facts.

5. [Message Exchange for Social Care and Health API](https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api)
   Used to keep the adapter boundary shaped as a transport client and to justify receipt-checkpoint style evidence capture.

6. [MESH endpoint lookup service and Workflow IDs](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-guidance-hub/endpoint-lookup-service-and-workflowids)
   Used to keep provider-facing references and workflow routing explicit, especially for the outbound reference set and mailbox error posture.

7. [Community pharmacy advanced service specification: NHS Pharmacy First Service](https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/)
   Used to confirm the Pharmacy First pathway scope and the continued presence of fallback routes when direct structured flow is not available.

8. [GP Connect: Update Record](https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record)
   Used only as a boundary sharpen­er: community-pharmacy consultation summaries can be sent in structured form into GP workflow, but that downstream filing/update truth is distinct from dispatch truth in this task.

9. [GP Connect: Send Document](https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/send-document)
   Used only as secondary support for document-style fallback reasoning. I did not copy its object model into the local runtime because the blueprint already freezes the canonical package and dispatch objects.

## Primary engineering references used

1. [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests?lang=curl)
   Borrowed the rule that the idempotent effect should only persist once execution has actually started and that validation failures should not mint a durable success result.

2. [Google Cloud Storage retry strategy](https://cloud.google.com/storage/docs/retry-strategy)
   Borrowed the distinction between retryable transport failures and the separate question of whether an operation is actually safe to retry. That directly informed the split between submit replay, resend, and tuple-drift fresh attempts.

## References considered but rejected as direct local law

- GP Connect product pages were not used as the canonical transport contract because the local Phase 6 blueprint freezes broader transport families than GP Connect alone.
- MESH guidance did not override the local proof-state and calm-truth rules; it only informed the shape of async receipts and mailbox evidence.
- I did not import general cloud backoff defaults as local timing law. The proof deadlines remain the frozen `343` transport-profile values.
