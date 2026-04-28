# mock-pds-fhir

    Local rehearsal-grade PDS FHIR sandbox for `seq_027`.

    ## What it provides

    - FHIR-style search and read endpoints for synthetic patient demographics
    - access-mode profiles for `application_restricted`, `healthcare_worker`, `healthcare_worker_with_update`, and `patient_access`
    - scenario coverage for matched, ambiguous, low confidence, no match, stale, contradictory, partial-field, throttled, and degraded behavior
    - masked audit logs only
    - an internal playground page at `/`

    ## Run

    ```bash
    node src/server.js
    ```

    Defaults:

    - listen address: `127.0.0.1`
    - port: `4176`

    Key endpoints:

    - `GET /metadata`
    - `GET /Patient?scenario=matched&accessMode=application_restricted&query=meridian`
    - `GET /Patient/pds_pt_meridian_001?scenario=matched&accessMode=application_restricted`
    - `GET /audit`
    - `GET /health`

    ## Safety rules

    - synthetic fixtures only
    - no real NHS numbers or live demographic data
    - PDS responses never imply durable identity binding
    - degraded and throttled scenarios must preserve the no-PDS fallback posture
