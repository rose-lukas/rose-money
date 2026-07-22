"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./modal";
import { EmojiPicker } from "./emoji-picker";
import { AmountPicker } from "./amount-picker";
import {
  searchOpenFoodFacts,
  addFreezerItem,
  type OffResult,
} from "@/app/(rose)/freezer/actions";
import type { FreezerAmount } from "./types";

type Tab = "search" | "upload" | "manual";

export function AddItemModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("search");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🧊");
  const [amount, setAmount] = useState<FreezerAmount>({ kind: "fraction", num: 1, den: 1 });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OffResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function runSearch() {
    setSearching(true);
    setError(null);
    const r = await searchOpenFoodFacts(query);
    setSearching(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    setResults(r.results ?? []);
  }

  function pick(res: OffResult) {
    setName(res.name);
    setImageUrl(res.imageUrl);
    setBarcode(res.barcode);
    setFile(null);
    setFilePreview(null);
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setImageUrl(null);
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
    if (barcode) fd.set("barcode", barcode);
    if (imageUrl) fd.set("image_url", imageUrl);
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
        {/* method tabs */}
        <div className="flex gap-1 rounded-xl border-2 border-slate-800 p-1 text-sm font-semibold">
          {(["search", "upload", "manual"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 capitalize ${
                tab === t ? "bg-slate-800 text-white" : "text-slate-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "search" && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="e.g. McCain fries"
                className="h-10 flex-1 rounded-md border border-input bg-background px-3"
              />
              <button
                type="button"
                onClick={runSearch}
                disabled={searching}
                className="rounded-md border-2 border-slate-800 px-3 font-semibold"
              >
                {searching ? "…" : "Search"}
              </button>
            </div>
            <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(r)}
                  className={`flex items-center gap-2 rounded-lg border-2 p-2 text-left text-xs ${
                    name === r.name && imageUrl === r.imageUrl
                      ? "border-sky-500 bg-sky-50"
                      : "border-slate-300"
                  }`}
                >
                  {r.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded object-contain" />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded bg-slate-100" />
                  )}
                  <span className="line-clamp-2">{r.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "upload" && (
          <div className="space-y-2">
            <input type="file" accept="image/*" onChange={onFile} className="text-sm" />
            {filePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={filePreview} alt="" className="mx-auto h-32 rounded-xl border object-contain" />
            )}
          </div>
        )}

        {/* name (all tabs) */}
        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
          />
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
