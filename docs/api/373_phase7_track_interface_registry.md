# 373 Phase 7 Track Interface Registry

This registry names which track owns each first-wave interface and which later tracks must consume it.

The interface launch verdict is `open_phase7_with_constraints`.

| Interface                    | Owner | Consumers                    | Rule                                                                                               |
| ---------------------------- | ----- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `NHSAppIntegrationManifest`  | `374` | `377`, `380`, `383`, `394`   | route exposure comes only from immutable manifest versions                                         |
| `JourneyPathDefinition`      | `374` | `377`, `380`, `386`, `389`   | each route declares auth, resume, deep link, visibility, placeholder, artifact, and freeze posture |
| `JumpOffMapping`             | `374` | `377`, `394`                 | placement, ODS visibility, journey path, copy, and cohort are deterministic                        |
| `ChannelContext`             | `375` | `378`, `386`, `387`          | query hints cannot create trusted embedded posture                                                 |
| `EmbeddedEntryToken`         | `375` | `378`, `379`                 | token TTL, nonce, route, and cohort are fenced                                                     |
| `SSOEntryGrant`              | `375` | `379`                        | one-time asserted identity handoff, redacted before normal browsing                                |
| `AuthBridgeTransaction`      | `375` | `379`, `398`                 | state, nonce, PKCE, manifest, capability, and context fences are mandatory                         |
| `IdentityAssertionBinding`   | `375` | `379`, `398`                 | asserted identity, NHS login subject, and local subject binding must agree                         |
| `ReturnIntent`               | `375` | `379`, `380`, `387`, `389`   | post-auth and resume routing must stay bound to session, subject, manifest, and route family       |
| `BinaryArtifactDelivery`     | `376` | `382`, `390`, `391`, `399`   | webview delivery narrows canonical artifact law; it never widens visibility                        |
| `ArtifactByteGrant`          | `376` | `382`, `390`, `391`          | byte delivery is single-redemption, size-bound, channel-bound, and return-safe                     |
| `EmbeddedErrorContract`      | `376` | `384`, `388`, `391`          | errors have one clear recovery route and no raw protocol wording                                   |
| `ChannelTelemetryPlan`       | `376` | `385`, `400`, `401`, `402`   | limited-release and monthly evidence uses privacy-safe event contracts                             |
| `ReleaseGuardrailPolicy`     | `376` | `385`, `400`, `402`          | freezes and kill switches are governed without redeploy                                            |
| `ChannelReleaseFreezeRecord` | `376` | `385`, `401`, `402`, Phase 9 | route freezes are first-class assurance evidence                                                   |
| `ManifestRepository`         | `377` | `378`, `380`, `383`, `394`   | runtime manifest lookup must match frozen manifest and config fingerprint                          |
| `ChannelContextResolver`     | `378` | `379`, `381`, `386`, `387`   | server and client must resolve safe context consistently                                           |
| `NHSAppSsoBridge`            | `379` | `388`, `398`                 | silent SSO and consent-denied paths settle into governed dispositions                              |
