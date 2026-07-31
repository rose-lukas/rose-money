"use client";

import { useState } from "react";
import { DEFAULT_CATEGORIES } from "./types";

const NEW_CATEGORY_VALUE = "__new__";

export function CategoryPicker({
  value,
  existing,
  onChange,
}: Readonly<{
  value: string | null;
  existing: string[];
  onChange: (value: string | null) => void;
}>) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");

  const options = [...new Set([...DEFAULT_CATEGORIES, ...existing, ...(value ? [value] : [])])].sort(
    (a, b) => a.localeCompare(b)
  );

  function commitDraft() {
    const name = draft.trim();
    if (name) onChange(name);
    setDraft("");
    setCreating(false);
  }

  if (creating) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
            if (e.key === "Escape") setCreating(false);
          }}
          placeholder="New category name"
          className="h-10 flex-1 rounded-md border border-input bg-background px-3"
        />
        <button
          type="button"
          onClick={commitDraft}
          className="rounded-md border-2 border-slate-800 px-3 text-sm font-semibold"
        >
          Add
        </button>
      </div>
    );
  }

  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        if (e.target.value === NEW_CATEGORY_VALUE) {
          setCreating(true);
          return;
        }
        onChange(e.target.value || null);
      }}
      className="h-10 w-full rounded-md border border-input bg-background px-3"
    >
      <option value="">No category</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
      <option value={NEW_CATEGORY_VALUE}>+ New category…</option>
    </select>
  );
}
