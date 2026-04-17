BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_submission_promotion_source_lineage_unique
  ON submission_promotion_records (source_lineage_ref);

CREATE UNIQUE INDEX IF NOT EXISTS idx_submission_promotion_status_consistency_unique
  ON submission_promotion_records (status_consistency_key);

CREATE INDEX IF NOT EXISTS idx_submission_promotion_patient_journey_lookup
  ON submission_promotion_records (patient_journey_lineage_ref, created_at);

CREATE INDEX IF NOT EXISTS idx_submission_promotion_request_lineage_lookup
  ON submission_promotion_records (request_lineage_ref, created_at);

CREATE TRIGGER IF NOT EXISTS trg_submission_envelope_promoted_requires_promotion_refs
BEFORE UPDATE OF state ON submission_envelopes
FOR EACH ROW
WHEN NEW.state = 'promoted'
  AND (NEW.promotion_record_ref IS NULL OR NEW.promoted_request_ref IS NULL)
BEGIN
  SELECT RAISE(ABORT, 'PROMOTED_ENVELOPE_REQUIRES_PROMOTION_REFERENCES');
END;

COMMIT;
