
        # 66 Exactly Once Promotion Algorithm

        ## Compare-And-Set Boundary

        1. Load the envelope and derive deterministic continuity keys.
        2. Check for an existing `SubmissionPromotionRecord` by envelope, source lineage, receipt key, and status key.
        3. If any lookup hits, require all hits to collapse to the same promotion record and return that authoritative result.
        4. If no lookup hits, freeze evidence snapshot and normalized submission refs, allocate one request lineage and one request, apply draft mutability supersession, then persist the immutable promotion record plus promoted envelope.

        ## Fail-Closed Rules

        - A promoted envelope without `promotionRecordRef` or `promotedRequestRef` is invalid.
        - A promotion row may not reuse a source lineage, receipt key, or status key that already points at another promotion.
        - A promotion cannot leave seeded live draft grants or draft leases open.
        - Support, auth-return, and delayed retry flows must resolve from immutable continuity keys rather than client cache.

        ## Replay Casebook

        - `CASE_066_SAME_TAB_DOUBLE_SUBMIT`: `duplicate_submit_same_tab` via `submissionEnvelopeRef` -> `return_existing_promotion_result`
- `CASE_066_CROSSTAB_RACE`: `duplicate_submit_cross_tab` via `submissionEnvelopeRef` -> `serialize_and_return_existing_result`
- `CASE_066_AUTH_RETURN_REPLAY`: `auth_return_replay` via `statusConsistencyKey` -> `return_existing_promotion_result`
- `CASE_066_SUPPORT_RESUME`: `support_resume_replay` via `sourceLineageRef` -> `redirect_to_authoritative_request_shell`
- `CASE_066_DELAYED_NETWORK_RETRY`: `delayed_network_retry` via `receiptConsistencyKey` -> `return_existing_promotion_result`

        ## Bounded Registry Gap

        - `PARALLEL_INTERFACE_GAP_066_PROMOTION_EVENT_REGISTRY_ROWS` keeps the new promotion event family honest until the seq_048 canonical registry absorbs it.
