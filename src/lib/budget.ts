import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserAccountId } from "@/lib/account";
import { getCurrentYearMonth } from "@/lib/format";
import type { MonthlyBudget } from "@/lib/types";

/** Most recent non-closed (active or draft) budget; the calendar month is never consulted. */
export async function getWorkingBudget(
  supabase: SupabaseClient
): Promise<MonthlyBudget | null> {
  const accountId = await getUserAccountId();
  const { data } = await supabase
    .from("monthly_budgets")
    .select("*")
    .eq("account_id", accountId)
    .in("status", ["active", "draft"])
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as MonthlyBudget | null) ?? null;
}

/** True when the calendar month is later than the budget's month. */
export function isBudgetBehindCalendar(year: number, month: number): boolean {
  const now = getCurrentYearMonth();
  return now.year * 12 + now.month > year * 12 + month;
}

function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** String-prefix check on YYYY-MM-DD so no time zone parsing is involved. */
export function isDateInBudgetMonth(date: string, year: number, month: number): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date.startsWith(`${monthPrefix(year, month)}-`);
}

export function getBudgetDateBounds(year: number, month: number): { min: string; max: string } {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = monthPrefix(year, month);
  return { min: `${prefix}-01`, max: `${prefix}-${String(lastDay).padStart(2, "0")}` };
}

/** Today (America/Toronto) if it falls in the budget's month, otherwise the month's last day. */
export function getDefaultExpenseDate(year: number, month: number): string {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const { max } = getBudgetDateBounds(year, month);
  return isDateInBudgetMonth(today, year, month) ? today : max;
}

/** income - fixed - spent for a budget; negative means overdrawn. */
export async function getBudgetRemaining(
  supabase: SupabaseClient,
  budgetId: string
): Promise<number> {
  const [{ data: income }, { data: fixed }, { data: expenses }] = await Promise.all([
    supabase.from("income_entries").select("amount").eq("budget_id", budgetId),
    supabase.from("fixed_expenses").select("amount").eq("budget_id", budgetId),
    supabase.from("expenses").select("amount").eq("budget_id", budgetId),
  ]);
  const sum = (rows: { amount: number | string }[] | null) =>
    (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);
  return sum(income) - sum(fixed) - sum(expenses);
}

/** Recompute the next month's carried overdraft (draft/active only) after month `budgetId` changes. */
export async function syncNextMonthOverdraft(
  supabase: SupabaseClient,
  budgetId: string
): Promise<void> {
  const accountId = await getUserAccountId();

  const { data: budget } = await supabase
    .from("monthly_budgets")
    .select("year, month")
    .eq("id", budgetId)
    .single();
  if (!budget) return;

  const nextMonth = budget.month === 12 ? 1 : budget.month + 1;
  const nextYear = budget.month === 12 ? budget.year + 1 : budget.year;

  const { data: next } = await supabase
    .from("monthly_budgets")
    .select("id, overdraft_from_previous, overdraft_applied")
    .eq("account_id", accountId)
    .eq("year", nextYear)
    .eq("month", nextMonth)
    .in("status", ["draft", "active"])
    .maybeSingle();
  if (!next) return;

  const remaining = await getBudgetRemaining(supabase, budgetId);
  const overdraft = remaining < 0 ? Math.round(Math.abs(remaining) * 100) / 100 : 0;
  const previous = Number(next.overdraft_from_previous);
  if (overdraft === previous) return;

  // Keep the user's Apply choice unless the overdraft vanished or newly appeared.
  const applied = overdraft === 0 ? false : previous === 0 ? true : next.overdraft_applied;

  await supabase
    .from("monthly_budgets")
    .update({ overdraft_from_previous: overdraft, overdraft_applied: applied })
    .eq("id", next.id);
}
