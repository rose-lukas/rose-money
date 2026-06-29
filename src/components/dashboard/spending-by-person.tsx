"use client";

import { formatCurrency } from "@/lib/format";

interface SpendingByPersonProps {
  expenses: { amount: number; personName: string }[];
}

export function SpendingByPerson({ expenses }: SpendingByPersonProps) {
  // Aggregate by person
  const personTotals = new Map<string, number>();
  for (const e of expenses) {
    personTotals.set(
      e.personName,
      (personTotals.get(e.personName) ?? 0) + e.amount
    );
  }

  const data = Array.from(personTotals.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  const colors = ["#2563eb", "#dc2626"];

  return (
    <section className="rounded-lg border p-4 space-y-3">
      <h2 className="font-semibold">By Person</h2>
      <div className="space-y-3">
        {data.map((person, i) => {
          const pct = total > 0 ? (person.value / total) * 100 : 0;
          return (
            <div key={person.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{person.name}</span>
                <span className="font-medium">
                  {formatCurrency(person.value)}{" "}
                  <span className="text-muted-foreground">
                    ({Math.round(pct)}%)
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: colors[i % colors.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
