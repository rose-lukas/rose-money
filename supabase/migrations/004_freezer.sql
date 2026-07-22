-- Migration: Freezer app
-- Run this in the Supabase SQL Editor (dev first, then prod when shipping).

CREATE TABLE freezer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🧊',
    image_url TEXT,
    amount_kind TEXT NOT NULL DEFAULT 'fraction' CHECK (amount_kind IN ('fraction', 'count')),
    amount_num INT NOT NULL DEFAULT 1,
    amount_den INT,
    barcode TEXT,
    notes TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE freezer_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_freezer_items_account ON freezer_items(account_id);

-- Account-scoped access (same pattern as the rest of the app)
CREATE POLICY "Users access own account freezer items"
    ON freezer_items FOR ALL
    USING (account_id IN (SELECT user_account_ids()))
    WITH CHECK (account_id IN (SELECT user_account_ids()));

-- Public storage bucket for uploaded item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('freezer-items', 'freezer-items', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public freezer image access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'freezer-items');

CREATE POLICY "Authenticated can upload freezer images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'freezer-items' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete freezer images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'freezer-items' AND auth.role() = 'authenticated');
