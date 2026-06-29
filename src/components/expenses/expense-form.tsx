"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addExpense } from "@/app/(authenticated)/expenses/actions";

interface ExpenseFormProps {
  budgetId: string;
  categories: { id: string; name: string }[];
  profiles: { id: string; display_name: string }[];
  currentUserId: string;
  defaultDate: string;
}

export function ExpenseForm({
  budgetId,
  categories,
  profiles,
  currentUserId,
  defaultDate,
}: ExpenseFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    formData.set("budget_id", budgetId);
    const result = await addExpense(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="date" className="text-sm font-medium">
          Date *
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={defaultDate}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="amount" className="text-sm font-medium">
          Amount *
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          inputMode="decimal"
          placeholder="0.00"
          className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-lg"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="category_id" className="text-sm font-medium">
          Category *
        </label>
        <select
          id="category_id"
          name="category_id"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="store" className="text-sm font-medium">
          Store / Vendor
        </label>
        <input
          id="store"
          name="store"
          type="text"
          placeholder="e.g., Costco, Shell"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="spent_by" className="text-sm font-medium">
          Who *
        </label>
        <select
          id="spent_by"
          name="spent_by"
          required
          defaultValue={currentUserId}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Notes
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="Optional notes"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="receipt" className="text-sm font-medium">
          Receipt Photo
        </label>
        <input
          id="receipt"
          name="receipt"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-sm file:text-primary-foreground"
        />
        <p className="text-xs text-muted-foreground">Max 5MB. JPEG, PNG, WebP, or HEIC.</p>
      </div>

      <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
        {loading ? "Saving..." : "Save Expense"}
      </Button>
    </form>
  );
}
