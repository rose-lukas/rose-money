import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { RecapView } from "@/components/recap/recap-view";

interface Props {
  params: Promise<{ year: string; month: string }>;
}

export default async function RecapPage({ params }: Props) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    notFound();
  }

  const supabase = await createClient();

  // Fetch the budget for this month
  const { data: budget } = await supabase
    .from("monthly_budgets")
    .select("*")
    .eq("year", year)
    .eq("month", month)
    .in("status", ["active", "closed"])
    .single();

  if (!budget) notFound();

  // Fetch all related data in parallel
  const [
    { data: incomeEntries },
    { data: fixedExpenses },
    { data: expenses },
    { data: categories },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("income_entries")
      .select("*")
      .eq("budget_id", budget.id)
      .order("sort_order"),
    supabase
      .from("fixed_expenses")
      .select("*")
      .eq("budget_id", budget.id)
      .order("sort_order"),
    supabase
      .from("expenses")
      .select("*")
      .eq("budget_id", budget.id)
      .order("date"),
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order"),
    supabase.from("profiles").select("id, display_name"),
  ]);

  const totalIncome = (incomeEntries ?? []).reduce(
    (s, i) => s + Number(i.amount),
    0
  );
  const totalFixed = (fixedExpenses ?? []).reduce(
    (s, f) => s + Number(f.amount),
    0
  );
  const totalSpent = (expenses ?? []).reduce(
    (s, e) => s + Number(e.amount),
    0
  );
  const overdraft = budget.overdraft_applied
    ? Number(budget.overdraft_from_previous)
    : 0;
  const variableBudget = totalIncome - totalFixed - overdraft;
  const remaining = variableBudget - totalSpent;

  // Category map
  const catMap: Record<string, string> = {};
  (categories ?? []).forEach((c) => (catMap[c.id] = c.name));

  // Profile map
  const profileMap: Record<string, string> = {};
  (profiles ?? []).forEach((p) => (profileMap[p.id] = p.display_name));

  // Category breakdown
  const byCategory: Record<string, number> = {};
  (expenses ?? []).forEach((e) => {
    const name = catMap[e.category_id] ?? "Other";
    byCategory[name] = (byCategory[name] || 0) + Number(e.amount);
  });

  // Sort categories by amount descending
  const categoryBreakdown = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      name,
      amount,
      pct: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    }));

  return (
    <RecapView
      year={year}
      month={month}
      status={budget.status}
      incomeEntries={(incomeEntries ?? []).map((i) => ({
        name: i.name,
        amount: Number(i.amount),
      }))}
      fixedExpenses={(fixedExpenses ?? []).map((f) => ({
        name: f.name,
        amount: Number(f.amount),
        notes: f.notes,
      }))}
      expenses={(expenses ?? []).map((e) => ({
        date: e.date,
        amount: Number(e.amount),
        category: catMap[e.category_id] ?? "Other",
        store: e.store,
        description: e.description,
        spentBy: profileMap[e.spent_by] ?? "Unknown",
      }))}
      totalIncome={totalIncome}
      totalFixed={totalFixed}
      overdraft={overdraft}
      variableBudget={variableBudget}
      totalSpent={totalSpent}
      remaining={remaining}
      categoryBreakdown={categoryBreakdown}
    />
  );
}
