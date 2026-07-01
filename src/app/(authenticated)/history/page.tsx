import { createClient } from "@/lib/supabase/server";
import { getBudgetSummaries } from "./actions";
import { HistoryCharts } from "@/components/history/history-charts";
import { RunningAverage } from "@/components/history/running-average";
import { ExpenseSearch } from "@/components/history/expense-search";
import { HistoryMonthDetail } from "@/components/history/month-detail";
import { formatCurrency } from "@/lib/format";

export default async function HistoryPage() {
  const supabase = await createClient();

  const [summaries, { data: categories }, { data: profiles }] = await Promise.all([
    getBudgetSummaries(),
    supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("profiles").select("id, display_name"),
  ]);

  // Stats
  const totalSpent = summaries.reduce((s, d) => s + d.spent, 0);
  const bestMonth = summaries.length
    ? summaries.reduce((best, d) => (d.remaining > best.remaining ? d : best), summaries[0])
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="mt-1 text-muted-foreground">
          Spending trends and expense search across all months.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <RunningAverage data={summaries} />
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Tracked</p>
          <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Variable expenses
          </p>
        </div>
        {bestMonth && (
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Best Month</p>
            <p className="text-2xl font-bold">
              {bestMonth.year}-{String(bestMonth.month).padStart(2, "0")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(bestMonth.remaining)} remaining
            </p>
          </div>
        )}
      </div>

      {/* Charts */}
      <HistoryCharts data={summaries} categories={categories ?? []} />

      {/* Month detail drill-down */}
      {summaries.length > 0 && (
        <HistoryMonthDetail
          summaries={summaries}
          categories={categories ?? []}
          profiles={profiles ?? []}
        />
      )}

      {/* Expense search */}
      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-base font-semibold">Expense Search</h2>
        <ExpenseSearch
          categories={categories ?? []}
          profiles={profiles ?? []}
        />
      </section>
    </div>
  );
}
