"use client";

import { FOOD_EMOJIS } from "./types";

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto rounded-xl border-2 border-slate-300 p-2">
        {FOOD_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            className={`rounded-lg p-1 text-2xl transition-transform hover:scale-110 ${
              value === e ? "bg-sky-200 ring-2 ring-slate-800" : ""
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={4}
        placeholder="…or type/paste any emoji"
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-center text-lg"
      />
    </div>
  );
}
