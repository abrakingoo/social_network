CREATE TABLE IF NOT EXISTS group_invitations (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    group_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (group_id, receiver_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);