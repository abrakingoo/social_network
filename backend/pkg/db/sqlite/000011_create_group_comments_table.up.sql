CREATE TABLE group_comments (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    group_post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_post_id) REFERENCES group_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
