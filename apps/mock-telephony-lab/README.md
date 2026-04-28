# mock-telephony-lab

Premium local telephony operations lab for seq_032.

Visual mode: `Voice_Fabric_Lab`

## Run

```bash
pnpm install
pnpm dev --host 127.0.0.1 --port 4181
```

Optional carrier base URL:

```text
http://127.0.0.1:4181/?telephonyBaseUrl=http://127.0.0.1:4180
```

The app ships with embedded seeded data and still loads without the carrier service. When the carrier is available it uses the HTTP API for number assignment, call simulation, lifecycle advance, and webhook retry.
