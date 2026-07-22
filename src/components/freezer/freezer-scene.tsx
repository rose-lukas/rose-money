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
  dragOffset,
  draggable,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  itemRef,
}: {
  item: FreezerItem;
  index: number;
  onClick: () => void;
  dragging: boolean;
  dragOffset: { x: number; y: number };
  draggable: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
  itemRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={itemRef}
      type="button"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={`animate-rh-rise flex flex-col items-center gap-1 rounded-2xl border-[3px] border-slate-800 bg-white p-3 text-center shadow-[3px_3px_0_rgba(15,23,42,0.9)] transition-transform hover:-translate-y-0.5 active:scale-95 ${
        dragging ? "z-30 scale-105 opacity-70 shadow-[6px_8px_0_rgba(15,23,42,0.9)] transition-none" : "opacity-100"
      }`}
      style={{
        animationDelay: `${index * 70}ms`,
        transform: dragging
          ? `translate(${dragOffset.x}px, ${dragOffset.y}px)`
          : undefined,
      }}
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<FreezerItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [orderedItems, setOrderedItems] = useState(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDelete, setDragOverDelete] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [pending, startTransition] = useTransition();
  const justDragged = useRef(false);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const eatZoneRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

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
    setDragOffset({ x: 0, y: 0 });
    setDraggingId(null);
  }

  function handleDropToEat() {
    if (!draggingId) return;
    const deletingId = draggingId;
    setOrderedItems((current) => current.filter((x) => x.id !== deletingId));
    setDragOffset({ x: 0, y: 0 });
    setDraggingId(null);
    setDragOverDelete(false);
    startTransition(async () => {
      await deleteFreezerItem(deletingId);
      router.refresh();
    });
  }

  function pointInRect(x: number, y: number, rect: DOMRect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function findDropTarget(x: number, y: number): { type: "eat" | "item"; id?: string } | null {
    const eatRect = eatZoneRef.current?.getBoundingClientRect();
    if (eatRect && pointInRect(x, y, eatRect)) {
      return { type: "eat" };
    }

    for (const [id, el] of Object.entries(itemRefs.current)) {
      if (!el || id === draggingId) continue;
      const rect = el.getBoundingClientRect();
      if (pointInRect(x, y, rect)) {
        return { type: "item", id };
      }
    }

    return null;
  }

  function handleTouchStart(id: string) {
    if (!isMobile || pending) return;
    setDraggingId(id);
    setDragOffset({ x: 0, y: 0 });
  }

  function handlePointerDown(id: string, e: React.PointerEvent<HTMLButtonElement>) {
    if (!isMobile || pending) return;
    e.preventDefault();
    activePointerIdRef.current = e.pointerId;
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    handleTouchStart(id);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!isMobile || !draggingId) return;
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) {
      return;
    }
    const start = touchStartRef.current;
    if (!start) return;
    e.preventDefault();
    setDragOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
    const target = findDropTarget(e.clientX, e.clientY);
    setDragOverDelete(target?.type === "eat");
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (!isMobile || !draggingId) return;
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) {
      return;
    }
    activePointerIdRef.current = null;

    if (touchStartRef.current == null) {
      touchStartRef.current = null;
      setDragOffset({ x: 0, y: 0 });
      setDraggingId(null);
      setDragOverDelete(false);
      return;
    }

    justDragged.current = true;
    window.setTimeout(() => {
      justDragged.current = false;
    }, 180);

    const target = findDropTarget(e.clientX, e.clientY);
    if (target?.type === "eat") {
      touchStartRef.current = null;
      handleDropToEat();
      return;
    }
    if (target?.type === "item" && target.id) {
      touchStartRef.current = null;
      handleDropOnItem(target.id);
      setDragOverDelete(false);
      return;
    }

    touchStartRef.current = null;
    setDragOffset({ x: 0, y: 0 });
    setDraggingId(null);
    setDragOverDelete(false);
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
                {orderedItems.map((item, i) => (
                  <ItemTile
                    key={item.id}
                    item={item}
                    index={i}
                    dragging={draggingId === item.id}
                    dragOffset={draggingId === item.id ? dragOffset : { x: 0, y: 0 }}
                    draggable={!isMobile}
                    onClick={() => {
                      if (draggingId || pending || justDragged.current) {
                        justDragged.current = false;
                        return;
                      }
                      setSelected(item);
                    }}
                    onDragStart={() => setDraggingId(item.id)}
                    onDragEnd={() => {
                      justDragged.current = true;
                      window.setTimeout(() => {
                        justDragged.current = false;
                      }, 140);
                      setDragOffset({ x: 0, y: 0 });
                      touchStartRef.current = null;
                      activePointerIdRef.current = null;
                      setDragOverDelete(false);
                      setDraggingId(null);
                    }}
                    onPointerDown={(e) => handlePointerDown(item.id, e)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onDragOver={() => {
                      // Keep this as a no-op so the tile is a valid drop target.
                    }}
                    onDrop={() => handleDropOnItem(item.id)}
                    itemRef={(el) => {
                      itemRefs.current[item.id] = el;
                    }}
                  />
                ))}
                <AddTile onClick={() => setAdding(true)} />
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
            className={`${draggingId && isMobile ? "hidden sm:block" : "block"} w-[300px] max-w-[82vw] cursor-pointer rounded-[1.6rem] outline-none focus-visible:ring-4 focus-visible:ring-sky-300`}
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
              ref={eatZoneRef}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverDelete(true);
              }}
              onDragLeave={() => setDragOverDelete(false)}
              onDrop={(e) => {
                e.preventDefault();
                handleDropToEat();
              }}
              className={`${isMobile ? "mb-0 h-[18rem] w-[300px] max-w-[82vw]" : "mb-4 h-28 w-24"} flex shrink-0 select-none flex-col items-center justify-center rounded-2xl border-4 border-slate-800 bg-white shadow-[3px_3px_0_rgba(15,23,42,0.9)] transition-transform ${
                dragOverDelete ? "scale-105 bg-rose-50" : ""
              }`}
              aria-label="Eat item"
              title="Drop here to eat it"
            >
              <div className={`${isMobile ? "text-8xl" : "text-4xl"} leading-none`}>🍽️</div>
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
