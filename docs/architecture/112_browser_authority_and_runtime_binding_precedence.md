# 112 Browser Authority And Runtime Binding Precedence

The browser may not infer calm or writable posture from route imports, local cache, or component shape. `par_112` makes route authority derive from one ordered chain:

1. Route ownership and audience or channel eligibility
2. Runtime binding hydration and join validation
3. Release, channel, and trust posture
4. Manifest-derived capability switches
5. Route freeze and recovery disposition

```mermaid
flowchart TD
  A["Route family requested"] --> B["Ownership and audience or channel eligibility"]
  B -->|fails| X["Blocked or recovery-only in same shell"]
  B --> C["Hydrate and validate AudienceSurfaceRuntimeBinding"]
  C -->|pending or invalid| Y["Recovery-only until runtime tuple validates"]
  C --> D["Apply release, channel, and trust verdict"]
  D --> E["Resolve manifest-derived capability switches"]
  E --> F["Apply route freeze and recovery disposition if posture already degraded or route is frozen"]
  F --> G["Render live, read-only, recovery-only, or blocked in place"]
```

## Hydration Law

- `binding_pending` is not neutral. The route remains downgraded until the runtime binding validates.
- `binding_invalid` is also not neutral. Mismatched audience surface, route-family membership, route contract, or publication ref keeps the shell in a governed recovery posture.
- `binding_ready` is necessary but still insufficient without release or trust clearance.

## Guard Decision Tree

```mermaid
flowchart TD
  A["Manifest contains route and audience or channel is eligible?"] -->|No| B["Blocked"]
  A -->|Yes| C["Runtime binding ready and valid?"]
  C -->|No| D["Recovery-only"]
  C -->|Yes| E["Release or trust state live?"]
  E -->|Diagnostic only| F["Read-only"]
  E -->|Recovery only| D
  E -->|Blocked| B
  E -->|Live| G["Capability switches present and enabled?"]
  G -->|Route absent or blocked capability| B
  G -->|Live route and action set| H["Any active route freeze?"]
  H -->|No| I["Live"]
  H -->|Yes| J["Apply read-only, recovery-only, or blocked downgrade in the same shell"]
```

## Notes

- Capability switches never upgrade a calmer or more degraded earlier posture.
- Freeze and recovery law may worsen the route after capability evaluation, but it may not make a blocked route appear live again.
- The same selected anchor remains the continuity reference unless the final posture becomes `blocked`.

## Source Refs

- `blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding`
- `blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest`
- `blueprint/platform-frontend-blueprint.md#WritableEligibilityFence`
- `blueprint/phase-0-the-foundation-protocol.md#4970`
