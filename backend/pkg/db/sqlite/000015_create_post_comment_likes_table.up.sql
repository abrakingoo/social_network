CREATE TABLE IF NOT EXISTS comment_likes (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    comment_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    is_like BOOLEAN NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (comment_id, user_id),
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);