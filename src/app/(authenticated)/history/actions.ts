"use server";

import { createClient } from "@/lib/supabase/server";

export async function getClosedBudgets() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("monthly_budgets")
    .select("id, year, month, status, overdraft_from_previous, overdraft_applied")
    .in("status", ["active", "closed"])
    .order("year", { ascending: true })
    .order("month", { ascending: true });

  return data ?? [];
}

export async function getBudgetSummaries() {
  const supabase = await createClient();

  // Get all confirmed/closed budgets with their entries
  const { data: budgets } = await supabase
    .from("monthly_budgets")
    .select("id, year, month, status")
    .in("status", ["active", "closed"])
    .order("year", { ascending: true })
    .order("month", { ascending: true });

  if (!budgets || budgets.length === 0) return [];

  const budgetIds = budgets.map((b) => b.id);

  // Fetch all related data in parallel
  const [
    { data: incomeEntries },
    { data: fixedExpenses },
    { data: expenses },
  ] = await Promise.all([
    supabase
      .from("income_entries")
      .select("budget_id, amount")
      .in("budget_id", budgetIds),
    supabase
      .from("fixed_expenses")
      .select("budget_id, amount")
      .in("budget_id", budgetIds),
    supabase
      .from("expenses")
      .select("budget_id, amount, category_id, date, store, spent_by, description")
      .in("budget_id", budgetIds),
  ]);

  return budgets.map((b) => {
    const income = (incomeEntries ?? [])
      .filter((i) => i.budget_id === b.id)
      .reduce((sum, i) => sum + Number(i.amount), 0);
    const fixed = (fixedExpenses ?? [])
      .filter((f) => f.budget_id === b.id)
      .reduce((sum, f) => sum + Number(f.amount), 0);
    const spent = (expenses ?? [])
      .filter((e) => e.budget_id === b.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const budgetExpenses = (expenses ?? []).filter((e) => e.budget_id === b.id);

    // Category breakdown
    const byCategory: Record<string, number> = {};
    budgetExpenses.forEach((e) => {
      byCategory[e.category_id] = (byCategory[e.category_id] || 0) + Number(e.amount);
    });

    return {
      id: b.id,
      year: b.year,
      month: b.month,
      status: b.status,
      income,
      fixed,
      spent,
      remaining: income - fixed - spent,
      expenses: budgetExpenses,
      byCategory,
    };
  });
}

export async function searchExpenses(filters: {
  query?: string;
  categoryId?: string;
  spentBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}) {
  const supabase = await createClient();
  const pageSize = 20;
  const page = filters.page ?? 1;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("expenses")
    .select(
      "id, date, amount, store, description, spent_by, category_id, budget_id, categories(name), profiles!expenses_spent_by_fkey(display_name)",
      { count: "exact" }
    )
    .order("date", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (filters.query) {
    query = query.or(
      `store.ilike.%${filters.query}%,description.ilike.%${filters.query}%`
    );
  }
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters.spentBy) {
    query = query.eq("spent_by", filters.spentBy);
  }
  if (filters.startDate) {
    query = query.gte("date", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("date", filters.endDate);
  }

  const { data, count } = await query;

  return {
    expenses: (data ?? []).map((e: Record<string, unknown>) => ({
      ...e,
      category_name: (e.categories as { name: string } | null)?.name ?? "Unknown",
      spent_by_name: (e.profiles as { display_name: string } | null)?.display_name ?? "Unknown",
    })),
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}
