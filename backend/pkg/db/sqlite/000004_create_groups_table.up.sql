-- Groups Table
CREATE TABLE groups (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    creator_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);