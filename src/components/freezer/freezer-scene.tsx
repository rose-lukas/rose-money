"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AmountBadge, WeightBadge } from "./amount-badge";
import { ItemModal } from "./item-modal";
import { AddItemModal } from "./add-item-modal";
import { deleteFreezerItem, reorderFreezerItems } from "@/app/(rose)/freezer/actions";
import type { FreezerItem } from "./types";

function ItemTile({
  item,
  index,
  onClick,
  dragging,
  draggable,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  item: FreezerItem;
  index: number;
  onClick: () => void;
  dragging: boolean;
  draggable: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={`animate-rh-rise flex flex-col items-center gap-1 rounded-2xl border-[3px] border-slate-800 bg-white p-3 text-center shadow-[3px_3px_0_rgba(15,23,42,0.9)] transition-transform hover:-translate-y-0.5 active:scale-95 select-none ${
        dragging ? "opacity-45" : "opacity-100"
      }`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.name}
          draggable={false}
          className="h-12 w-12 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center text-4xl leading-none">
          {item.emoji}
        </div>
      )}
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

function ItemRow({
  item,
  index,
  onClick,
  dragging,
  draggable,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: Readonly<{
  item: FreezerItem;
  index: number;
  onClick: () => void;
  dragging: boolean;
  draggable: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={`animate-rh-rise flex w-full select-none items-center gap-3 rounded-xl border-[3px] border-slate-800 bg-white px-3 py-2 text-left shadow-[2px_2px_0_rgba(15,23,42,0.9)] transition-transform active:scale-[0.99] ${
        dragging ? "opacity-45" : "opacity-100"
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.name}
          draggable={false}
          className="h-8 w-8 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span className="w-8 shrink-0 text-center text-2xl leading-none">{item.emoji}</span>
      )}
      <span className="font-doodle line-clamp-1 flex-1 text-base leading-tight text-slate-800">
        {item.name}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {item.weightValue != null && (
          <WeightBadge value={item.weightValue} unit={item.weightUnit ?? "g"} />
        )}
        <AmountBadge amount={item.amount} />
      </span>
    </button>
  );
}

function AddRow({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="animate-rh-rise flex w-full items-center gap-3 rounded-xl border-[3px] border-dashed border-slate-400 bg-white/60 px-3 py-2 text-left text-slate-500 transition-transform active:scale-[0.99]"
    >
      <span className="w-8 shrink-0 text-center text-2xl leading-none">＋</span>
      <span className="font-doodle text-base leading-tight">Add item</span>
    </button>
  );
}

const VIEW_STORAGE_KEY = "freezer-view";
type FreezerView = "grid" | "list";

export function FreezerScene({ items }: { items: FreezerItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<FreezerItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [orderedItems, setOrderedItems] = useState(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDelete, setDragOverDelete] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<FreezerView>("grid");
  const [pending, startTransition] = useTransition();
  const justDragged = useRef(false);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "grid" || stored === "list") setView(stored);
  }, []);

  function changeView(next: FreezerView) {
    setView(next);
    window.localStorage.setItem(VIEW_STORAGE_KEY, next);
  }

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  function toggle() {
    if (open) {
      setRevealed(false);
      setOpen(false);
    } else {
      setOpen(true);
      window.setTimeout(() => setRevealed(true), 260);
    }
  }

  function moveItem(list: FreezerItem[], fromId: string, toId: string) {
    const fromIndex = list.findIndex((x) => x.id === fromId);
    const toIndex = list.findIndex((x) => x.id === toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return list;

    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  }

  function persistOrder(next: FreezerItem[]) {
    startTransition(async () => {
      await reorderFreezerItems(next.map((x) => x.id));
      router.refresh();
    });
  }

  function handleDropOnItem(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const next = moveItem(orderedItems, draggingId, targetId);
    if (next !== orderedItems) {
      setOrderedItems(next);
      persistOrder(next);
    }
    setDraggingId(null);
  }

  function handleDropToEat() {
    if (!draggingId) return;
    const deletingId = draggingId;
    setOrderedItems((current) => current.filter((x) => x.id !== deletingId));
    setDraggingId(null);
    setDragOverDelete(false);
    startTransition(async () => {
      await deleteFreezerItem(deletingId);
      router.refresh();
    });
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
          <div className="p-2">
            {revealed && (
              <>
                <div className="mb-2 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => changeView("grid")}
                    aria-pressed={view === "grid"}
                    className={`rounded-lg border-2 border-slate-800 px-2 py-1 text-xs font-semibold ${
                      view === "grid" ? "bg-slate-800 text-white" : "bg-white text-slate-800"
                    }`}
                  >
                    Blocks
                  </button>
                  <button
                    type="button"
                    onClick={() => changeView("list")}
                    aria-pressed={view === "list"}
                    className={`rounded-lg border-2 border-slate-800 px-2 py-1 text-xs font-semibold ${
                      view === "list" ? "bg-slate-800 text-white" : "bg-white text-slate-800"
                    }`}
                  >
                    List
                  </button>
                </div>

                <div
                  className={`max-h-[38vh] overflow-y-auto ${
                    view === "grid"
                      ? "grid grid-cols-3 gap-3 sm:grid-cols-4"
                      : "flex flex-col gap-2"
                  }`}
                >
                  {orderedItems.map((item, i) => {
                    const shared = {
                      item,
                      index: i,
                      dragging: draggingId === item.id,
                      draggable: !isMobile,
                      onClick: () => {
                        if (draggingId || pending || justDragged.current) {
                          justDragged.current = false;
                          return;
                        }
                        setSelected(item);
                      },
                      onDragStart: () => setDraggingId(item.id),
                      onDragEnd: () => {
                        justDragged.current = true;
                        window.setTimeout(() => {
                          justDragged.current = false;
                        }, 140);
                        setDragOverDelete(false);
                        setDraggingId(null);
                      },
                      onDragOver: () => {
                        // Keep this as a no-op so the tile is a valid drop target.
                      },
                      onDrop: () => handleDropOnItem(item.id),
                    };

                    return view === "grid" ? (
                      <ItemTile key={item.id} {...shared} />
                    ) : (
                      <ItemRow key={item.id} {...shared} />
                    );
                  })}
                  {view === "grid" ? (
                    <AddTile onClick={() => setAdding(true)} />
                  ) : (
                    <AddRow onClick={() => setAdding(true)} />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Freezer graphic + drag-to-eat zone */}
        <div className="flex items-end gap-4 sm:gap-6">
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
              <div className="relative h-24 overflow-hidden rounded-xl border-4 border-sky-200 bg-gradient-to-b from-sky-100 via-cyan-100 to-sky-200 shadow-[inset_0_10px_18px_rgba(125,211,252,0.45)]">
                {/* frosty rim highlight */}
                <div className="absolute inset-x-2 top-1 h-2 rounded-full bg-white/80 blur-[2px]" />
                {/* frost specks on the interior */}
                <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_20%_60%,white_0,transparent_16%),radial-gradient(circle_at_72%_38%,white_0,transparent_12%),radial-gradient(circle_at_48%_82%,white_0,transparent_11%)]" />
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

          {draggingId && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverDelete(true);
              }}
              onDragLeave={() => setDragOverDelete(false)}
              onDrop={(e) => {
                e.preventDefault();
                handleDropToEat();
              }}
              className={`mb-4 flex h-28 w-24 shrink-0 select-none flex-col items-center justify-center rounded-2xl border-4 border-slate-800 bg-white shadow-[3px_3px_0_rgba(15,23,42,0.9)] transition-transform ${
                dragOverDelete ? "scale-105 bg-rose-50" : ""
              }`}
              aria-label="Eat item"
              title="Drop here to eat it"
            >
              <div className="text-4xl leading-none">🍽️</div>
              <div className="font-doodle mt-1 text-sm text-slate-700">
                {dragOverDelete ? "Nom nom" : "Eat"}
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <ItemModal item={selected} onClose={() => setSelected(null)} />
      )}
      {adding && <AddItemModal onClose={() => setAdding(false)} />}
    </div>
  );
}
