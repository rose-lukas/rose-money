# Technical Architecture: Family Budget Tracker

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Vercel (Free Tier)                  │
│  ┌───────────────────────────────────────────┐   │
│  │         Next.js Application               │   │
│  │  ┌─────────────┐  ┌──────────────────┐    │   │
│  │  │   Pages /    │  │  API Routes      │    │   │
│  │  │   App Router │  │  (server-side)   │    │   │
│  │  └─────────────┘  └──────────────────┘    │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────┐
│              Supabase (Free Tier)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Auth     │  │ Postgres │  │ Storage      │   │
│  │ (2 users)│  │ (500MB)  │  │ (1GB files)  │   │
│  └──────────┘  └──────────┘  └──────────────┘   │
└──────────────────────────────────────────────────┘
```

## 2. Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Framework | Next.js 15 (App Router) | Full-stack React, SSR, API routes, Vercel-native |
| Language | TypeScript | Type safety for financial data |
| UI Components | shadcn/ui + Tailwind CSS | Clean, responsive, accessible components |
| Charts | Recharts | React-native charting, good print support |
| Database | Supabase PostgreSQL | Free tier, relational, Row Level Security |
| Auth | Supabase Auth | Built-in email/password, session management |
| File Storage | Supabase Storage | Receipt photo uploads, 1GB free |
| Hosting | Vercel | Free tier, zero-config Next.js deployment |
| Print | CSS @media print | Native browser print, no dependencies |

## 3. Database Schema

### 3.1 Tables

```sql
-- Managed by Supabase Auth
-- auth.users (id, email, encrypted_password, ...)

-- User profiles (extends auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Spending categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Monthly budget periods
CREATE TABLE monthly_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INT NOT NULL,
    month INT NOT NULL, -- 1-12
    status TEXT NOT NULL DEFAULT 'draft', -- draft | active | closed
    overdraft_from_previous DECIMAL(10,2) DEFAULT 0,
    overdraft_applied BOOLEAN DEFAULT true, -- user can toggle off
    notes TEXT,
    confirmed_by UUID REFERENCES profiles(id),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(year, month)
);

-- Income entries per month
CREATE TABLE income_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES monthly_budgets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,           -- e.g., "Salary", "Child Benefit"
    amount DECIMAL(10,2) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Fixed expense entries per month
