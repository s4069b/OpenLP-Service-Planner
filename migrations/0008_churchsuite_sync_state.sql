ALTER TABLE services ADD COLUMN churchsuite_out_of_sync INTEGER NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN churchsuite_out_of_sync_reason TEXT;
