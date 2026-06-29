"use client";

import { deleteExpense } from "@/app/(authenticated)/expenses/actions";
import { useState } from "react";

export function DeleteExpenseButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={async () => {
            await deleteExpense(id);
          }}
          className="text-xs text-destructive hover:underline"
        >
          Delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-muted-foreground hover:text-destructive"
      title="Delete expense"
    >
      ✕
    </button>
  );
}
