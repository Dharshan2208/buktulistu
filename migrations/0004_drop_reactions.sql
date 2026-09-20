-- Buktu Listu v2: single owner, friends are read-only viewers.
-- Reactions are gone entirely; friend identities no longer exist.
--
-- Note: bucket_items.owner_id (added in 0003) is deliberately left in place.
-- D1 has inconsistent support for ALTER TABLE ... DROP COLUMN, and the column
-- is now inert: the Worker never reads or writes it, and inserts rely on the
-- column default. Removing it would require a risky table rebuild for no
-- functional benefit.

DROP TABLE IF EXISTS reactions;

DROP INDEX IF EXISTS idx_reactions_item_id;