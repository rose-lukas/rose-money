"use client";

import { useState } from "react";
import { AmountBadge, WeightBadge } from "./amount-badge";
import { ItemModal } from "./item-modal";
import { AddItemModal } from "./add-item-modal";
import type { FreezerItem } from "./types";

function ItemTile({
  item,
  index,
  onClick,
}: {
  item: FreezerItem;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="animate-rh-rise flex flex-col items-center gap-1 rounded-2xl border-[3px] border-slate-800 bg-white p-3 text-center shadow-[3px_3px_0_rgba(15,23,42,0.9)] transition-transform hover:-translate-y-0.5 active:scale-95"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="text-4xl leading-none">{item.emoji}</div>
      <div className="font-doodle line-clamp-1 text-base leading-tight text-slate-800">
        {item.name}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {item.weightValue != null && (
          <WeightBadge value={item.weightValue} unit={item.weightUnit ?? "g"} />
        )}
        <AmountBadge amount={item.amount} />
      </div>
    </button>
  );
}

function AddTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="animate-rh-rise flex flex-col items-center justify-center gap-1 rounded-2xl border-[3px] border-dashed border-slate-400 bg-white/60 p-3 text-center text-slate-500 transition-transform hover:-translate-y-0.5 active:scale-95"
    >
      <div className="text-4xl leading-none">＋</div>
      <div className="font-doodle text-base leading-tight">Add item</div>
    </button>
  );
}

export function FreezerScene({ items }: { items: FreezerItem[] }) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<FreezerItem | null>(null);
  const [adding, setAdding] = useState(false);

  function toggle() {
    if (open) {
      setRevealed(false);
      setOpen(false);
    } else {
      setOpen(true);
      window.setTimeout(() => setRevealed(true), 260);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center px-4">
      {/* Heading at the top */}
      <div className="shrink-0 pt-6 text-center">
        <h1 className="font-doodle text-4xl text-slate-800 dark:text-slate-100">
          The Freezer
        </h1>
        <p className="font-doodle mt-1 text-lg text-muted-foreground">
          {open ? "brrr… here's what's inside" : "tap the lid to peek inside"}
        </p>
      </div>

      {/* Centered region: items expand here and push the freezer down */}
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        {/* Items sliding out (in flow, so the freezer moves down for them) */}
        <div
          className={`w-[min(92vw,30rem)] overflow-hidden transition-[max-height,opacity,margin] duration-500 ease-out ${
            revealed ? "mb-4 max-h-[42vh] opacity-100" : "mb-0 max-h-0 opacity-0"
          }`}
        >
          <div className="grid max-h-[42vh] grid-cols-3 gap-3 overflow-y-auto p-2 sm:grid-cols-4">
            {revealed && (
              <>
                {items.map((item, i) => (
                  <ItemTile
                    key={item.id}
                    item={item}
                    index={i}
                    onClick={() => setSelected(item)}
                  />
                ))}
                <AddTile onClick={() => setAdding(true)} />
              </>
            )}
          </div>
        </div>

        {/* Freezer graphic (whole thing toggles open/closed) */}
        <button
          type="button"
          onClick={toggle}
          aria-label={open ? "Close the freezer" : "Open the freezer"}
          className="block w-[300px] max-w-[82vw] cursor-pointer rounded-[1.6rem] outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
        >
          <div className={`relative ${open ? "" : "animate-rh-bob"}`}>
            {/* Frosty mist rising from the opening (only when open) */}
            {open && (
              <div
                aria-hidden
                className="animate-rh-mist pointer-events-none absolute left-1/2 top-2 z-20 h-14 w-40 -translate-x-1/2 rounded-full bg-white/70 blur-xl"
              />
            )}

            {/* Body box */}
            <div className="rounded-[1.5rem] border-4 border-slate-800 bg-gradient-to-b from-white to-sky-50 p-3 pb-0 shadow-2xl">
              {/* Open top — the interior cavity revealed when the lid is off */}
              <div className="relative h-24 overflow-hidden rounded-xl border-4 border-slate-300 bg-gradient-to-b from-sky-700 to-slate-900 shadow-[inset_0_14px_26px_rgba(0,0,0,0.7)]">
                {/* frosty rim highlight */}
                <div className="absolute inset-x-2 top-1 h-2 rounded-full bg-white/40 blur-[2px]" />
                {/* frost specks on the interior */}
                <div className="absolute inset-0 opacity-50 [background:radial-gradient(circle_at_20%_60%,white_0,transparent_16%),radial-gradient(circle_at_72%_38%,white_0,transparent_12%),radial-gradient(circle_at_48%_82%,white_0,transparent_11%)]" />
              </div>

              {/* Front wall */}
              <div className="relative flex h-28 flex-col items-center justify-center gap-1">
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

            {/* Lid — simply fades away when open, revealing the opening beneath */}
            <div
              aria-hidden
              className={`absolute left-0 right-0 top-0 flex h-[8.25rem] flex-col items-center justify-center gap-2 rounded-[1.5rem] border-4 border-slate-800 bg-gradient-to-b from-white to-sky-100 shadow-lg transition-opacity duration-200 ${
                open ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              {/* lid handle */}
              <div className="h-3 w-28 rounded-full border-[3px] border-slate-800 bg-slate-200" />
              <span className="font-doodle text-lg text-slate-500">
                tap to open ❄︎
              </span>
            </div>
          </div>
        </button>
      </div>

      {selected && (
        <ItemModal item={selected} onClose={() => setSelected(null)} />
      )}
      {adding && <AddItemModal onClose={() => setAdding(false)} />}
    </div>
  );
}
