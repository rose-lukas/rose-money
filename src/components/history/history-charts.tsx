"use client";

import { useState } from "react";
import { MonthlyComparisonChart } from "./monthly-comparison-chart";
import { CategoryTrendsChart } from "./category-trends-chart";

interface BudgetSummary {
  year: number;
  month: number;
  income: number;
  fixed: number;
  spent: number;
  remaining: number;
  byCategory: Record<string, number>;
}

interface Props {
  data: BudgetSummary[];
  categories: { id: string; name: string }[];
}

const RANGES = [
  { label: "3 mo", value: 3 },
  { label: "6 mo", value: 6 },
  { label: "12 mo", value: 12 },
  { label: "All", value: 0 },
];

export function HistoryCharts({ data, categories }: Props) {
  const [range, setRange] = useState(6);

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-center gap-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              range === r.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-input hover:border-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Monthly comparison */}
      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="text-base font-semibold">Monthly Overview</h2>
        <MonthlyComparisonChart data={data} range={range} />
      </section>

      {/* Category trends */}
      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="text-base font-semibold">Spending by Category</h2>
        <CategoryTrendsChart data={data} categories={categories} range={range} />
      </section>
    </div>
  );
}
