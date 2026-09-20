-- Buktu Listu v2: items belong to one named friends, and friends
-- can react to each other's items with a single "I'm in" toggle.
--
-- Existing items are assigned to the original owner (friend1).
-- The owner_id default exists only to backfill legacy rows; the Worker
-- always supplies an explicit owner on insert.

ALTER TABLE bucket_items
ADD COLUMN owner_id TEXT NOT NULL DEFAULT 'friend1';

CREATE TABLE reactions (
    item_id INTEGER NOT NULL
        REFERENCES bucket_items(id) ON DELETE CASCADE,
    friend_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, friend_id)
);

CREATE INDEX idx_reactions_item_id
ON reactions(item_id);