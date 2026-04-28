# 354 External Reference Notes

Reviewed on `2026-04-24` for `par_354_phase6_track_backend_build_practice_visibility_operations_queue_and_exception_handling_views_api`.

The local blueprint remained authoritative. The sources below were used only to sharpen operational naming, degraded-route posture, and staff-facing grouping rules.

## Borrowed guidance

1. [Directory of Healthcare Services (Service Search) API](https://digital.nhs.uk/developer/api-catalogue/directory-of-healthcare-services)

- Borrowed:
  - official provider and service discovery remains an NHS Digital directory responsibility
  - version 3 is the current production surface and versions 1 to 2 are deprecated for retirement on 2 February 2026
- Implementation effect:
  - provider-health and discovery exception posture are derived from canonical source snapshots rather than cached UI curation
  - degraded and unavailable discovery posture stay explicit because source freshness is operationally meaningful

2. [Directory of Services Search API](https://digital.nhs.uk/developer/api-catalogue/directory-of-services-search-api)

- Borrowed:
  - there is still an official read-only DoS search surface alongside the broader DoHS catalogue family
- Implementation effect:
  - the backend keeps `discovery_unavailable` separate from `no_eligible_providers_returned` because route failure and empty-but-valid search results are different operational states

3. [GP Connect: Update Record](https://digital.nhs.uk/developer/api-catalogue/gp-connect-update-record)

- Borrowed:
  - community pharmacy structured updates flow through an official GP Connect route
  - the integration is framed as structured update transfer into the registered GP system, not as proof that the referral loop is complete
- Implementation effect:
  - practice visibility distinguishes dispatch and proof posture from outcome settlement
  - provider-health and exception queues keep route availability and proof freshness explicit rather than treating GP Connect presence as calm completion

4. [Message Exchange for Social Care and Health](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh)

- Borrowed:
  - MESH remains the nationally recognised mechanism for this system-to-system sharing pattern
- Implementation effect:
  - acknowledgement debt and stale-proof posture stay visible as route-health concerns instead of being flattened into generic backlog counters

5. [Message Exchange for Social Care and Health: endpoint lookup service and WorkflowIDs](https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-guidance-hub/endpoint-lookup-service-and-workflowids)

- Borrowed:
  - automated routing and mailbox lookup can still fail outside the initial request/response path, with error reporting arriving separately
- Implementation effect:
  - exception handling persists explicit evidence refs and active classes rather than inferring health from one send attempt result

6. [Changes to the GP Contract in 2026/27](https://www.england.nhs.uk/long-read/changes-to-the-gp-contract-in-2026-27/)

- Borrowed:
  - practices must keep a dedicated, monitored email address for community pharmacy communications
  - that address is a safety-net when GP Connect is unavailable or when a new pharmacy activity is not yet supported through GP Connect
  - the address must be kept up to date and shared with the Directory of Services
- Implementation effect:
  - provider-health and practice visibility keep degraded-but-routable posture separate from total route outage
  - operational naming distinguishes structured route failure from safety-net fallback posture

7. [Table](https://service-manual.nhs.uk/design-system/components/table)

- Borrowed:
  - staff-facing tabular summaries should use real headings, captions, and responsive layout to reduce horizontal scrolling and preserve comparison
- Implementation effect:
  - queue summary and provider-health matrices are published as explicit row-and-column artifacts with stable headings

8. [Summary list](https://service-manual.nhs.uk/design-system/components/summary-list)

- Borrowed:
  - summary rows should remain clearly labelled and meaningful out of context
- Implementation effect:
  - practice visibility is shaped as minimum-necessary labelled truth rather than raw event dumps or transport trace fragments

9. [Interruption page](https://service-manual.nhs.uk/design-system/patterns/interruption-page)

- Borrowed:
  - staff-facing warnings should be reserved for unusual or potentially unsafe situations
  - if an action should never happen, the system should block it instead of merely warning
- Implementation effect:
  - 354 separates urgent and critical exception classes from ordinary backlog indicators
  - illegal transitions remain blocked in the upstream case and dispatch kernels instead of being softened into UI-only warnings

10. [How we write](https://service-manual.nhs.uk/content/how-we-write)

- Borrowed:
  - operational wording should stay factual, neutral, and unambiguous
- Implementation effect:
  - exception class names and practice visibility state names remain short and explicit instead of euphemistic or UI-flavoured

## Rejected or deliberately not adopted

- Rejected any interpretation that route availability or mailbox health alone implies safe completion. Outcome and close truth still come from the local pharmacy loop laws.
- Rejected the idea that the monitored GP email safety-net is a primary calm path. It remains fallback posture, not completion evidence.
- Rejected any frontend-only approach to queue grouping or exception naming. The service-design sources were used to sharpen labels, not to move semantics into the browser.
- Rejected vendor status dashboards, community blog posts, and non-official summaries once current NHS England and NHS England Digital sources were available.
