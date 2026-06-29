"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addExpense(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const budgetId = formData.get("budget_id") as string;
  const date = formData.get("date") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const categoryId = formData.get("category_id") as string;
  const store = (formData.get("store") as string) || null;
  const description = (formData.get("description") as string) || null;
  const spentBy = formData.get("spent_by") as string;

  if (!budgetId || !date || isNaN(amount) || !categoryId || !spentBy) {
    return { error: "Please fill in all required fields." };
  }

  // Verify budget is active
  const { data: budget } = await supabase
    .from("monthly_budgets")
    .select("status")
    .eq("id", budgetId)
    .single();

  if (!budget || budget.status !== "active") {
    return { error: "Budget must be active to add expenses." };
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

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  redirect("/dashboard");
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

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();

  // Delete receipt from storage if exists
  const { data: expense } = await supabase
    .from("expenses")
    .select("receipt_path")
    .eq("id", id)
    .single();

  if (expense?.receipt_path) {
    await supabase.storage.from("receipts").remove([expense.receipt_path]);
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}
