"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./modal";
import { AmountPicker } from "./amount-picker";
import { updateFreezerAmount, deleteFreezerItem } from "@/app/(rose)/freezer/actions";
import type { FreezerItem, FreezerAmount } from "./types";

export function ItemModal({
  item,
  onClose,
}: {
  item: FreezerItem;
  onClose: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState<FreezerAmount>(item.amount);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();

  const dirty = JSON.stringify(amount) !== JSON.stringify(item.amount);

  function save() {
    start(async () => {
      await updateFreezerAmount(
        item.id,
        amount.kind === "fraction"
          ? { kind: "fraction", num: amount.num, den: amount.den }
          : { kind: "count", num: amount.num }
      );
      router.refresh();
      onClose();
    });
  }

  function remove() {
    start(async () => {
      await deleteFreezerItem(item.id);
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal title={item.name} onClose={onClose}>
      <div className="space-y-4">
        {/* image / emoji */}
        <div className="flex justify-center">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-40 w-40 rounded-2xl border-4 border-slate-800 bg-white object-contain"
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-4 border-slate-800 bg-sky-50 text-7xl">
              {item.emoji}
            </div>
          )}
        </div>

        {item.notes && (
          <p className="text-center text-sm text-muted-foreground">{item.notes}</p>
        )}

        <div>
          <p className="mb-2 font-doodle text-xl text-slate-700 dark:text-slate-200">
            How much is left?
          </p>
          <AmountPicker value={amount} onChange={setAmount} />
        </div>

        <div className="flex gap-2 pt-1">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
              className="flex-1 rounded-xl border-2 border-red-500 py-2.5 font-semibold text-red-500 transition-colors hover:bg-red-50"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="flex-1 rounded-xl border-2 border-red-600 bg-red-600 py-2.5 font-semibold text-white"
            >
              {pending ? "…" : "Confirm remove"}
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="flex-1 rounded-xl border-2 border-slate-800 bg-slate-800 py-2.5 font-semibold text-white disabled:opacity-40"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
