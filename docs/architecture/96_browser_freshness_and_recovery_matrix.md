
        # par_096 Browser Freshness And Recovery Matrix

        The recovery matrix is published as one row per environment ring and route family. Each row joins:

        - the route-family browser posture floor from `par_065`
        - the publication/parity tuple from `par_094`
        - one primary cache policy
        - one live-update channel contract when present
        - one audience-safe disclosure and downgrade posture

        ## Matrix Row Count

        - Environment rings: 5
        - Route families: 19
        - Total rows: 95

        ### ci-preview

- `read_only` baseline rows: 11
- `recovery_only` baseline rows: 8

### integration

- `read_only` baseline rows: 11
- `recovery_only` baseline rows: 8

### local

- `read_only` baseline rows: 11
- `recovery_only` baseline rows: 8

### preprod

- `read_only` baseline rows: 11
- `recovery_only` baseline rows: 8

### production

- `read_only` baseline rows: 11
- `recovery_only` baseline rows: 8
