CREATE TABLE plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,

    description TEXT,

    category TEXT NOT NULL DEFAULT 'general',

    status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'completed', 'archived')),

    priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high')),

    target_date TEXT,

    steps TEXT DEFAULT '[]',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plans_status
ON plans(status);

CREATE INDEX idx_plans_category
ON plans(category);

CREATE INDEX idx_plans_created_at
ON plans(created_at);
