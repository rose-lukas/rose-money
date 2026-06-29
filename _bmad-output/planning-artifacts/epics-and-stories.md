# Epics & Stories: Family Budget Tracker

## Epic 1: Project Foundation & Auth

Set up the project skeleton, database, authentication, and deployment pipeline.

### Story 1.1: Project Scaffolding
- Initialize Next.js 15 project with App Router and TypeScript
- Install and configure Tailwind CSS + shadcn/ui
- Set up project structure (folders, layouts, constants)
- Configure ESLint and Prettier
- **AC:** App runs locally with a blank page at `/`

### Story 1.2: Supabase Setup & Database Schema
- Create Supabase project
- Write and run SQL migrations for all tables (profiles, categories, monthly_budgets, income_entries, fixed_expenses, expenses)
- Apply Row Level Security policies
- Seed default categories
- Create 2 user accounts in Supabase Auth
- Create corresponding profile records
- **AC:** Database is provisioned with schema, RLS, seed data, and 2 auth accounts

### Story 1.3: Authentication Flow
- Install Supabase client libraries (`@supabase/supabase-js`, `@supabase/ssr`)
- Create Supabase client utilities (browser + server)
- Implement auth middleware (redirect unauthenticated users to login)
- Build login page (email/password form)
- Implement logout
- **AC:** Users can log in, stay logged in across page loads, and log out. Unauthenticated access redirects to login.

### Story 1.4: App Shell & Navigation
- Build responsive app layout (header, content area)
- Implement bottom navigation bar for mobile (Home, History, Add, Recap, Settings)
- Implement sidebar/hamburger navigation for desktop
- Add current user display and logout button
- **AC:** Navigation works on mobile and desktop, all routes are accessible

### Story 1.5: Vercel Deployment
- Push project to GitHub
- Connect repo to Vercel
- Configure environment variables
- Verify deployment and auth flow works on production URL
- **AC:** App is live on Vercel, login works, HTTPS enforced

---

## Epic 2: Monthly Budget Management

Create, configure, and manage monthly budget periods.

### Story 2.1: Monthly Budget Creation (Draft)
- Build "New Month" setup page
- Auto-populate income and fixed expenses from previous month (or seed data for first month)
- Auto-populate overdraft from previous month if applicable, with toggle to disable
- Allow editing all income/fixed expense line items (add, remove, change amounts)
- Save as "draft" status
- **AC:** User can create a new month pre-filled with carried-forward values and edit them

### Story 2.2: Monthly Budget Confirmation & Activation
- Add "Confirm & Activate" action to draft budget
- Calculate and display remaining budget (income − fixed expenses − overdraft)
- Set status to "active"
- Prevent creating a new month while current month is active (unless closing it first)
- **AC:** User reviews the summary, confirms, and the month becomes active for expense tracking

### Story 2.3: Month Closing
- Add "Close Month" action on active budgets
- Calculate final totals: total spent, remaining or overdraft
- Set status to "closed" (read-only)
- If overdraft, store the deficit amount for next month
- **AC:** Month can be closed, becomes read-only, overdraft is recorded for carry-forward

### Story 2.4: Budget Settings & Templates
- Settings page section for managing default income sources and fixed expenses
- Changes to defaults apply to *future* month creation (not retroactive)
- **AC:** User can update the template that populates new months

---

## Epic 3: Expense Tracking

Log, view, edit, and delete individual expenses.

### Story 3.1: Add Expense Form
- Build expense entry form with fields: Date (default today), Amount, Category (dropdown), Store (optional), Who (dropdown of 2 users), Description (optional)
- Validate required fields
- Save to database under the active month's budget
- Redirect to dashboard after save
- Mobile-optimized layout (large tap targets, numeric keyboard for amount)
- **AC:** User can log an expense in under 15 seconds on mobile; data persists correctly

### Story 3.2: Receipt Photo Upload
- Add receipt upload field to expense form (camera or file picker)
- Accept JPEG, PNG, WebP, HEIC; max 5MB
- Upload to Supabase Storage private bucket
- Display receipt thumbnail on expense detail
- **AC:** User can attach a photo, it uploads and displays on the expense entry

### Story 3.3: Expense List & Filtering
- Build expense list view for the current month
- Show: date, amount, category, store, who
- Filter by: category, who, date range
- Sort by: date (default newest first), amount
- **AC:** User can browse and filter all expenses for the current month

### Story 3.4: Edit & Delete Expenses
- Tap an expense to view full details (including receipt if present)
- Edit any field, save changes
- Delete with confirmation dialog
- Only available on active months (not closed)
- **AC:** Expenses can be edited and deleted; closed months are protected

