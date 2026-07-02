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

export function RecapMonthSelector({ budgets, selectedYear, selectedMonth }: Props) {
  const router = useRouter();
  const now = new Date();

  return (
    <div className="flex items-center gap-2">
      <select
        value={`${selectedYear}-${selectedMonth}`}
        onChange={(e) => {
          const [y, m] = e.target.value.split("-");
          router.push(`/recap/${y}/${m}`);
        }}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {budgets.map((b) => {
          const isCurrent = b.year === now.getFullYear() && b.month === now.getMonth() + 1;
          return (
            <option key={b.id} value={`${b.year}-${b.month}`}>
              {MONTH_NAMES[b.month - 1]} {b.year}{isCurrent ? " (current)" : ""}
            </option>
          );
        })}
      </select>
      <button
        onClick={() => window.print()}
        className="rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        Print
      </button>
    </div>
  );
}
