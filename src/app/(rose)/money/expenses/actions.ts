"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDateInBudgetMonth, syncNextMonthOverdraft } from "@/lib/budget";
import { getMonthName } from "@/lib/format";

export async function addExpense(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const budgetId = formData.get("budget_id") as string;
  const date = formData.get("date") as string;
  const rawAmount = parseFloat(formData.get("amount") as string);
  const entryType = (formData.get("entry_type") as string) === "return" ? "return" : "expense";
  const amount = entryType === "return" ? -Math.abs(rawAmount) : Math.abs(rawAmount);
  const categoryId = formData.get("category_id") as string;
  const store = (formData.get("store") as string) || null;
  const description = (formData.get("description") as string) || null;
  const spentBy = formData.get("spent_by") as string;

  if (!budgetId || !date || isNaN(amount) || amount === 0 || !categoryId || !spentBy) {
    return { error: "Please fill in all required fields (amount cannot be zero)." };
  }

  // Verify budget is active
  const { data: budget } = await supabase
    .from("monthly_budgets")
    .select("status, year, month")
    .eq("id", budgetId)
    .single();

  if (!budget || budget.status !== "active") {
    return { error: "Budget must be active to add expenses." };
  }

  if (!isDateInBudgetMonth(date, budget.year, budget.month)) {
    return {
      error: `Date must be within ${getMonthName(budget.month)} ${budget.year}.`,
    };
  }

  // Handle receipt upload
  let receiptPath: string | null = null;
  const receiptFile = formData.get("receipt") as File | null;
  if (receiptFile && receiptFile.size > 0) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (receiptFile.size > maxSize) {
      return { error: "Receipt file must be under 5MB." };
    }

    const ext = receiptFile.name.split(".").pop() || "jpg";
    const fileName = `${budgetId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, receiptFile);

    if (uploadError) {
      return { error: `Receipt upload failed: ${uploadError.message}` };
    }

    receiptPath = fileName;
  }

  const { error } = await supabase.from("expenses").insert({
    budget_id: budgetId,
    date,
    amount,
    category_id: categoryId,
    store,
    description,
    spent_by: spentBy,
    receipt_path: receiptPath,
  });

  if (error) {
    return { error: error.message };
  }

  await syncNextMonthOverdraft(supabase, budgetId);

  revalidatePath("/money");
  revalidatePath("/money/expenses");
  revalidatePath("/money/budget/[id]", "page");
  redirect(`/money/expenses?year=${budget.year}&month=${budget.month}`);
}

export async function updateExpense(id: string, formData: FormData) {
  const supabase = await createClient();

  const date = formData.get("date") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const categoryId = formData.get("category_id") as string;
  const store = (formData.get("store") as string) || null;
  const description = (formData.get("description") as string) || null;
  const spentBy = formData.get("spent_by") as string;

  const { error } = await supabase
    .from("expenses")
    .update({
      date,
      amount,
      category_id: categoryId,
      store,
      description,
      spent_by: spentBy,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/money");
  revalidatePath("/money/expenses");
  redirect("/money/expenses");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();

  // Delete receipt from storage if exists
  const { data: expense } = await supabase
    .from("expenses")
    .select("budget_id, receipt_path, monthly_budgets(status)")
    .eq("id", id)
    .single();

  if (!expense) throw new Error("Expense not found");

  const budgetStatus = (expense.monthly_budgets as unknown as { status: string } | null)?.status;
  if (budgetStatus !== "active") {
    throw new Error("Reopen the month to delete expenses.");
  }

  if (expense.receipt_path) {
    await supabase.storage.from("receipts").remove([expense.receipt_path]);
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await syncNextMonthOverdraft(supabase, expense.budget_id);

  revalidatePath("/money");
  revalidatePath("/money/expenses");
  revalidatePath("/money/budget/[id]", "page");
}
