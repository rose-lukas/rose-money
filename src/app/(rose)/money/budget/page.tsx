import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getWorkingBudget } from "@/lib/budget";

export default async function BudgetPage() {
  const supabase = await createClient();

  const budget = await getWorkingBudget(supabase);

  if (budget) {
    redirect(`/money/budget/${budget.id}`);
  }

  redirect("/money");
}
