CREATE TABLE group_comment_likes (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    group_comment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_like BOOLEAN NOT NULL, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (group_comment_id, user_id), 
    FOREIGN KEY (group_comment_id) REFERENCES group_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);