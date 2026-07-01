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
  selectedYear: number;
  selectedMonth: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthSelector({ budgets, selectedYear, selectedMonth }: Props) {
  const router = useRouter();

  return (
    <select
      value={`${selectedYear}-${selectedMonth}`}
      onChange={(e) => {
        const [y, m] = e.target.value.split("-");
        router.push(`/expenses?year=${y}&month=${m}`);
      }}
      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {budgets.map((b) => (
        <option key={b.id} value={`${b.year}-${b.month}`}>
          {MONTH_NAMES[b.month - 1]} {b.year}{b.status === "active" ? " (current)" : b.status === "draft" ? " (draft)" : ""}
        </option>
      ))}
    </select>
  );
}
