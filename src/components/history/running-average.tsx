"use client";

import { formatCurrency } from "@/lib/format";

interface Props {
  data: { spent: number }[];
}

export function RunningAverage({ data }: Props) {
  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.spent, 0);
  const avg = total / data.length;

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">Avg. Monthly Spending</p>
      <p className="text-2xl font-bold">{formatCurrency(avg)}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Across {data.length} month{data.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
