"use client";

import type { FreezerAmount } from "./types";

const FRACTIONS = [
  { label: "¼", num: 1, den: 4 },
  { label: "⅓", num: 1, den: 3 },
  { label: "½", num: 1, den: 2 },
  { label: "⅔", num: 2, den: 3 },
  { label: "¾", num: 3, den: 4 },
  { label: "Full", num: 1, den: 1 },
] as const;

export function AmountPicker({
  value,
  onChange,
}: {
  value: FreezerAmount;
  onChange: (a: FreezerAmount) => void;
}) {
  const isFraction = value.kind === "fraction";

  return (
    <div className="space-y-3">
      {/* kind toggle */}
      <div className="flex rounded-xl border-2 border-slate-800 p-1">
        <button
          type="button"
          onClick={() => onChange({ kind: "fraction", num: 1, den: 2 })}
          className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-colors ${
            isFraction ? "bg-slate-800 text-white" : "text-slate-600"
          }`}
        >
          Portion
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({ kind: "count", num: value.kind === "count" ? value.num : 1 })
          }
          className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-colors ${
            !isFraction ? "bg-slate-800 text-white" : "text-slate-600"
          }`}
        >
          Count
        </button>
      </div>

      {isFraction ? (
        <div className="grid grid-cols-3 gap-2">
          {FRACTIONS.map((f) => {
            const selected =
              value.kind === "fraction" && value.num === f.num && value.den === f.den;
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => onChange({ kind: "fraction", num: f.num, den: f.den })}
                className={`rounded-xl border-2 border-slate-800 py-2 text-lg font-bold transition-colors ${
                  selected ? "bg-sky-300 text-slate-900" : "bg-white text-slate-700 hover:bg-sky-50"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() =>
              onChange({ kind: "count", num: Math.max(1, (value.num ?? 1) - 1) })
            }
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-800 bg-white text-2xl font-bold text-slate-800"
          >
            −
          </button>
          <span className="min-w-10 text-center text-3xl font-bold text-slate-800 dark:text-slate-100">
            {value.num}
          </span>
          <button
            type="button"
            onClick={() => onChange({ kind: "count", num: (value.num ?? 1) + 1 })}
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-800 bg-white text-2xl font-bold text-slate-800"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
