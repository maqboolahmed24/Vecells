# mock-pds-access-studio

    `Identity_Trace_Studio` access-control studio for `seq_027`.

    ## Run

    ```bash
    pnpm install
    pnpm dev
    ```

    Defaults:

    - dev server: `http://127.0.0.1:4177`
    - expected sandbox: `http://127.0.0.1:4176`

    ## Pages

    - `PDS_Flag_Overview`
    - `Access_Mode_Lattice`
    - `Use_Case_and_Legal_Basis`
    - `Risk_Log_and_Hazard_Map`
    - `Rollback_and_Kill_Switches`

    ## Guardrails

    - every route remains default-off or internal-only until live gates clear
    - PDS success is rendered as supporting evidence, not binding truth
    - the lower lineage strip keeps `local_match -> optional_pds_enrichment -> identity_binding_review -> durable_binding` visible at all times
