"use client";

import { useRouter } from "next/navigation";

interface Budget {
  id: string;
  year: number;
  month: number;
  status: string;
}

interface Props {
  budgets: Budget[];
  selectedId: string;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function BudgetMonthSelector({ budgets, selectedId }: Props) {
  const router = useRouter();
  const now = new Date();

  return (
    <select
      value={selectedId}
      onChange={(e) => router.push(`/budget/${e.target.value}`)}
      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {budgets.map((b) => {
        const isCurrent = b.year === now.getFullYear() && b.month === now.getMonth() + 1;
        const label = isCurrent ? " (current)" : b.status === "draft" ? " (draft)" : "";
        return (
          <option key={b.id} value={b.id}>
            {MONTH_NAMES[b.month - 1]} {b.year}{label}
          </option>
        );
      })}
    </select>
  );
}
