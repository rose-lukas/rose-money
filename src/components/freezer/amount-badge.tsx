import type { FreezerAmount } from "./types";

const FRACTION_GLYPHS: Record<string, string> = {
  "1/2": "½",
  "1/3": "⅓",
  "2/3": "⅔",
  "1/4": "¼",
  "3/4": "¾",
};

export function formatAmount(amount: FreezerAmount): string {
  if (amount.kind === "count") return `×${amount.num}`;
  if (amount.num === amount.den) return "full";
  return FRACTION_GLYPHS[`${amount.num}/${amount.den}`] ?? `${amount.num}/${amount.den}`;
}

export function AmountBadge({ amount }: { amount: FreezerAmount }) {
  return (
    <span className="inline-flex min-w-7 items-center justify-center rounded-full border-2 border-slate-800 bg-sky-100 px-2 py-0.5 text-sm font-bold leading-none text-slate-800">
      {formatAmount(amount)}
    </span>
  );
}
