-- Migration: Add avatar support to profiles
-- Run this in the Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN avatar_path TEXT;

-- Storage bucket for avatars (if not using the receipts bucket)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view avatars (public bucket)
CREATE POLICY "Public avatar access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars
CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Authenticated users can update avatars
CREATE POLICY "Authenticated users can update avatars"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Authenticated users can delete avatars
CREATE POLICY "Authenticated users can delete avatars"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
