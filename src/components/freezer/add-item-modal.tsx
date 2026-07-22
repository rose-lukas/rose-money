"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./modal";
import { EmojiPicker } from "./emoji-picker";
import { AmountPicker } from "./amount-picker";
import { WeightInput } from "./weight-input";
import { addFreezerItem } from "@/app/(rose)/freezer/actions";
import type { FreezerAmount } from "./types";

export function AddItemModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🧊");
  const [amount, setAmount] = useState<FreezerAmount>({ kind: "fraction", num: 1, den: 1 });
  const [weightValue, setWeightValue] = useState("");
  const [weightUnit, setWeightUnit] = useState("g");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFilePreview(f ? URL.createObjectURL(f) : null);
  }

  function save() {
    setError(null);
    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("emoji", emoji || "🧊");
    fd.set("amount_kind", amount.kind);
    fd.set("amount_num", String(amount.num));
    if (amount.kind === "fraction") fd.set("amount_den", String(amount.den));
    if (weightValue.trim() !== "" && !isNaN(Number(weightValue))) {
      fd.set("weight_value", weightValue.trim());
      fd.set("weight_unit", weightUnit);
    }
    if (file) fd.set("image", file);

    start(async () => {
      const r = await addFreezerItem(fd);
      if (r?.error) {
        setError(r.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal title="Add to freezer" onClose={onClose}>
      <div className="space-y-4">
        {/* name */}
        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ground Beef"
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
          />
        </div>

        {/* optional photo */}
        <div>
          <label className="text-sm font-medium">Photo (optional)</label>
          <div className="mt-1 space-y-2">
            <input type="file" accept="image/*" onChange={onFile} className="text-sm" />
            {filePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={filePreview} alt="" className="mx-auto h-32 rounded-xl border object-contain" />
            )}
          </div>
        </div>

        {/* emoji */}
        <div>
          <label className="text-sm font-medium">Freezer emoji</label>
          <div className="mt-1">
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
        </div>

        {/* amount */}
        <div>
          <label className="text-sm font-medium">Amount</label>
          <div className="mt-1">
            <AmountPicker value={amount} onChange={setAmount} />
          </div>
        </div>

        {/* weight */}
        <div>
          <label className="text-sm font-medium">Weight (optional)</label>
          <div className="mt-1">
            <WeightInput
              value={weightValue}
              unit={weightUnit}
              onChange={(v, u) => {
                setWeightValue(v);
                setWeightUnit(u);
              }}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="w-full rounded-xl border-2 border-slate-800 bg-slate-800 py-2.5 font-semibold text-white"
        >
          {pending ? "Adding…" : "Add to freezer"}
        </button>
      </div>
    </Modal>
  );
}
