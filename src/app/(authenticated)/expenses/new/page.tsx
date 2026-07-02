import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function NewExpensePage() {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Get the current month's budget (active or draft)
  const { data: budget } = await supabase
    .from("monthly_budgets")
    .select("id, year, month, status")
    .eq("year", year)
    .eq("month", month)
    .single();

  if (!budget) {
    redirect("/dashboard");
  }

  if (budget.status === "draft") {
    redirect(`/budget/${budget.id}`);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Expense</h1>
      </div>

      <ExpenseForm
        budgetId={budget.id}
        categories={categories ?? []}
        profiles={profiles ?? []}
        currentUserId={user?.id ?? ""}
        defaultDate={now.toISOString().split("T")[0]}
      />
    </div>
  );
}
