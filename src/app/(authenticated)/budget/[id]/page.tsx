import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BudgetSetupForm } from "@/components/budget/budget-setup-form";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Budget Setup: {monthName}
        </h1>
        <p className="text-muted-foreground">
          Review and adjust your monthly budget before activating.
        </p>
      </div>

      <BudgetSetupForm
        budget={budget}
        incomeEntries={incomeEntries ?? []}
        fixedExpenses={fixedExpenses ?? []}
      />
    </div>
  );
}
