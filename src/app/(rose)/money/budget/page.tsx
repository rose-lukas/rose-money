import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentYearMonth } from "@/lib/format";

export default async function BudgetPage() {
  const supabase = await createClient();

  const { year, month } = getCurrentYearMonth();

  const { data: budget } = await supabase
    .from("monthly_budgets")
    .select("id")
    .eq("year", year)
    .eq("month", month)
    .single();

  if (budget) {
    redirect(`/money/budget/${budget.id}`);
  }

  redirect("/money");
}
