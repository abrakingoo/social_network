CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT,
    image TEXT,
    likes_count INTEGER DEFAULT 0,  
    dislikes_count INTEGER DEFAULT 0, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);