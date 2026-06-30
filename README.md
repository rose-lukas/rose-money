# Rose Money

A mobile-first monthly budget and expense tracker built for two people to share. Replaces the old Word document budget system with a sleek web app.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Supabase** (Auth, PostgreSQL with RLS, Storage for receipts & avatars)
- **Tailwind CSS v4** + **shadcn/ui**
- **Recharts** for dashboard & history charts
- **Vercel** (free Hobby tier)

## Features

- Shared monthly budgets with income, fixed expenses, and discretionary spending
- Animated mobile dashboard with greeting, remaining budget, and spending stats
- Add expenses with category, store, who spent, notes, and receipt photo
- Negative expense amounts for returns/refunds
- Expense history with search, category trends, and monthly comparison charts
- Print-ready monthly recap with pie chart and breakdown tables
- Settings: manage categories, user profiles, avatars, and password changes
- Dark/light/system theme toggle
- iOS home screen app with custom icon

## Getting Started

### Prerequisites

- Node.js 22.x
- A Supabase project

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/rose-lukas/rose-money.git
   cd rose-money
   npm install
   ```

2. Create `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Run the migrations in `supabase/migrations/` against your Supabase database.

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Deployment

Deployed on Vercel. Push to `main` triggers automatic builds.

After deploying, set your Vercel URL as the **Site URL** and **Redirect URL** in Supabase → Authentication → URL Configuration.
