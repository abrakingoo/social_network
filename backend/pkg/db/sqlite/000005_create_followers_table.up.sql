CREATE TABLE IF NOT EXISTS user_follows (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'accepted', 'declined')) NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    UNIQUE (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);