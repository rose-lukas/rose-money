import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BudgetSetupForm } from "@/components/budget/budget-setup-form";
import { BudgetMonthSelector } from "@/components/budget/budget-month-selector";
import { recalculateOverdraft } from "@/app/(authenticated)/budget/actions";

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: budget, error } = await supabase
    .from("monthly_budgets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !budget) {
    redirect("/dashboard");
  }

  // Auto-recalculate overdraft if it's 0 and budget isn't closed
  if (Number(budget.overdraft_from_previous) === 0 && budget.status !== "closed") {
    await recalculateOverdraft(id);
    // Re-fetch budget after recalculation
    const { data: updatedBudget } = await supabase
      .from("monthly_budgets")
      .select("*")
      .eq("id", id)
      .single();
    if (updatedBudget) {
      Object.assign(budget, updatedBudget);
    }
  }

  const { data: incomeEntries } = await supabase
    .from("income_entries")
    .select("*")
    .eq("budget_id", id)
    .order("sort_order");

  const { data: fixedExpenses } = await supabase
    .from("fixed_expenses")
    .select("*")
    .eq("budget_id", id)
    .order("sort_order");

  const monthName = new Date(budget.year, budget.month - 1).toLocaleString(
    "en-CA",
    { month: "long", year: "numeric" }
  );

  // Fetch all budgets for month selector
  const { data: allBudgets } = await supabase
    .from("monthly_budgets")
    .select("id, year, month, status")
    .in("status", ["active", "closed", "draft"])
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Budget: {monthName}
          </h1>
          <p className="text-muted-foreground">
            Review and adjust your monthly budget.
          </p>
        </div>
        <BudgetMonthSelector
          budgets={allBudgets ?? []}
          selectedId={id}
        />
      </div>

      <BudgetSetupForm
        budget={budget}
        incomeEntries={incomeEntries ?? []}
        fixedExpenses={fixedExpenses ?? []}
      />
    </div>
  );
}
