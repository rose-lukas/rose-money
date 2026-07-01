"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface Expense {
  date: string;
  amount: number | string;
}

interface Props {
  expenses: Expense[];
  year: number;
  month: number;
}

export function SpendingChart({ expenses, year, month }: Props) {
  if (expenses.length === 0) return null;

  // Build daily totals map
  const dailyTotals: Record<number, number> = {};
  for (const e of expenses) {
    const day = new Date(e.date + "T12:00:00").getDate();
    dailyTotals[day] = (dailyTotals[day] || 0) + Math.abs(Number(e.amount));
  }

  // Build cumulative data for all days up to today (or end of month)
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

  let cumulative = 0;
  const data = [];
  for (let d = 1; d <= lastDay; d++) {
    cumulative += dailyTotals[d] || 0;
    if (dailyTotals[d] || d === 1 || d === lastDay) {
      data.push({ day: d, cumulative, daily: dailyTotals[d] || 0 });
    }
  }

  if (data.length < 2) return null;

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Cumulative Spending</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(d) => `${d}`}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${Math.round(v)}`}
            width={48}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(d) => `Day ${d}`}
            contentStyle={{
              fontSize: "12px",
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--background))",
            }}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#spendGradient)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