CREATE TABLE fixed_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES monthly_budgets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,           -- e.g., "Mortgage & House Tax"
    amount DECIMAL(10,2) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    notes TEXT,                   -- e.g., "opt out if never under 4000"
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual variable expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES monthly_budgets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    store TEXT,                   -- optional vendor/store name
    description TEXT,             -- optional note
    spent_by UUID NOT NULL REFERENCES profiles(id),
    receipt_path TEXT,            -- Supabase storage path, nullable
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_expenses_budget_id ON expenses(budget_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_spent_by ON expenses(spent_by);
CREATE INDEX idx_monthly_budgets_year_month ON monthly_budgets(year, month);
```

### 3.2 Row Level Security

All tables enforce RLS so only authenticated users can access data. Since this is a private household app with exactly 2 users who share everything, policies are simple:

```sql
-- All authenticated users can read/write all rows
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access" ON profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- Same pattern for all other tables
```

### 3.3 Seed Data — Default Categories

```
Groceries, Gas, Dining, Entertainment, Medical, Clothing,
Kids, Household, Transportation, House Improvement, Other
```

### 3.4 Seed Data — Default Income & Fixed Expense Templates

On first setup, pre-populate from the current Word document values:

**Income:**
- Salary: $5,465.00
- Child Benefit: $391.33

**Fixed Expenses:**
- Mortgage & House Tax: $2,783.96
- Auto & Home Insurance: $297.43
- POTL Payment: $153.83
- School Debt: $504.21
- WiFi: $50.85
- Koodo (Phone): $60.63
- Scotiabank Fee: $16.95
- Church: $100.00

## 4. Application Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, auth provider
│   ├── page.tsx                # Redirect to dashboard or login
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── dashboard/
│   │   └── page.tsx            # Main monthly dashboard
│   ├── expenses/
│   │   ├── page.tsx            # Expense list/history
│   │   └── new/
│   │       └── page.tsx        # Add expense form
│   ├── budget/
│   │   ├── page.tsx            # Monthly budget setup
│   │   └── [id]/
│   │       └── page.tsx        # Edit specific month
│   ├── history/
│   │   └── page.tsx            # Historical trends & charts
│   ├── recap/
│   │   └── [year]/
│   │       └── [month]/
│   │           └── page.tsx    # Printable month recap
│   └── settings/
│       └── page.tsx            # Manage categories, profiles
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/
│   │   ├── header.tsx          # App header + nav
│   │   ├── mobile-nav.tsx      # Bottom nav for mobile
│   │   └── auth-guard.tsx      # Redirect if not logged in
│   ├── dashboard/
│   │   ├── budget-summary.tsx  # Income - Fixed - Remaining
│   │   ├── weekly-breakdown.tsx# Weekly spending periods
│   │   ├── category-chart.tsx  # Pie chart by category
│   │   └── spending-chart.tsx  # Bar chart by week
│   ├── expenses/
│   │   ├── expense-form.tsx    # Add/edit expense form
│   │   ├── expense-list.tsx    # Filterable expense table
│   │   └── receipt-upload.tsx  # Image upload component
│   ├── budget/
│   │   ├── month-setup.tsx     # New month wizard
│   │   ├── income-editor.tsx   # Edit income lines
│   │   └── fixed-expense-editor.tsx
│   ├── history/
│   │   ├── trend-chart.tsx     # Month-over-month line chart
│   │   └── category-trend.tsx  # Category spending over time
│   └── recap/
│       └── print-recap.tsx     # Print-optimized layout
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server-side Supabase client
│   │   └── middleware.ts       # Auth middleware
│   ├── utils.ts                # Formatting, date helpers
│   ├── types.ts                # TypeScript interfaces
│   └── constants.ts            # Default categories, etc.
└── hooks/
    ├── use-budget.ts           # Current month budget data
    ├── use-expenses.ts         # Expense CRUD operations
    └── use-categories.ts       # Category management
```

## 5. Key Screens (Mobile-First)

### 5.1 Dashboard (Home)

```
┌──────────────────────────┐
│  June 2026          [☰]  │
├──────────────────────────┤
│  Income        $5,856.33 │
│  Fixed        −$3,967.86 │
│  Spent        −$  823.40 │
│  ─────────────────────── │
│  Remaining     $1,065.07 │
├──────────────────────────┤
│  ┌──────────────────┐    │
│  │ [Category Chart] │    │
│  └──────────────────┘    │
├──────────────────────────┤
│  This Week (Jun 23-29)   │
│  · Costco   Groc  $142  │
│  · Shell    Gas    $65  │
│  · ...                   │
│  Week Total: $207        │
├──────────────────────────┤
│  [＋ Add Expense]        │
├──────────────────────────┤
│  🏠    📊    ➕    📋    ⚙ │
│ Home  Hist  Add  Recap  Set│
└──────────────────────────┘
```

### 5.2 Add Expense (Quick-Add)

```
┌──────────────────────────┐
│  ← Add Expense           │
├──────────────────────────┤
│  Date     [Jun 29, 2026] │
│  Amount   [$           ] │
│  Category [Groceries  ▾] │
│  Store    [            ] │
│  Who      [Me         ▾] │
│  Notes    [            ] │
│  Receipt  [📷 Upload   ] │
│                          │
│  [     Save Expense    ] │
└──────────────────────────┘
```

## 6. Weekly Period Logic

Weeks are calculated as true calendar weeks (Monday–Sunday). A month's weeks are all weeks that contain at least one day of that month:

```typescript
function getWeeksForMonth(year: number, month: number): Week[] {
  // Week 1: 1st of month → first Sunday
  // Week 2-N: Monday → Sunday
  // Last week: last Monday → last day of month
  // Expenses are assigned to weeks based on their date
}
```

## 7. Month Lifecycle

```
┌─────────┐    User confirms    ┌────────┐    Month ends     ┌────────┐
│  DRAFT  │ ──────────────────► │ ACTIVE │ ────────────────► │ CLOSED │
└─────────┘                     └────────┘                   └────────┘
     │                               │                            │
     │ Auto-created from             │ Expenses can be            │ Read-only
     │ previous month template       │ added/edited/deleted       │ Printable recap
     │ Overdraft auto-populated      │                            │ Overdraft calculated
```

## 8. Receipt Storage

- Receipts uploaded to Supabase Storage bucket `receipts`
- Path format: `receipts/{budget_id}/{expense_id}.{ext}`
- Accepted formats: JPEG, PNG, WebP, HEIC
- Max file size: 5MB
- Images served via Supabase signed URLs (private bucket)

## 9. Deployment

### Vercel
- Connect GitHub repo → auto-deploy on push to `main`
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Custom domain optional (free with Vercel)

### Supabase
- Project created via Supabase dashboard
- Schema migrations managed via Supabase CLI
- RLS policies applied via migrations
- 2 user accounts created manually in Supabase Auth dashboard

## 10. Security

| Concern | Mitigation |
|---------|-----------|
| Authentication | Supabase Auth with email/password, JWT tokens |
| Authorization | Row Level Security on all tables |
| Data in transit | HTTPS enforced by Vercel + Supabase |
| Data at rest | Supabase encrypts at rest by default |
| Receipt access | Private storage bucket, signed URLs only |
| No public registration | No sign-up page; accounts created manually |
| Input validation | Server-side validation on all mutations |
| CSRF | Supabase client handles via JWT (no cookies) |

## 11. Free Tier Limits (Comfortable Margins)

| Resource | Free Limit | Expected Usage |
|----------|-----------|----------------|
| Supabase DB | 500 MB | ~5 MB/year (text data) |
| Supabase Storage | 1 GB | ~200 MB/year (receipts) |
| Supabase Auth | 50,000 MAU | 2 users |
| Supabase API | Unlimited | ~1,000 req/month |
| Vercel Bandwidth | 100 GB/month | < 1 GB/month |
| Vercel Serverless | 100 GB-hours | Minimal usage |
