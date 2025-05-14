CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    content TEXT,
    image TEXT,
    likes_count INTEGER DEFAULT 0,  
    dislikes_count INTEGER DEFAULT 0, 
    comments_count INTEGER DEFAULT 0, 
    privacy TEXT CHECK(privacy IN ('public', 'almost_private', 'private')) NOT NULL DEFAULT 'public',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);