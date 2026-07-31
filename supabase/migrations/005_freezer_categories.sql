-- Migration: Freezer item categories
-- Run this in the Supabase SQL Editor (dev first, then prod when shipping).
-- Existing rows stay NULL, which the app shows as "Uncategorized".

ALTER TABLE freezer_items
    ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS idx_freezer_items_category
    ON freezer_items(account_id, category);
