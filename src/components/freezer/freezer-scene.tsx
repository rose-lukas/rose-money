"use client";

import { useState } from "react";

export interface FreezerItem {
  id: string;
  name: string;
  emoji: string;
  amount:
    | { kind: "fraction"; num: number; den: number }
    | { kind: "count"; num: number };
}

const FRACTION_GLYPHS: Record<string, string> = {
  "1/2": "½",
  "1/3": "⅓",
  "2/3": "⅔",
  "1/4": "¼",
  "3/4": "¾",
};

function AmountBadge({ amount }: { amount: FreezerItem["amount"] }) {
  const label =
    amount.kind === "count"
      ? `×${amount.num}`
      : FRACTION_GLYPHS[`${amount.num}/${amount.den}`] ??
        `${amount.num}/${amount.den}`;
  return (
    <span className="inline-flex min-w-7 items-center justify-center rounded-full border-2 border-slate-800 bg-sky-100 px-2 py-0.5 text-sm font-bold leading-none text-slate-800">
      {label}
    </span>
  );
}

function ItemCard({ item, index }: { item: FreezerItem; index: number }) {
  return (
    <div
      className="animate-rh-rise flex flex-col items-center gap-1 rounded-2xl border-[3px] border-slate-800 bg-white p-3 text-center shadow-[3px_3px_0_rgba(15,23,42,0.9)]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="text-4xl leading-none">{item.emoji}</div>
      <div className="font-doodle text-base leading-tight text-slate-800">
        {item.name}
      </div>
      <AmountBadge amount={item.amount} />
    </div>
  );
}

export function FreezerScene({ items }: { items: FreezerItem[] }) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  function toggle() {
    if (open) {
      // Hide items first, then close the lid
      setRevealed(false);
      setOpen(false);
    } else {
      // Open the lid, then reveal items once it has swung back
      setOpen(true);
      window.setTimeout(() => setRevealed(true), 560);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-4">
      {/* Heading pinned near the top */}
      <div className="absolute inset-x-0 top-6 text-center">
        <h1 className="font-doodle text-4xl text-slate-800 dark:text-slate-100">
          The Freezer
        </h1>
        <p className="font-doodle mt-1 text-lg text-muted-foreground">
          {open ? "brrr… here's what's inside" : "tap the lid to peek inside"}
        </p>
      </div>

      {/* Freezer anchor (stays centered; items float above it) */}
      <div className="relative">
        {/* Items sliding out — absolutely above the freezer so it doesn't shift */}
        <div
          className={`absolute bottom-full left-1/2 mb-4 w-[min(92vw,30rem)] -translate-x-1/2 transition-opacity duration-300 ${
            revealed ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="grid max-h-[42vh] grid-cols-2 gap-3 overflow-y-auto p-2 sm:grid-cols-3">
            {revealed &&
              items.map((item, i) => (
                <ItemCard key={item.id} item={item} index={i} />
              ))}
          </div>
        </div>

        {/* Freezer graphic */}
        <div className="[perspective:1400px]">
          <div
            className={`relative w-[300px] max-w-[82vw] [transform-style:preserve-3d] ${
              open ? "" : "animate-rh-bob"
            }`}
          >
            {/* Frosty mist at the opening (only when open) */}
            {open && (
              <div
                aria-hidden
                className="animate-rh-mist pointer-events-none absolute left-1/2 top-1 z-20 h-16 w-40 -translate-x-1/2 rounded-full bg-white/70 blur-xl"
              />
            )}

            {/* Back hinges (peek out when the lid lifts) */}
            <div className="absolute left-10 top-0 z-0 h-3 w-6 rounded-t-md border-[3px] border-b-0 border-slate-800 bg-slate-300" />
            <div className="absolute right-10 top-0 z-0 h-3 w-6 rounded-t-md border-[3px] border-b-0 border-slate-800 bg-slate-300" />

            {/* Interior cavity */}
            <div className="absolute left-2 right-2 top-2 z-0 h-24 rounded-t-2xl bg-gradient-to-b from-cyan-300 to-sky-600 shadow-[inset_0_12px_22px_rgba(0,0,0,0.4)]">
              <div className="absolute inset-0 rounded-t-2xl opacity-40 [background:radial-gradient(circle_at_20%_60%,white_0,transparent_18%),radial-gradient(circle_at_70%_40%,white_0,transparent_14%),radial-gradient(circle_at_45%_80%,white_0,transparent_12%)]" />
            </div>

            {/* Body / front wall */}
            <div className="relative z-10 rounded-[1.5rem] border-4 border-slate-800 bg-gradient-to-b from-white to-sky-50 pt-24 shadow-2xl">
              <div className="relative flex h-32 flex-col items-center justify-center gap-2">
                {/* front handle */}
                <div className="h-2.5 w-24 rounded-full border-2 border-slate-800 bg-slate-200" />
                <span className="font-doodle text-xl text-slate-400">Freezer</span>

                {/* temp dial */}
                <div className="absolute bottom-4 left-5 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-slate-800 bg-white">
                  <div className="h-3 w-0.5 -translate-y-0.5 rotate-45 rounded bg-slate-800" />
                </div>
                {/* power LED */}
                <div className="absolute bottom-6 right-6 h-2.5 w-2.5 rounded-full border-2 border-slate-800 bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.9)]" />
                {/* frost sticker */}
                <div className="absolute bottom-3 right-5 font-doodle text-lg text-sky-400">
                  ❄︎
                </div>
                {/* temp label */}
                <div className="absolute bottom-4 right-12 font-doodle text-sm text-slate-400">
                  -18°
                </div>

                {/* little feet */}
                <div className="absolute -bottom-2 left-6 h-3 w-5 rounded-b-md border-4 border-t-0 border-slate-800 bg-white" />
                <div className="absolute -bottom-2 right-6 h-3 w-5 rounded-b-md border-4 border-t-0 border-slate-800 bg-white" />
              </div>
            </div>

            {/* Lid — hinged at the back (top edge), swings up and over */}
            <button
              type="button"
              onClick={toggle}
              aria-label={open ? "Close the freezer" : "Open the freezer"}
              className="absolute left-0 right-0 top-0 z-30 h-28 origin-top cursor-pointer rounded-[1.4rem] border-4 border-slate-800 bg-gradient-to-b from-white to-sky-100 shadow-lg outline-none [backface-visibility:hidden] focus-visible:ring-4 focus-visible:ring-sky-300"
              style={{
                transform: open ? "rotateX(-135deg)" : "rotateX(0deg)",
                transition: "transform 0.65s cubic-bezier(0.34, 1.3, 0.5, 1)",
              }}
            >
              <div className="flex h-full flex-col items-center justify-center gap-2">
                <div className="h-3 w-28 rounded-full border-[3px] border-slate-800 bg-slate-200" />
                <span className="font-doodle text-lg text-slate-500">
                  {open ? "" : "tap to open ❄︎"}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
