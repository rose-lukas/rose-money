"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserAccountId } from "@/lib/account";

export async function addCategory(name: string) {
  const supabase = await createClient();
  const accountId = await getUserAccountId();

  // Get the highest sort_order
  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (last?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("categories")
    .insert({ name, sort_order: nextOrder, account_id: accountId });

  if (error) {
    if (error.code === "23505") {
      return { error: "A category with that name already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/money/settings");
}

export async function updateCategory(id: string, name: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "A category with that name already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/money/settings");
}

export async function toggleCategory(id: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/money/settings");
}

export async function reorderCategories(orderedIds: string[]) {
  const supabase = await createClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("categories")
      .update({ sort_order: index })
      .eq("id", id)
  );

  await Promise.all(updates);
  revalidatePath("/money/settings");
}
