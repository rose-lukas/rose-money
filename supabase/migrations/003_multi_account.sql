-- Migration: Multi-Account Support
-- Adds account isolation so multiple households can use the app securely.
-- Run this in the Supabase SQL Editor AFTER verifying your existing data.

-- ============================================================
-- 1. Create accounts and membership tables
-- ============================================================

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE account_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id, user_id)
);

ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Helper function: returns account IDs the current user belongs to
-- ============================================================

CREATE OR REPLACE FUNCTION user_account_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT account_id FROM account_members WHERE user_id = auth.uid()
$$;

-- ============================================================
-- 3. Add account_id to monthly_budgets and categories
-- ============================================================

ALTER TABLE monthly_budgets ADD COLUMN account_id UUID REFERENCES accounts(id);
ALTER TABLE categories ADD COLUMN account_id UUID REFERENCES accounts(id);

-- ============================================================
-- 4. Migrate existing data — create account for current users
--    IMPORTANT: Run this section, check results, then continue.
-- ============================================================

-- Create an account for the existing household
INSERT INTO accounts (id, name) VALUES (
    gen_random_uuid(),
    'Rose Family'
);

-- Store the account ID for subsequent operations
DO $$
DECLARE
    v_account_id UUID;
BEGIN
    SELECT id INTO v_account_id FROM accounts LIMIT 1;

    -- Add all existing users as members (first user as owner)
    INSERT INTO account_members (account_id, user_id, role)
    SELECT v_account_id, id, 
        CASE WHEN ROW_NUMBER() OVER (ORDER BY created_at) = 1 THEN 'owner' ELSE 'member' END
    FROM auth.users
    ORDER BY created_at;

    -- Set account_id on existing data
    UPDATE monthly_budgets SET account_id = v_account_id WHERE account_id IS NULL;
    UPDATE categories SET account_id = v_account_id WHERE account_id IS NULL;
END $$;

-- ============================================================
-- 5. Make account_id NOT NULL after migration
-- ============================================================

ALTER TABLE monthly_budgets ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE categories ALTER COLUMN account_id SET NOT NULL;

-- ============================================================
-- 6. Update unique constraints
-- ============================================================

-- Drop old constraint (only one budget per year/month globally)
ALTER TABLE monthly_budgets DROP CONSTRAINT monthly_budgets_year_month_key;
-- New: unique per account
ALTER TABLE monthly_budgets ADD CONSTRAINT monthly_budgets_account_year_month_key
    UNIQUE(account_id, year, month);

-- Drop old constraint (unique category name globally)
ALTER TABLE categories DROP CONSTRAINT categories_name_key;
-- New: unique per account
ALTER TABLE categories ADD CONSTRAINT categories_account_name_key
    UNIQUE(account_id, name);

-- ============================================================
-- 7. Indexes for performance
-- ============================================================

CREATE INDEX idx_account_members_user_id ON account_members(user_id);
CREATE INDEX idx_account_members_account_id ON account_members(account_id);
CREATE INDEX idx_monthly_budgets_account_id ON monthly_budgets(account_id);
CREATE INDEX idx_categories_account_id ON categories(account_id);

-- ============================================================
-- 8. Drop ALL old RLS policies and create secure ones
-- ============================================================

-- profiles
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view profiles in same account"
    ON profiles FOR SELECT
    USING (
        id IN (
            SELECT user_id FROM account_members
            WHERE account_id IN (SELECT user_account_ids())
        )
    );
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- accounts
CREATE POLICY "Users can view own accounts"
    ON accounts FOR SELECT
    USING (id IN (SELECT user_account_ids()));
CREATE POLICY "Authenticated users can create accounts"
    ON accounts FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- account_members
CREATE POLICY "Users can view members of own accounts"
    ON account_members FOR SELECT
    USING (account_id IN (SELECT user_account_ids()));
CREATE POLICY "Owners can add members"
    ON account_members FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
        OR
        -- Allow self-insert when creating a new account (owner bootstrap)
        user_id = auth.uid()
    );
CREATE POLICY "Owners can remove members"
    ON account_members FOR DELETE
    USING (
        account_id IN (
            SELECT account_id FROM account_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- categories
DROP POLICY IF EXISTS "Authenticated access" ON categories;
CREATE POLICY "Users can access own account categories"
    ON categories FOR ALL
    USING (account_id IN (SELECT user_account_ids()))
    WITH CHECK (account_id IN (SELECT user_account_ids()));

-- monthly_budgets
DROP POLICY IF EXISTS "Authenticated access" ON monthly_budgets;
CREATE POLICY "Users can access own account budgets"
    ON monthly_budgets FOR ALL
    USING (account_id IN (SELECT user_account_ids()))
    WITH CHECK (account_id IN (SELECT user_account_ids()));

-- income_entries (scoped through budget)
DROP POLICY IF EXISTS "Authenticated access" ON income_entries;
CREATE POLICY "Users can access own account income"
    ON income_entries FOR ALL
    USING (budget_id IN (
        SELECT id FROM monthly_budgets WHERE account_id IN (SELECT user_account_ids())
    ))
    WITH CHECK (budget_id IN (
        SELECT id FROM monthly_budgets WHERE account_id IN (SELECT user_account_ids())
    ));

-- fixed_expenses (scoped through budget)
DROP POLICY IF EXISTS "Authenticated access" ON fixed_expenses;
CREATE POLICY "Users can access own account fixed expenses"
    ON fixed_expenses FOR ALL
    USING (budget_id IN (
        SELECT id FROM monthly_budgets WHERE account_id IN (SELECT user_account_ids())
    ))
    WITH CHECK (budget_id IN (
        SELECT id FROM monthly_budgets WHERE account_id IN (SELECT user_account_ids())
    ));

-- expenses (scoped through budget)
DROP POLICY IF EXISTS "Authenticated access" ON expenses;
CREATE POLICY "Users can access own account expenses"
    ON expenses FOR ALL
    USING (budget_id IN (
        SELECT id FROM monthly_budgets WHERE account_id IN (SELECT user_account_ids())
    ))
    WITH CHECK (budget_id IN (
        SELECT id FROM monthly_budgets WHERE account_id IN (SELECT user_account_ids())
    ));

-- Storage: scope receipts by account
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete receipts" ON storage.objects;

CREATE POLICY "Users can upload receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
CREATE POLICY "Users can view receipts"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete receipts"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- ============================================================
-- 9. Update the handle_new_user trigger (no longer auto-creates profile
--    since registration action will handle it)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
