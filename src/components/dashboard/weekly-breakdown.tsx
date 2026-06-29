"use client";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface WeeklyBreakdownProps {
  weeks: { start: Date; end: Date; label: string }[];
  expenses: {
    id: string;
    date: string;
    amount: number;
    store: string | null;
    categoryName: string;
  }[];
  budgetAfterFixed: number;
}

export function WeeklyBreakdown({
  weeks,
  expenses,
  budgetAfterFixed,
}: WeeklyBreakdownProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let runningSpent = 0;

  const weekData = weeks.map((week) => {
    const weekExpenses = expenses.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return d >= week.start && d <= week.end;
    });

    const weekTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
    runningSpent += weekTotal;
    const remainingAfterWeek = budgetAfterFixed - runningSpent;

    const isCurrent = today >= week.start && today <= week.end;

    return {
      ...week,
      expenses: weekExpenses.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
      weekTotal,
      remainingAfterWeek,
      isCurrent,
    };
  });

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Weekly Breakdown</h2>
      <div className="space-y-2">
        {weekData.map((week, wi) => (
          <div
            key={wi}
            className={cn(
              "rounded-xl border p-3 space-y-2 transition-colors",
              week.isCurrent && "border-primary/50 bg-primary/5 dark:bg-primary/10"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{week.label}</span>
                {week.isCurrent && (
                  <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Now
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(week.weekTotal)}
              </span>
            </div>

            {week.expenses.length > 0 && (
              <div className="space-y-0.5 pl-2 border-l-2 border-muted ml-1">
                {week.expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex justify-between text-[11px] text-muted-foreground py-0.5"
                  >
                    <span className="truncate pr-2">
                      {new Date(exp.date + "T00:00:00").toLocaleDateString(
                        "en-CA",
                        { weekday: "short", day: "numeric" }
                      )}{" "}
                      · {exp.store || exp.categoryName}
                    </span>
                    <span className="tabular-nums shrink-0">{formatCurrency(exp.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-[11px] pt-1 border-t border-dashed border-border/60">
              <span className="text-muted-foreground">Remaining</span>
              <span
                className={`font-semibold ${
                  week.remainingAfterWeek >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(week.remainingAfterWeek)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
