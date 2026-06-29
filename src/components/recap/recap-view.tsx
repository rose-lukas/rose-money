"use client";

import { formatCurrency, getMonthName, getWeeksForMonth } from "@/lib/format";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ExpenseItem {
  date: string;
  amount: number;
  category: string;
  store: string | null;
  description: string | null;
  spentBy: string;
}

interface Props {
  year: number;
  month: number;
  status: string;
  incomeEntries: { name: string; amount: number }[];
  fixedExpenses: { name: string; amount: number; notes: string | null }[];
  expenses: ExpenseItem[];
  totalIncome: number;
  totalFixed: number;
  overdraft: number;
  variableBudget: number;
  totalSpent: number;
  remaining: number;
  categoryBreakdown: { name: string; amount: number; pct: number }[];
}

const PIE_COLORS = [
  "#3b82f6", "#f97316", "#22c55e", "#a855f7", "#ec4899",
  "#14b8a6", "#eab308", "#6366f1", "#f43f5e", "#06b6d4",
  "#84cc16", "#d946ef",
];

export function RecapView(props: Props) {
  const {
    year, month, status,
    incomeEntries, fixedExpenses, expenses,
    totalIncome, totalFixed, overdraft, variableBudget,
    totalSpent, remaining, categoryBreakdown,
  } = props;

  const monthName = getMonthName(month);
  const weeks = getWeeksForMonth(year, month);

  // Attach expenses to weeks
  const weeksWithExpenses = weeks.map((w) => {
    const weekExpenses = expenses.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return d >= w.start && d <= w.end;
    });
    const total = weekExpenses.reduce((s, e) => s + e.amount, 0);
    return { ...w, expenses: weekExpenses, total };
  });

  const weeklyChartData = weeksWithExpenses.map((w, i) => ({
    label: `Week ${i + 1}`,
    total: w.total,
  }));

  const fmtDate = (d: string) =>
    new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" }).format(
      new Date(d + "T00:00:00")
    );

  return (
    <div className="recap-page space-y-6 max-w-3xl mx-auto">
      {/* Print button - hidden in print */}
      <div className="print:hidden flex justify-end">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Print Recap
        </button>
      </div>

      {/* Header */}
      <header className="text-center border-b pb-4">
        <h1 className="text-3xl font-bold">
          {monthName} {year}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monthly Budget Recap
          {status === "active" && " (In Progress)"}
        </p>
      </header>

      {/* Budget Summary */}
      <section className="avoid-break">
        <h2 className="text-lg font-semibold border-b pb-1 mb-3">Budget Summary</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <span>Total Income</span>
          <span className="text-right font-medium">{formatCurrency(totalIncome)}</span>
          <span>Total Fixed Expenses</span>
          <span className="text-right font-medium text-red-600">
            -{formatCurrency(totalFixed)}
          </span>
          {overdraft > 0 && (
            <>
              <span>Previous Month Overdraft</span>
              <span className="text-right font-medium text-red-600">
                -{formatCurrency(overdraft)}
              </span>
            </>
          )}
          <span className="font-semibold border-t pt-1">Variable Budget</span>
          <span className="text-right font-bold border-t pt-1">
            {formatCurrency(variableBudget)}
          </span>
          <span>Total Variable Spending</span>
          <span className="text-right font-medium text-orange-600">
            -{formatCurrency(totalSpent)}
          </span>
          <span className="font-semibold border-t pt-1">Remaining</span>
          <span
            className={`text-right font-bold border-t pt-1 ${
              remaining >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(remaining)}
          </span>
        </div>
      </section>

      {/* Income */}
      <section className="avoid-break">
        <h2 className="text-lg font-semibold border-b pb-1 mb-3">Income</h2>
        <table className="w-full text-sm">
          <tbody>
            {incomeEntries.map((i, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-1">{i.name}</td>
                <td className="py-1 text-right font-medium">{formatCurrency(i.amount)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-1 pt-2">Total</td>
              <td className="py-1 pt-2 text-right">{formatCurrency(totalIncome)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Fixed Expenses */}
      <section className="avoid-break">
        <h2 className="text-lg font-semibold border-b pb-1 mb-3">Fixed Expenses</h2>
        <table className="w-full text-sm">
          <tbody>
            {fixedExpenses.map((f, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-1">
                  {f.name}
                  {f.notes && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({f.notes})
                    </span>
                  )}
                </td>
                <td className="py-1 text-right font-medium">{formatCurrency(f.amount)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-1 pt-2">Total</td>
              <td className="py-1 pt-2 text-right">{formatCurrency(totalFixed)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Charts row */}
      <section className="avoid-break">
        <h2 className="text-lg font-semibold border-b pb-1 mb-3">Spending Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category Pie */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-center">By Category</h3>
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                    fontSize={10}
                  >
                    {categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No expenses
              </p>
            )}
          </div>

          {/* Weekly Bar */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-center">By Week</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyChartData}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="total" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Category breakdown table */}
      <section className="avoid-break">
        <h2 className="text-lg font-semibold border-b pb-1 mb-3">
          Category Breakdown
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-1 font-medium">Category</th>
              <th className="py-1 text-right font-medium">Amount</th>
              <th className="py-1 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {categoryBreakdown.map((c) => (
              <tr key={c.name} className="border-b last:border-0">
                <td className="py-1">{c.name}</td>
                <td className="py-1 text-right font-medium">
                  {formatCurrency(c.amount)}
                </td>
                <td className="py-1 text-right text-muted-foreground">
                  {c.pct.toFixed(1)}%
                </td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-1 pt-2">Total</td>
              <td className="py-1 pt-2 text-right">{formatCurrency(totalSpent)}</td>
              <td className="py-1 pt-2 text-right">100%</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Weekly breakdown with expense lines */}
      <section>
        <h2 className="text-lg font-semibold border-b pb-1 mb-3">
          Weekly Breakdown
        </h2>
        {weeksWithExpenses.map((w, i) => (
          <div key={i} className="mb-4 avoid-break">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-sm font-semibold">
                Week {i + 1}: {w.label}
              </h3>
              <span className="text-sm font-bold">{formatCurrency(w.total)}</span>
            </div>
            {w.expenses.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-0.5">Date</th>
                    <th className="py-0.5">Store/Description</th>
                    <th className="py-0.5">Category</th>
                    <th className="py-0.5">Who</th>
                    <th className="py-0.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {w.expenses.map((e, j) => (
                    <tr key={j} className="border-b last:border-0">
                      <td className="py-0.5">{fmtDate(e.date)}</td>
                      <td className="py-0.5">{e.store || e.description || "—"}</td>
                      <td className="py-0.5">{e.category}</td>
                      <td className="py-0.5">{e.spentBy}</td>
                      <td className="py-0.5 text-right font-medium">
                        {formatCurrency(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-muted-foreground">No expenses this week</p>
            )}
          </div>
        ))}
      </section>

      {/* End-of-month callout */}
      <section className="avoid-break border-t pt-4">
        <div
          className={`rounded-lg p-4 text-center ${
            remaining >= 0
              ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
          }`}
        >
          <p className="text-sm text-muted-foreground">
            {remaining >= 0 ? "Month-End Surplus" : "Month-End Overdraft"}
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${
              remaining >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(Math.abs(remaining))}
          </p>
          {remaining < 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              This amount will carry over to next month if overdraft is applied.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
