ALTER TABLE events ADD COLUMN going_count INTEGER DEFAULT 0;

-- trigger to count user when they rvsp for the firts time
CREATE TRIGGER trg_attendance_insert
AFTER INSERT ON event_attendance
FOR EACH ROW
WHEN NEW.status = 'going'
BEGIN
  UPDATE events
  SET going_count = going_count + 1
  WHERE id = NEW.event_id;
END;

-- when they decide not to go
CREATE TRIGGER trg_attendance_update_decrement
AFTER UPDATE ON event_attendance
FOR EACH ROW
WHEN OLD.status = 'going' AND NEW.status = 'not_going'
BEGIN
  UPDATE events
  SET going_count = going_count - 1
  WHERE id = NEW.event_id;
END;

-- when they want to go again
CREATE TRIGGER trg_attendance_update_increment
AFTER UPDATE ON event_attendance
FOR EACH ROW
WHEN OLD.status = 'not_going' AND NEW.status = 'going'
BEGIN
  UPDATE events
  SET going_count = going_count + 1
  WHERE id = NEW.event_id;
END;

