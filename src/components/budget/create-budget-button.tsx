"use client";

import { Button } from "@/components/ui/button";
import { createMonthlyBudget } from "@/app/(authenticated)/budget/actions";

interface CreateBudgetButtonProps {
  year: number;
  month: number;
}

export function CreateBudgetButton({ year, month }: CreateBudgetButtonProps) {
  return (
    <Button onClick={() => createMonthlyBudget(year, month)}>
      Set Up Monthly Budget
    </Button>
  );
}
