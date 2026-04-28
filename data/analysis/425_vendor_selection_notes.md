# 425 Vendor Selection Notes

## Decision

Primary configured provider: `vecells_assistive_vendor_watch_shadow_twin`.

Reason: repository evidence marks `dep_assistive_model_vendor_family` as future-optional, watch-only, and replaceable by simulator. No current baseline runtime config selects OpenAI, Azure OpenAI, Anthropic, Google Vertex AI, AWS Bedrock, or another live vendor.

## Evidence

- `data/analysis/integration_assumption_ledger.csv#dep_assistive_model_vendor_family` says assistive vendors are optional and may not become a baseline correctness dependency.
- `data/analysis/dependency_watchlist.csv#dep_assistive_model_vendor_family` says the lifecycle state is `replaceable_by_simulator`.
- `data/analysis/adapter_effect_family_matrix.csv#fxf_assistive_vendor_watch` binds the family to `sim_assistive_vendor_watch_shadow_twin`.
- `data/analysis/credential_capture_checklist.csv#CAPTURE_SEC_ASSISTIVE_PREPROD_VENDOR_KEY` keeps future model vendor keys blocked until intended-use review and rollback proof exist.

## Additional Vendors

OpenAI is typed as an optional future provider because official docs expose project API key, RBAC, authentication, and key safety controls that map cleanly to the manifest shape. It is not selected and no OpenAI project, service account, or key is asserted to exist.

Azure OpenAI, Anthropic, Google Vertex AI, and AWS Bedrock are represented as optional pending-selection provider ids only. Their live flows remain unsupported until official docs, selected-provider evidence, and task-specific manifests are added.
