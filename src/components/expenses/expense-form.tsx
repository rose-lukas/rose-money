"use client";

import { useRef, useState } from "react";
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
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

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

  // Compress image to stay under Vercel's body limit
  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Scale down to max 1200px on longest side (enough for receipt text)
        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(blob!),
          "image/jpeg",
          0.8
        );
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleScanReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setScanSuccess(null);
    setScanning(true);

    try {
      // Compress image before sending
      const compressed = await compressImage(file);
      const compressedFile = new File([compressed], file.name, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("receipt", compressedFile);

      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Scan failed.");
        setScanning(false);
        return;
      }

      // Pre-fill form fields
      const form = formRef.current;
      if (form) {
        if (data.date) {
          (form.elements.namedItem("date") as HTMLInputElement).value = data.date;
        }
        if (data.total != null) {
          (form.elements.namedItem("amount") as HTMLInputElement).value = String(data.total);
        }
        if (data.store) {
          (form.elements.namedItem("store") as HTMLInputElement).value = data.store;
        }
      }

      // Also set the receipt file on the file input for upload
      const receiptInput = form?.elements.namedItem("receipt") as HTMLInputElement;
      if (receiptInput) {
        const dt = new DataTransfer();
        dt.items.add(compressedFile);
        receiptInput.files = dt.files;
      }

      const filled = [data.date && "date", data.store && "store", data.total != null && "total"].filter(Boolean);
      setScanSuccess(`Found: ${filled.join(", ")}. Please review and save.`);
    } catch {
      setError("Failed to scan receipt. Please enter details manually.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      {/* Scan Receipt Button */}
      <div className="rounded-lg border-2 border-dashed border-primary/30 p-4 text-center">
        <input
          ref={scanInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          capture="environment"
          className="hidden"
          onChange={handleScanReceipt}
        />
        <button
          type="button"
          disabled={scanning}
          onClick={() => scanInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity disabled:opacity-50"
        >
          {scanning ? (
            <>
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Reading receipt...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>
              Scan Receipt
            </>
          )}
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Take a photo or choose an image to auto-fill details
        </p>
      </div>

      {scanSuccess && (
        <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          {scanSuccess}
        </div>
      )}

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
          Amount * <span className="font-normal text-muted-foreground">(negative for returns)</span>
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
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
