"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface BudgetSummary {
  year: number;
  month: number;
  byCategory: Record<string, number>;
}

interface Props {
  data: BudgetSummary[];
  categories: { id: string; name: string }[];
  range: number;
}

const COLORS = [
  "#3b82f6", "#f97316", "#22c55e", "#a855f7", "#ec4899",
  "#14b8a6", "#eab308", "#6366f1", "#f43f5e", "#06b6d4",
  "#84cc16", "#d946ef",
];

export function CategoryTrendsChart({ data, categories, range }: Props) {
  const filtered = range > 0 ? data.slice(-range) : data;

  // Find categories that have any spending
  const activeCatIds = new Set<string>();
  filtered.forEach((d) => {
    Object.keys(d.byCategory).forEach((id) => {
      if (d.byCategory[id] > 0) activeCatIds.add(id);
    });
  });

  const activeCats = categories.filter((c) => activeCatIds.has(c.id));

  const chartData = filtered.map((d) => {
    const row: Record<string, string | number> = {
      label: `${d.year}-${String(d.month).padStart(2, "0")}`,
    };
    activeCats.forEach((c) => {
      row[c.name] = d.byCategory[c.id] || 0;
    });
    return row;
  });

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No data to display.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Legend />
        {activeCats.map((c, i) => (
          <Bar
            key={c.id}
            dataKey={c.name}
            stackId="categories"
            fill={COLORS[i % COLORS.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