---

## Epic 4: Dashboard & Weekly View

The main home screen showing budget status and weekly breakdown.

### Story 4.1: Budget Summary Card
- Display on dashboard: Total Income, Total Fixed Expenses, Total Variable Spending, Remaining Budget
- Color-code remaining: green (>30%), yellow (10-30%), red (<10% or negative)
- Update in real-time as expenses are added
- **AC:** Dashboard shows accurate, up-to-date budget summary

### Story 4.2: Weekly Spending Breakdown
- Calculate true calendar weeks (Mon–Sun) for the current month
- Display each week with:
  - Date range label (e.g., "Jun 23 – Jun 29")
  - List of expenses in that week
  - Week total
  - Running remaining budget
- Highlight current week
- **AC:** Expenses are correctly grouped by calendar week with running totals

### Story 4.3: Category Spending Chart
- Pie or donut chart showing spending by category for the current month
- Show percentage and dollar amount per category
- Interactive: tap a slice to see that category's expenses
- **AC:** Chart renders correctly and updates as expenses are added

### Story 4.4: Spending by Person
- Small summary showing how much each person has spent this month
- Optional breakdown on dashboard or as a tab
- **AC:** Per-person spending totals are accurate

---

## Epic 5: Historical Analysis

Month-over-month trends and searchable expense history.

### Story 5.1: Month-over-Month Comparison
- Line or bar chart showing total spending per month over time
- Show income and remaining budget trend lines
- Selectable date range (last 3/6/12 months, all time)
- **AC:** Chart renders with correct data for all closed months

### Story 5.2: Category Trends
- Stacked bar or area chart showing spending by category over time
- Filter to specific categories
- **AC:** User can see how category spending changes month to month

### Story 5.3: Running Average
- Calculate and display average monthly spending (total variable expenses ÷ number of closed months)
- Show on history page and optionally on dashboard
- **AC:** Average is accurate and updates as months are closed

### Story 5.4: Expense Search & History
- Full expense search across all months
- Filter by: month/date range, category, who, store (text search)
- Paginated results
- **AC:** User can find any past expense quickly

---

## Epic 6: Printable Monthly Recap

Generate rich, print-ready monthly summaries.

### Story 6.1: Recap Page Layout
- Build a dedicated recap page for any month (`/recap/2026/6`)
- Sections:
  - Header: Month/Year, date range
  - Income summary table
  - Fixed expenses summary table
  - Overdraft line (if applicable)
  - Remaining budget after fixed expenses
- **AC:** Recap page renders the top-level budget structure cleanly

### Story 6.2: Weekly & Category Breakdown in Recap
- Weekly breakdown section: each week with individual expense lines and subtotals
- Category summary table: each category with total, percentage of variable spending
- Spending by person summary
- **AC:** All spending details are present and accurate

### Story 6.3: Charts in Recap
- Category pie chart (print-friendly colors)
- Weekly spending bar chart
- End-of-month remaining / overdraft callout
- **AC:** Charts render in print and look clean on paper

### Story 6.4: Print Styling
- CSS `@media print` rules for clean paper output
- Hide navigation, buttons, non-essential UI
- Page break management (avoid splitting tables/charts across pages)
- "Print Recap" button that triggers `window.print()`
- **AC:** Pressing Print produces a clean, professional multi-page document

---

## Epic 7: Settings & Category Management

### Story 7.1: Category Management
- List all categories with drag-to-reorder
- Add new category
- Edit category name
- Deactivate category (hide from dropdown but keep historical data)
- **AC:** Categories are manageable; deactivated ones don't appear in new expense forms but old data is preserved

### Story 7.2: Profile Management
- Display names for both users
- Edit display name
- **AC:** User names can be customized and appear correctly throughout the app

---

## Implementation Order (Suggested Sprints)

| Sprint | Epics / Stories | Outcome |
|--------|----------------|---------|
| 1 | Epic 1 (all stories) | App deployed, auth working, empty shell |
| 2 | Epic 2 (Stories 2.1–2.3) | Monthly budget setup & lifecycle |
| 3 | Epic 3 (Stories 3.1–3.2) | Can log expenses with receipts |
| 4 | Epic 4 (all stories) | Dashboard with charts and weekly view |
| 5 | Epic 3 (Stories 3.3–3.4) + Epic 7 | Expense management, settings |
| 6 | Epic 5 (all stories) | Historical analysis |
| 7 | Epic 6 (all stories) | Printable recaps |
| 8 | Epic 2 (Story 2.4) + Polish | Template management, bug fixes, UX polish |
