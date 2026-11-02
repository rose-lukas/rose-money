import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { getMonthName } from "@/lib/format";
import { getBudgetDateBounds, getDefaultExpenseDate, getWorkingBudget } from "@/lib/budget";
import { getUserAccountId } from "@/lib/account";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { year: yearParam, month: monthParam } = await searchParams;
  const supabase = await createClient();

  const year = parseInt(yearParam ?? "", 10);
  const month = parseInt(monthParam ?? "", 10);

  let budget: { id: string; year: number; month: number; status: string } | null = null;
  if (Number.isInteger(year) && Number.isInteger(month)) {
    const accountId = await getUserAccountId();
    const { data } = await supabase
      .from("monthly_budgets")
      .select("id, year, month, status")
      .eq("account_id", accountId)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();
    budget = data;
  }
  budget ??= await getWorkingBudget(supabase);

  if (!budget) {
    redirect("/money");
  }

  if (budget.status === "draft") {
    redirect(`/money/budget/${budget.id}`);
  }

  if (budget.status === "closed") {
    redirect(`/money/expenses?year=${budget.year}&month=${budget.month}`);
  }

  // Fetch categories and profiles
  const [{ data: categories }, { data: profiles }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("profiles").select("id, display_name"),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { min, max } = getBudgetDateBounds(budget.year, budget.month);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Add Expense - {getMonthName(budget.month)} {budget.year}
        </h1>
      </div>

      <ExpenseForm
        budgetId={budget.id}
        categories={categories ?? []}
        profiles={profiles ?? []}
        currentUserId={user?.id ?? ""}
        defaultDate={getDefaultExpenseDate(budget.year, budget.month)}
        minDate={min}
        maxDate={max}
      />
    </div>
  );
}
