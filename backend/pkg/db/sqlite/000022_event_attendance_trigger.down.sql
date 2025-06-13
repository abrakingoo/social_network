ALTER TABLE events DROP COLUMN going_count;

DROP TRIGGER IF EXISTS trg_attendance_insert;
DROP TRIGGER IF EXISTS trg_attendance_update_decrement;
DROP TRIGGER IF EXISTS trg_attendance_update_increment;
