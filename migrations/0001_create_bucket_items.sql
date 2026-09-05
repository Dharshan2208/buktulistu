CREATE TABLE bucket_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,

    description TEXT,

    category TEXT NOT NULL DEFAULT 'general',

    priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high')),

    completed INTEGER NOT NULL DEFAULT 0,

    target_date TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bucket_completed
ON bucket_items(completed);

CREATE INDEX idx_bucket_category
ON bucket_items(category);