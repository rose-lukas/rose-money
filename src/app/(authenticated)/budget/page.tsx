import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function BudgetPage() {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: budget } = await supabase
    .from("monthly_budgets")
    .select("id")
    .eq("year", year)
    .eq("month", month)
    .single();

  if (budget) {
    redirect(`/budget/${budget.id}`);
  }

  redirect("/dashboard");
}
