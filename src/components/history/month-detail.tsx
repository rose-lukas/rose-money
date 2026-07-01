"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

interface Expense {
  budget_id: string;
  amount: number | string;
  category_id: string;
  date: string;
  store: string | null;
  spent_by: string | null;
  description: string | null;
}

interface Summary {
  id: string;
  year: number;
  month: number;
  status: string;
  income: number;
  fixed: number;
  spent: number;
  remaining: number;
  expenses: Expense[];
}

interface Category {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  display_name: string;
}

interface Props {
  summaries: Summary[];
  categories: Category[];
  profiles: Profile[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function HistoryMonthDetail({ summaries, categories, profiles }: Props) {
  const [selectedId, setSelectedId] = useState<string>(summaries[summaries.length - 1]?.id ?? "");

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]));

  const selected = summaries.find((s) => s.id === selectedId);

  const sorted = selected
    ? [...selected.expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    : [];

  return (
    <section className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold">Month Detail</h2>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {[...summaries].reverse().map((s) => (
            <option key={s.id} value={s.id}>
              {MONTH_NAMES[s.month - 1]} {s.year}
              {s.status === "active" ? " (current)" : ""}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Income</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">
                {formatCurrency(selected.income)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Spent</p>
              <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(selected.spent)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Remaining</p>
              <p className={`text-sm font-bold ${selected.remaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCurrency(selected.remaining)}
              </p>
            </div>
          </div>

          {/* Expense list */}
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No expenses for this month.</p>
          ) : (
            <div className="rounded-lg border divide-y">
              {sorted.map((expense, i) => {
                const categoryName = categoryMap.get(expense.category_id) ?? "Unknown";
                const profileName = profileMap.get(expense.spent_by ?? "") ?? expense.spent_by ?? "Unknown";
                return (
                  <div key={i} className="flex items-center justify-between p-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {expense.store || categoryName}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                          {categoryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(expense.date + "T12:00:00").toLocaleDateString("en-CA", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span>·</span>
                        <span>{profileName}</span>
                        {expense.description && (
                          <>
                            <span>·</span>
                            <span className="truncate">{expense.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap ml-2">
                      {formatCurrency(Math.abs(Number(expense.amount)))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
