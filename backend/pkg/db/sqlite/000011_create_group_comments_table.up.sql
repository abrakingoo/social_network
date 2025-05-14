CREATE TABLE IF NOT EXISTS group_comments (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    group_post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT,
    image TEXT,
    likes_count INTEGER DEFAULT 0,  
    dislikes_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_post_id) REFERENCES group_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
