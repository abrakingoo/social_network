CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    recipient_id TEXT NOT NULL,
    actor_id TEXT,
    type TEXT NOT NULL,
    entity_id TEXT,
    entity_type TEXT,
    is_read BOOLEAN DEFAULT 0,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
);
