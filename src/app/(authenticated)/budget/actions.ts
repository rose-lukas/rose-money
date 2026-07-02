"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createMonthlyBudget(year: number, month: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Check if budget already exists for this month
  const { data: existing } = await supabase
    .from("monthly_budgets")
    .select("id")
    .eq("year", year)
    .eq("month", month)
    .single();

  if (existing) {
    redirect(`/budget/${existing.id}`);
  }

  // Check for overdraft from previous month
  let overdraftAmount = 0;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const { data: prevBudget } = await supabase
    .from("monthly_budgets")
    .select("id, status")
    .eq("year", prevYear)
    .eq("month", prevMonth)
    .single();

  if (prevBudget && (prevBudget.status === "closed" || prevBudget.status === "active")) {
    // Calculate previous month's overdraft
    const { data: prevIncome } = await supabase
      .from("income_entries")
      .select("amount")
      .eq("budget_id", prevBudget.id);

    const { data: prevFixed } = await supabase
      .from("fixed_expenses")
      .select("amount")
      .eq("budget_id", prevBudget.id);

    const { data: prevExpenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("budget_id", prevBudget.id);

    const totalIncome = (prevIncome ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
    const totalFixed = (prevFixed ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
    const totalSpent = (prevExpenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
    const remaining = totalIncome - totalFixed - totalSpent;

    if (remaining < 0) {
      overdraftAmount = Math.abs(remaining);
    }
  }

  // Create the new budget
  const { data: newBudget, error: budgetError } = await supabase
    .from("monthly_budgets")
    .insert({
      year,
      month,
      status: "draft",
      overdraft_from_previous: overdraftAmount,
      overdraft_applied: overdraftAmount > 0,
    })
    .select("id")
    .single();

  if (budgetError) throw new Error(budgetError.message);

  // Copy income from previous month, or use defaults for first month
  if (prevBudget) {
    const { data: prevIncomeEntries } = await supabase
      .from("income_entries")
      .select("name, amount, sort_order")
      .eq("budget_id", prevBudget.id)
      .order("sort_order");

    if (prevIncomeEntries?.length) {
      await supabase.from("income_entries").insert(
        prevIncomeEntries.map((e) => ({
          budget_id: newBudget.id,
          name: e.name,
          amount: e.amount,
          sort_order: e.sort_order,
        }))
      );
    }
  } else {
    // First month — seed from defaults
    await supabase.from("income_entries").insert([
      { budget_id: newBudget.id, name: "Salary", amount: 5465.0, sort_order: 0 },
      { budget_id: newBudget.id, name: "Child Benefit", amount: 391.33, sort_order: 1 },
    ]);
  }

  // Copy fixed expenses from previous month, or use defaults
  if (prevBudget) {
    const { data: prevFixedEntries } = await supabase
      .from("fixed_expenses")
      .select("name, amount, sort_order, notes")
      .eq("budget_id", prevBudget.id)
      .order("sort_order");

    if (prevFixedEntries?.length) {
      await supabase.from("fixed_expenses").insert(
        prevFixedEntries.map((e) => ({
          budget_id: newBudget.id,
          name: e.name,
          amount: e.amount,
          sort_order: e.sort_order,
          notes: e.notes,
        }))
      );
    }
  } else {
    // First month — seed from defaults
    await supabase.from("fixed_expenses").insert([
      { budget_id: newBudget.id, name: "Mortgage & House Tax", amount: 2783.96, sort_order: 0 },
      { budget_id: newBudget.id, name: "Auto & Home Insurance", amount: 297.43, sort_order: 1 },
      { budget_id: newBudget.id, name: "POTL Payment", amount: 153.83, sort_order: 2 },
      { budget_id: newBudget.id, name: "School Debt", amount: 504.21, sort_order: 3 },
      { budget_id: newBudget.id, name: "WiFi", amount: 50.85, sort_order: 4 },
      { budget_id: newBudget.id, name: "Koodo (Phone)", amount: 60.63, sort_order: 5 },
      { budget_id: newBudget.id, name: "Scotiabank Fee", amount: 16.95, sort_order: 6, notes: "opt out if never under 4000" },
      { budget_id: newBudget.id, name: "Church", amount: 100.0, sort_order: 7 },
    ]);
  }

  revalidatePath("/dashboard");
  redirect(`/budget/${newBudget.id}`);
}

export async function updateIncomeEntry(
  id: string,
  data: { name?: string; amount?: number }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("income_entries")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

export async function addIncomeEntry(budgetId: string, name: string, amount: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("income_entries").insert({
    budget_id: budgetId,
    name,
    amount,
    sort_order: 99,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

export async function deleteIncomeEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("income_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

export async function updateFixedExpense(
  id: string,
  data: { name?: string; amount?: number; notes?: string | null }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fixed_expenses")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

export async function addFixedExpense(budgetId: string, name: string, amount: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("fixed_expenses").insert({
    budget_id: budgetId,
    name,
    amount,
    sort_order: 99,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

export async function deleteFixedExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("fixed_expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

export async function updateOverdraftApplied(budgetId: string, applied: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_budgets")
    .update({ overdraft_applied: applied })
    .eq("id", budgetId);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

export async function recalculateOverdraft(budgetId: string) {
  const supabase = await createClient();

  const { data: budget } = await supabase
    .from("monthly_budgets")
    .select("year, month")
    .eq("id", budgetId)
    .single();

  if (!budget) throw new Error("Budget not found");

  const prevMonth = budget.month === 1 ? 12 : budget.month - 1;
  const prevYear = budget.month === 1 ? budget.year - 1 : budget.year;

  const { data: prevBudget } = await supabase
    .from("monthly_budgets")
    .select("id")
    .eq("year", prevYear)
    .eq("month", prevMonth)
    .single();

  if (!prevBudget) return;

  const [{ data: prevIncome }, { data: prevFixed }, { data: prevExpenses }] = await Promise.all([
    supabase.from("income_entries").select("amount").eq("budget_id", prevBudget.id),
    supabase.from("fixed_expenses").select("amount").eq("budget_id", prevBudget.id),
    supabase.from("expenses").select("amount").eq("budget_id", prevBudget.id),
  ]);

  const totalIncome = (prevIncome ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const totalFixed = (prevFixed ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const totalSpent = (prevExpenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const remaining = totalIncome - totalFixed - totalSpent;

  if (remaining < 0) {
    const overdraftAmount = Math.abs(remaining);
    await supabase
      .from("monthly_budgets")
      .update({ overdraft_from_previous: overdraftAmount, overdraft_applied: true })
      .eq("id", budgetId);
  }

  revalidatePath("/budget");
}

export async function confirmBudget(budgetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("monthly_budgets")
    .update({
      status: "active",
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", budgetId)
    .eq("status", "draft");

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function closeBudget(budgetId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("monthly_budgets")
    .update({ status: "closed" })
    .eq("id", budgetId)
    .eq("status", "active");

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
