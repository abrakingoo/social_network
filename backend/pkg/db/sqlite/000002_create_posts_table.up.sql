CREATE TABLE posts (
    id TEXT PRIMARY KEY NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    content TEXT,
    image TEXT,
    privacy TEXT CHECK(privacy IN ('public', 'almost_private', 'private')) NOT NULL DEFAULT 'public',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);