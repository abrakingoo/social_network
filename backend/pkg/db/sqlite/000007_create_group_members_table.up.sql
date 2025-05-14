CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT CHECK(role IN ('member', 'admin')) DEFAULT 'member',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);