CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    group_id TEXT,
    content TEXT,
    likes_count INTEGER DEFAULT 0,  
    dislikes_count INTEGER DEFAULT 0, 
    comments_count INTEGER DEFAULT 0, 
    privacy TEXT CHECK(privacy IN ('public', 'almost_private', 'private')) NOT NULL DEFAULT 'public',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id)
);