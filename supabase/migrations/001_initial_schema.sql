-- Migration: Initial Schema for Family Budget Tracker
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. User profiles (extends Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view all profiles"
    ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Spending categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Monthly budget periods
CREATE TABLE monthly_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INT NOT NULL,
    month INT NOT NULL CHECK (month >= 1 AND month <= 12),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    overdraft_from_previous DECIMAL(10,2) DEFAULT 0,
    overdraft_applied BOOLEAN DEFAULT true,
    notes TEXT,
    confirmed_by UUID REFERENCES profiles(id),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(year, month)
);

ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON monthly_budgets
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Income entries per month
CREATE TABLE income_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES monthly_budgets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON income_entries
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Fixed expense entries per month
CREATE TABLE fixed_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES monthly_budgets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON fixed_expenses
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Individual variable expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES monthly_budgets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    store TEXT,
    description TEXT,
    spent_by UUID NOT NULL REFERENCES profiles(id),
    receipt_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON expenses
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Indexes for common queries
CREATE INDEX idx_expenses_budget_id ON expenses(budget_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_spent_by ON expenses(spent_by);
CREATE INDEX idx_monthly_budgets_year_month ON monthly_budgets(year, month);

-- 8. Seed default categories
INSERT INTO categories (name, sort_order) VALUES
    ('Groceries', 1),
    ('Gas', 2),
    ('Dining', 3),
    ('Entertainment', 4),
    ('Medical', 5),
    ('Clothing', 6),
    ('Kids', 7),
    ('Household', 8),
    ('Transportation', 9),
    ('House Improvement', 10),
    ('Other', 11);

-- 9. Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Storage policies: authenticated users can upload/read receipts
CREATE POLICY "Authenticated users can upload receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view receipts"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete receipts"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- 10. Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
