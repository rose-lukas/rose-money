"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  addCategory,
  updateCategory,
  toggleCategory,
} from "@/app/(authenticated)/settings/actions";

interface Category {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;
    setError(null);
    const result = await addCategory(newName.trim());
    if (result?.error) {
      setError(result.error);
    } else {
      setNewName("");
      setAdding(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    setError(null);
    const result = await updateCategory(id, editName.trim());
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingId(null);
    }
  }

  return (
    <section className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Expense Categories</h2>
        {!adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            + Add Category
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="divide-y rounded-md border">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between px-3 py-2"
          >
            {editingId === cat.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate(cat.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUpdate(cat.id)}
                >
                  ✓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                >
                  ✕
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm ${
                      !cat.is_active ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {cat.name}
                  </span>
                  {!cat.is_active && (
                    <span className="text-xs text-muted-foreground">(hidden)</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditName(cat.name);
                      setError(null);
                    }}
                    className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleCategory(cat.id, !cat.is_active)}
                    className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {cat.is_active ? "Hide" : "Show"}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {adding && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Category name"
            className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
            autoFocus
          />
          <Button size="sm" onClick={handleAdd}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      )}
    </section>
  );
}
