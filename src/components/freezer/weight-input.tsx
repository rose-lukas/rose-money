"use client";

import { WEIGHT_UNITS } from "./types";

export function WeightInput({
  value,
  unit,
  onChange,
}: {
  value: string;
  unit: string;
  onChange: (value: string, unit: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="number"
        inputMode="decimal"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value, unit)}
        placeholder="e.g. 500"
        className="h-10 flex-1 rounded-md border border-input bg-background px-3"
      />
      <select
        value={unit}
        onChange={(e) => onChange(value, e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-2"
      >
        {WEIGHT_UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Parse an Open Food Facts "quantity" string (e.g. "500 g", "1.5 kg") into a weight. */
export function parseQuantity(q: string | null): { value: string; unit: string } | null {
  if (!q) return null;
  const m = q.match(/([\d.,]+)\s*(kg|g|lb|lbs|oz)/i);
  if (!m) return null;
  let unit = m[2].toLowerCase();
  if (unit === "lbs") unit = "lb";
  return { value: m[1].replace(",", "."), unit };
}
