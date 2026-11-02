"use client";

import { useState, useTransition } from "react";
import { reopenBudget } from "@/app/(rose)/money/budget/actions";

export function ReopenBudgetButton({
  budgetId,
  label,
}: {
  budgetId: string;
  label: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>Reopen {label}?</span>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await reopenBudget(budgetId);
              setConfirming(false);
            })
          }
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Reopening..." : "Reopen"}
        </button>
        <button
          disabled={pending}
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
      className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
    >
      Reopen Month
    </button>
  );
}
