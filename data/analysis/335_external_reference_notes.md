# 335 External Reference Notes

Captured on `2026-04-23`.

These sources informed environment realism and security posture only. The local blueprint and earlier validated tasks remained authoritative.

## Borrowed

### NHS England Digital: Message Exchange for Social Care and Health (MESH)

URL: <https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh>

Borrowed:

- MESH is the nationally recognised cross-organisation transport mechanism.
- MESH supports system-to-system and UI-based transfer.
- Workflow IDs are a routing control and help recipients interpret message type.

Applied in repo:

- route manifest keeps `workflowGroup` and `workflowId` explicit
- mailbox rows stay environment-bound and organisation-bound

### NHS England Digital: Apply for a MESH mailbox

URL: <https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/messaging-exchange-for-social-care-and-health-apply-for-a-mailbox>

Borrowed:

- test environments are separate from live
- Path to Live integration can be used for API testing without applying for a mailbox
- live API mailboxes require API onboarding first
- mailbox request requires workflow and organisation details
- Path to Live API testing uses a CSR subject in the `local_id.ods_code.api.mesh-client.nhs.uk` format

Applied in repo:

- `path_to_live_integration` is represented as pre-mailbox rehearsal only in the environment matrix
- `path_to_live_deployment` rows remain manual bridge
- security notes preserve CSR subject handling as reference-only

### NHS England Digital: Workflow Groups and Workflow IDs

URL: <https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids>

Borrowed:

- workflow approval must be checked against the current worksheet
- the currently published worksheet is the April 2026 file
- initiator and responder posture matters to routing rights

Applied in repo:

- mailbox rows carry explicit direction
- gap register records workflow mapping as a separate controlled gap

### NHS England Digital: New workflow request or workflow amendment for an existing mailbox

URL: <https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/workflow-groups-and-workflow-ids/new-workflow-request-or-workflow-amendment-for-an-existing-mailbox>

Borrowed:

- mailbox amendments must be made by the mailbox administrator
- new workflow requests require prior liaison with the MESH or Spine DevOps team
- request forms need a short transfer-flow description plus initiator/responder classification

Applied in repo:

- real NHS portal mutation is modeled as a manual bridge
- route manifest includes purpose, workflow role, and transfer summary fields

### NHS England Digital: User Interface

URL: <https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-user-interface-ui>

Borrowed:

- a separate UI account is required after mailbox creation
- the environment must be chosen explicitly and files stay within that environment
- Path to Live deployment is a common test environment

Applied in repo:

- environment matrix treats live-looking and non-production identities as different facts
- Path to Live deployment rows remain manual bridge rather than fake automation

### NHS England Digital: endpoint lookup service and WorkflowIDs

URL: <https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-guidance-hub/endpoint-lookup-service-and-workflowids>

Borrowed:

- mailbox lookup can be driven by ODS code and WorkflowId
- MOLES is available through Spine Portal
- MOLES access can require a smartcard and HSCN-linked access

Applied in repo:

- PTL practice and hub rows use `endpointLookupMode: ods_and_workflowid`
- MOLES is explicitly listed as a manual bridge gap

### NHS England Digital: certificate guidance

URL: <https://digital.nhs.uk/services/message-exchange-for-social-care-and-health-mesh/mesh-guidance-hub/certificate-guidance>

Borrowed:

- MESH client and API rely on certificates and mutual authentication
- certificate subjects and keystore material are operational onboarding artefacts

Applied in repo:

- tracked files carry certificate fingerprint references only
- no keystore, CSR body, or certificate body is committed

### Playwright: Isolation

URL: <https://playwright.dev/docs/browser-contexts>

Borrowed:

- browser contexts are the right clean-slate mechanism for isolated test runs

Applied in repo:

- each Playwright proof launches a fresh context
- no authenticated state is shared between the mailbox proof and route proof

### Playwright: Best Practices

URL: <https://playwright.dev/docs/best-practices>

Borrowed:

- traces are preferred for CI/debug proof over ad hoc videos

Applied in repo:

- both Playwright specs emit trace zips

### Playwright: Authentication

URL: <https://playwright.dev/docs/auth>

Borrowed:

- browser auth state can contain sensitive cookies and headers
- that state should not be committed

Applied in repo:

- the local portal twin uses fake login only
- no repo-owned `playwright/.auth` state is created for real NHS sessions

## Rejected or narrowed

### Real NHS portal automation as CI truth

Rejected because the official MESH mailbox, UI, and MOLES flows include mailbox-admin, smartcard, HSCN, and approval steps that are not lawful or deterministic to replay from unattended CI.

### Patient-detail routing via `To_DTS` as the primary Vecells control-plane route

Rejected because the local Phase 5 blueprint needs organisation-bound and route-purpose-bound manifests, not a route model that depends on patient demographic addressing.

### Treating Path to Live integration as route verification

Rejected because the official mailbox guidance allows API testing there without a mailbox. That is useful rehearsal, but it is weaker than mailbox-backed deployment routing and therefore stays separate in the environment matrix.
