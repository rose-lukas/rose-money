"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface BudgetSummary {
  year: number;
  month: number;
  income: number;
  fixed: number;
  spent: number;
  remaining: number;
}

interface Props {
  data: BudgetSummary[];
  range: number; // number of months to show, 0 = all
}

export function MonthlyComparisonChart({ data, range }: Props) {
  const filtered = range > 0 ? data.slice(-range) : data;

  const chartData = filtered.map((d) => ({
    label: `${d.year}-${String(d.month).padStart(2, "0")}`,
    Income: d.income,
    Fixed: d.fixed,
    Spent: d.spent,
    Remaining: d.remaining,
  }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No budget history yet. Close a month to see trends.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
        />
        <Legend />
        <ReferenceLine y={0} stroke="#888" />
        <Bar dataKey="Income" fill="#22c55e" radius={[2, 2, 0, 0]} />
        <Bar dataKey="Fixed" fill="#94a3b8" radius={[2, 2, 0, 0]} />
        <Bar dataKey="Spent" fill="#f97316" radius={[2, 2, 0, 0]} />
        <Bar dataKey="Remaining" fill="#3b82f6" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
