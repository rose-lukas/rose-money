"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/format";

const COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea",
  "#ea580c", "#0d9488", "#db2777", "#4f46e5", "#65a30d",
  "#0891b2", "#6b7280",
];

interface CategoryChartProps {
  expenses: { amount: number; categoryName: string }[];
}

export function CategoryChart({ expenses }: CategoryChartProps) {
  // Aggregate by category
  const categoryTotals = new Map<string, number>();
  for (const e of expenses) {
    categoryTotals.set(
      e.categoryName,
      (categoryTotals.get(e.categoryName) ?? 0) + e.amount
    );
  }

  const data = Array.from(categoryTotals.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <section className="rounded-xl border p-4 space-y-2">
      <h2 className="text-sm font-semibold">By Category</h2>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              dataKey="value"
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--background)",
                fontSize: "12px",
              }}
            />
            <Legend
              formatter={(value: string) => {
                const item = data.find((d) => d.name === value);
                const pct = item ? Math.round((item.value / total) * 100) : 0;
                return `${value} (${pct}%)`;
              }}
              wrapperStyle={{ fontSize: "11px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
