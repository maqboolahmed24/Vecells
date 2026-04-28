# Mock IM1 Pairing Studio

`Interface_Proof_Atelier` is the seq_026 rehearsal-grade IM1 pairing control tower.

## What it does

- rehearses the exact public IM1 prerequisites fields without implying live approval
- maps provider suppliers and route families back to Vecells capability truth
- tracks stage-one SCAL, licence, unsupported-test, supported-test, assurance, and RFC posture from one pack
- keeps real-provider actions blocked until the live-gate checklist passes

## Run

```bash
pnpm install
pnpm dev
```

The default local URL is `http://127.0.0.1:4175`.

## Pages

- `/?page=IM1_Readiness_Overview` for the stage rail and readiness view
- `/?page=Prerequisites_Dossier` for the exact field map and dossier cards
- `/?page=SCAL_Artifact_Map` for the artifact matrix
- `/?page=Provider_Compatibility_Matrix` for route-family and provider-supplier rows
- `/?page=Licence_and_RFC_Watch` for licence placeholders, live gates, and RFC triggers

## Non-negotiable rules

- the `MOCK_IM1_PAIRING` ribbon stays visible so the studio cannot be confused with the real IM1 portal
- IM1 does not become a baseline requirement for patient sign-in, patient ownership, or grant-scoped recovery
- no real legal names, signatories, secrets, or provider credentials belong in repo fixtures, screenshots, or logs
- provider mock-API access, unsupported-test evidence, or supplier queue acceptance never imply live booking truth
- real-provider mutation stays blocked until `ALLOW_REAL_PROVIDER_MUTATION=true` and the live-gate checklist is green
