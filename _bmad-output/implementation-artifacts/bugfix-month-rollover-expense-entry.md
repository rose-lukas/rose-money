# Story: Month Rollover Must Not Block or Misfile Expenses

**Type:** Bug fix + small feature (reopen month)
**Epic:** 2 (Monthly Budget Management) / 3 (Expense Tracking)
**Status:** review
**Owner:** Amelia (dev) | **Author:** John (PM)

## Problem

On the 1st of a new month, the user can no longer add late expenses to the previous month. Selecting "October" on the Expenses page and tapping "+ Add" files the expense under November.

Example: it is Nov 2, user selects October, adds an expense dated Oct 29, and it appears in November.

## User Value

The user routinely enters the last few expenses of a month after the month ends. Month transitions must be a deliberate user action, and any past month must stay reachable for entry and edits.

## Root Cause (verified in code)

There is no automatic close. `closeBudget` is only called from the manual "Close Month" button. The defect is that "current month" is derived from the calendar everywhere, and the selected month is dropped when adding an expense.

1. [src/app/(rose)/money/expenses/page.tsx](../../src/app/(rose)/money/expenses/page.tsx): the "+ Add" link is a bare `/money/expenses/new`. The month chosen in the selector is not passed.
2. [src/app/(rose)/money/expenses/new/page.tsx](../../src/app/(rose)/money/expenses/new/page.tsx): resolves the budget via `getCurrentYearMonth()` (calendar month, America/Toronto). On Nov 1 this means:
   - November budget exists: the expense is saved to November (the reported symptom).
   - November budget does not exist: redirects to `/money`, so adding is impossible (perceived as "auto-closed").
3. [src/app/(rose)/money/page.tsx](../../src/app/(rose)/money/page.tsx) and [src/app/(rose)/money/budget/page.tsx](../../src/app/(rose)/money/budget/page.tsx): also key off the calendar month. On Nov 1 the dashboard shows "No budget for this month" while October is still `active`, which reads as October having closed.
4. [src/app/(rose)/money/expenses/actions.ts](../../src/app/(rose)/money/expenses/actions.ts): `addExpense` accepts any `date` regardless of the budget's month, and rejects non-`active` budgets with no way back.
5. There is no "reopen" action. `closeBudget` is one-way (`active` to `closed`), and edit/delete is gated on `active`.

## Acceptance Criteria

### Month lifecycle is manual
- **AC1:** No code path changes a budget's status based on the date. A month stays `active` until the user presses "Close Month".
- **AC2:** The dashboard (`/money`) and `/money/budget` show the most recent non-closed (`active` or `draft`) budget as the current month, not the calendar month. The "No budget for this month / Create" prompt only appears when no non-closed budget exists. When a non-closed budget exists for a month older than the calendar month, show a non-blocking hint such as "It's November. Start the November budget when you're ready."
- **AC3:** Creating the next month does not close the previous one. Both can be `active` at once.

### Adding an expense targets the selected month
- **AC4:** On Expenses, "+ Add" navigates to `/money/expenses/new?year=YYYY&month=M` for the selected budget. `new/page.tsx` resolves the budget from those params and falls back to the current-month logic from AC2 when absent.
- **AC5:** The new-expense form's default date is today if today falls in the budget's month. Otherwise it is the last day of that month. The form's `date` input gets `min`/`max` for the budget's month.
- **AC6:** `addExpense` validates server-side that `date` falls within the budget's `year`/`month` and returns a clear error if not. The budget is always the one passed in `budget_id`, never inferred from the date or the clock.
- **AC7:** The "Add Expense" page header shows the target month (e.g. "Add Expense - October 2026") so it is unmistakable.
- **Repro AC:** On Nov 2 with an active October budget, select October, add an expense dated Oct 29, and it appears under October and not November.

### Reopen a closed month
- **AC8:** A closed budget shows a "Reopen Month" action (budget detail page and the Expenses page for the selected closed month). It sets `closed` to `active` via a new `reopenBudget(budgetId)` server action, guarded with `.eq("status", "closed")` and `revalidatePath` for `/money`, `/money/expenses`, `/money/history`.
- **AC9:** Once reopened, "+ Add", edit and delete work for that month. "Close Month" is available again.
- **AC10:** Reopening is allowed for any closed month, regardless of whether later months exist. A brief confirm step is acceptable ("Reopen October 2026?").

### Carry-forward stays correct
- **AC11:** When an expense is added or deleted in month M and month M+1 exists with status `draft` or `active`, M+1's `overdraft_from_previous` is recomputed (income - fixed - spent for M; overdraft is the positive deficit, else 0). Preserve the user's `overdraft_applied` choice, except set it to false when the overdraft becomes 0. Do not touch `closed` months.

### Regression
- **AC12:** Existing flows still work: create budget, confirm, close, delete expense, history, and recap pages. Closed months remain read-only until reopened.

## Dev Notes

- Reuse the `getCurrentYearMonth()` helper for the fallback only. Add a small shared helper (for example `getWorkingBudget(supabase)` in `src/lib/`) that returns the latest `active`/`draft` budget, used by `/money`, `/money/budget` and `/money/expenses/new`. Do not duplicate the query in three places.
- `searchParams` is a `Promise` in this Next 16 codebase. Follow the existing pattern in `expenses/page.tsx`.
- The existing `recalculateOverdraft` only raises the amount when remaining is negative, and is only invoked when the stored overdraft is 0. AC11 needs a symmetric recompute, so extract the shared calculation rather than copy-pasting the third copy in `budget/actions.ts`.
- Time zone: the server runs in UTC, so compare against America/Toronto only for the default-date logic in AC5. Month-membership validation (AC6) uses the date string's `YYYY-MM` prefix with no `Date` parsing.
- Multi-account: scope budget queries by account the way `budget/actions.ts` does (`getUserAccountId`). Check that the expense-page queries are covered by RLS (migration 003).
- No DB migration is expected. The `status` check constraint already allows `closed` to `active`.

## Out of Scope

- Auto-prompting or reminding the user to close a month (the AC2 hint is enough).
- Allowing expense entry on a closed month without reopening.
- Changing the weekly/category chart logic.

## Test Plan

1. With October `active` and no November budget on Nov 2: dashboard shows October (AC2), October + Add opens October (AC4/7), and an Oct 29 expense lands in October (Repro AC).
2. Create the November draft and confirm it. October remains `active` (AC3). Select October, add an expense, and it lands in October. Select November, add an expense, and it lands in November.
3. Try submitting an Oct date to the November budget (hand-crafted request) and expect an error (AC6).
4. Close October, then Reopen it. Add and delete work again (AC8/9).
5. With an overdrawn October and a November draft, add an October expense and confirm the November overdraft updates (AC11).
6. Run `npm run lint` and `npm run build`.
