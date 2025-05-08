CREATE TABLE group_post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_like BOOLEAN NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (group_post_id, user_id),
    FOREIGN KEY (group_post_id) REFERENCES group_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
