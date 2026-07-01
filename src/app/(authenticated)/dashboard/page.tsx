import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getMonthName, getWeeksForMonth } from "@/lib/format";
import { CreateBudgetButton } from "@/components/budget/create-budget-button";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { WeeklyBreakdown } from "@/components/dashboard/weekly-breakdown";
import { MobileHero } from "@/components/dashboard/mobile-hero";
import Link from "next/link";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

// Note: getGreeting() on server uses UTC; mobile hero computes its own client-side greeting.

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Fetch user profile for greeting
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();
  const firstName = (profile?.display_name ?? "").split(" ")[0] || "there";

  // Get the budget for current month
  const { data: budget } = await supabase
    .from("monthly_budgets")
    .select("*")
    .eq("year", year)
    .eq("month", month)
    .single();

  if (!budget) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {getMonthName(month)} {year}
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-8 text-center space-y-4">
          <h2 className="text-lg font-semibold">No budget for this month</h2>
          <p className="text-sm text-muted-foreground">
            Set up your monthly budget to start tracking expenses.
          </p>
          <CreateBudgetButton year={year} month={month} />
        </div>
      </div>
    );
  }

  // Fetch income, fixed expenses, variable expenses, categories, and profiles
  const [
    { data: incomeEntries },
    { data: fixedExpenses },
    { data: expenses },
    { data: categories },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("income_entries")
      .select("amount")
      .eq("budget_id", budget.id),
    supabase
      .from("fixed_expenses")
      .select("amount")
      .eq("budget_id", budget.id),
    supabase
      .from("expenses")
      .select("id, amount, date, category_id, store, spent_by, description")
      .eq("budget_id", budget.id)
      .order("date", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order"),
    supabase
      .from("profiles")
      .select("id, display_name"),
  ]);

  const totalIncome = (incomeEntries ?? []).reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const totalFixed = (fixedExpenses ?? []).reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const overdraft = budget.overdraft_applied
    ? Number(budget.overdraft_from_previous)
    : 0;
  const totalSpent = (expenses ?? []).reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const remaining = totalIncome - totalFixed - overdraft - totalSpent;
  const budgetAfterFixed = totalIncome - totalFixed - overdraft;
  const spentPercent =
    budgetAfterFixed > 0 ? (totalSpent / budgetAfterFixed) * 100 : 0;

  // Build lookup maps
  const categoryMap = new Map(
    (categories ?? []).map((c) => [c.id, c.name])
  );
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name])
  );

  // Calculate weeks for this month
  const weeks = getWeeksForMonth(year, month);

  return (
    <div className="space-y-5">

      {/* ─── MOBILE HERO ─── */}
      <MobileHero
        firstName={firstName}
        monthName={getMonthName(month)}
        remaining={remaining}
        totalSpent={totalSpent}
        budgetAfterFixed={budgetAfterFixed}
        spentPercent={spentPercent}
        totalIncome={totalIncome}
        totalFixed={totalFixed}
        totalFixedWithOverdraft={totalFixed + overdraft}
        budgetId={budget.id}
      />

      {/* ─── DESKTOP VIEW ─── */}
      <div className="hidden sm:block space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{getGreeting()}, {firstName}</p>
            <h1 className="text-2xl font-bold tracking-tight">
              {getMonthName(month)} {year}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/expenses/new"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              + Add Expense
            </Link>
            <Link
              href={`/recap/${year}/${month}`}
              className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Recap
            </Link>
            <Link
              href={`/budget/${budget.id}`}
              className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {budget.status === "draft" ? "Setup" : "Budget"}
            </Link>
          </div>
        </div>

        {budget.status === "draft" && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 p-4 text-sm">
            Your budget is still in <strong>draft</strong> mode.{" "}
            <Link href={`/budget/${budget.id}`} className="underline font-medium">
              Review and activate it
            </Link>{" "}
            to start tracking expenses.
          </div>
        )}

        {/* Hero card */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-5">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Remaining Budget
            </p>
            <p
              className={`text-4xl font-extrabold tracking-tight mt-1 ${
                remaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(remaining)}
            </p>

            {budgetAfterFixed > 0 && (
              <div className="mt-3 mx-auto max-w-xs">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      spentPercent > 90
                        ? "bg-red-500"
                        : spentPercent > 70
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(spentPercent, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {formatCurrency(totalSpent)} of {formatCurrency(budgetAfterFixed)} spent ({Math.round(spentPercent)}%)
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Income</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fixed</p>
              <p className="text-sm font-bold text-muted-foreground">{formatCurrency(totalFixed + overdraft)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Spent</p>
              <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>

        {/* Charts & Weekly Breakdown */}
        {(expenses ?? []).length > 0 && (
          <>
            <CategoryChart
              expenses={(expenses ?? []).map((e) => ({
                amount: Number(e.amount),
                categoryName: categoryMap.get(e.category_id) ?? "Unknown",
              }))}
            />

            <WeeklyBreakdown
              weeks={weeks}
              expenses={(expenses ?? []).map((e) => ({
                id: e.id,
                date: e.date,
                amount: Number(e.amount),
                store: e.store,
                categoryName: categoryMap.get(e.category_id) ?? "Unknown",
              }))}
              budgetAfterFixed={budgetAfterFixed}
            />
          </>
        )}

        {/* Recent expenses */}
        {(expenses ?? []).length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent Expenses</h2>
              <Link href="/expenses" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all →
              </Link>
            </div>
            <div className="rounded-xl border divide-y">
              {(expenses ?? []).slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex justify-between items-center px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {expense.store || categoryMap.get(expense.category_id) || "Expense"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                      {" · "}{categoryMap.get(expense.category_id) ?? ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums ml-3">
                    {formatCurrency(Number(expense.amount))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          budget.status === "active" && (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">No expenses yet this month.</p>
              <Link
                href="/expenses/new"
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                Add your first expense →
              </Link>
            </div>
          )
        )}
      </div>
    </div>
  );
}
