# mock-mesh

Local MESH twin for `seq_028`.

- Default host: `127.0.0.1`
- Default port: `4178`
- Sandbox URL: `http://127.0.0.1:4178`
- Launch: `npm start`

This service is intentionally transport-first. It validates mailbox or workflow assignments, simulates delayed acknowledgement, duplicate delivery, replay fencing, expiry, and quarantine, and keeps those states distinct from authoritative downstream truth.

The sandbox page is served from `http://127.0.0.1:4178/` and exposes `MOCK_MESH_SANDBOX` controls for dispatch, lifecycle advance, and replay review.
