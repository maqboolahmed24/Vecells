        # 65 Contract Registry Generation And Lookup Rules

        ## Generation Pipeline

        1. Read `frontend_contract_manifests.json` for the published route-family, manifest, query, mutation, live-channel, and cache baselines.
        2. Read `gateway_route_family_matrix.csv` to bind every browser route family to one or more gateway surfaces plus trust and context boundaries.
        3. Read `scoped_mutation_gate_decision_table.csv`, `command_settlement_result_matrix.csv`, and `mutation_recovery_and_freeze_matrix.csv` to validate mutation references against route-intent, settlement, and recovery law.
        4. Read `release_contract_verification_matrix.json` to bind digest rows and live-channel route families to release verification coverage.
        5. Materialize one route-family bundle per browser-visible route family and one manifest-ready set per published frontend manifest.

        ## Lookup Rules

        The runtime registry must support deterministic lookup by:
        - `audienceSurface`
        - `routeFamilyRef`
        - `gatewaySurfaceRef`
        - `contractDigestRef`

        Lookup semantics are fail-closed:
        - unknown digests do not resolve to fallback route logic
        - missing route-family bundles are a registry error, not a shell-local inference opportunity
        - cache policy lookup returns the grouped query and live-channel tuple that the backend published

        ## Validation Rules

        - `VR_065_BROWSER_ROUTE_REGISTRY_REQUIRED`: Every browser-visible route family must publish one manifest-ready registry bundle with query, mutation, cache, and any allowed live-channel truth.
- `VR_065_QUERY_PROJECTION_VERSION_REQUIRED`: Query contracts may only point at published projection contract family, version, and version-set rows already emitted by the frontend manifest baseline.
- `VR_065_MUTATION_ROUTE_INTENT_AND_SETTLEMENT_REQUIRED`: Mutation contracts must publish the route-intent binding ref, command settlement schema ref, transition envelope schema ref, and governed recovery disposition.
- `VR_065_LIVE_CHANNEL_TRUST_AND_READINESS_REQUIRED`: Live updates may not imply writable or complete posture beyond their published trust boundary refs, runtime binding refs, continuity refs, and release verification coverage.
- `VR_065_CACHE_POLICY_BACKEND_PUBLISHED`: Cache posture is a backend contract family, not a route-local frontend convenience, and must remain grouped to the exact query and live-channel tuple.
- `VR_065_DIGEST_LOOKUP_DETERMINISTIC`: Every published contract row must resolve to one deterministic digest record and one stable route-family bundle set.

