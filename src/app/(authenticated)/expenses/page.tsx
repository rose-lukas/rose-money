import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";

export default async function ExpensesPage() {
  const supabase = await createClient();

  const now = new Date();

  // Get active or most recent budget
  const { data: budget } = await supabase
    .from("monthly_budgets")
    .select("id, year, month, status")
    .or("status.eq.active,status.eq.draft")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1)
    .single();

  if (!budget) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <p className="mt-2 text-muted-foreground">No active budget found.</p>
      </div>
    );
  }

  // Fetch expenses with category and profile info
  const { data: expenses } = await supabase
    .from("expenses")
    .select(
      `
      id, date, amount, store, description, receipt_path,
      categories(name),
      profiles(display_name)
    `
    )
    .eq("budget_id", budget.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const monthName = new Date(budget.year, budget.month - 1).toLocaleString(
    "en-CA",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">{monthName}</p>
        </div>
        {budget.status === "active" && (
          <Link
            href="/expenses/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Add
          </Link>
        )}
      </div>

      {(expenses ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {(expenses ?? []).map((expense) => {
            const category = (expense.categories as unknown as { name: string })?.name ?? "Unknown";
            const spentByName = (expense.profiles as unknown as { display_name: string })?.display_name ?? "Unknown";

            return (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {expense.store || category}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                      {category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(expense.date).toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span>·</span>
                    <span>{spentByName}</span>
                    {expense.description && (
                      <>
                        <span>·</span>
                        <span className="truncate">{expense.description}</span>
                      </>
                    )}
                    {expense.receipt_path && <span>📎</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm font-medium whitespace-nowrap">
                    {formatCurrency(Number(expense.amount))}
                  </span>
                  {budget.status === "active" && (
                    <DeleteExpenseButton id={expense.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
