"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserAccountId } from "@/lib/account";

export async function addFreezerItem(formData: FormData) {
  const supabase = await createClient();
  const accountId = await getUserAccountId();

  const name = ((formData.get("name") as string) || "").trim();
  const emoji = ((formData.get("emoji") as string) || "🧊").trim() || "🧊";
  const amountKind =
    (formData.get("amount_kind") as string) === "count" ? "count" : "fraction";
  const amountNum = parseInt(formData.get("amount_num") as string) || 1;
  const amountDen =
    amountKind === "fraction"
      ? parseInt(formData.get("amount_den") as string) || 1
      : null;
  const barcode = ((formData.get("barcode") as string) || "").trim() || null;
  const weightRaw = ((formData.get("weight_value") as string) || "").trim();
  const weightValue = weightRaw === "" || isNaN(Number(weightRaw)) ? null : Number(weightRaw);
  const weightUnit = weightValue != null ? ((formData.get("weight_unit") as string) || "g").trim() : null;
  let imageUrl = ((formData.get("image_url") as string) || "").trim() || null;

  if (!name) return { error: "Please enter a name." };

  // Optional uploaded photo -> public bucket
  const file = formData.get("image") as File | null;
  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB." };
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${accountId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("freezer-items")
      .upload(path, file);
    if (upErr) return { error: `Image upload failed: ${upErr.message}` };
    imageUrl = supabase.storage.from("freezer-items").getPublicUrl(path).data.publicUrl;
  }

  const { data: last } = await supabase
    .from("freezer_items")
    .select("sort_order")
    .eq("account_id", accountId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (last?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("freezer_items").insert({
    account_id: accountId,
    name,
    emoji,
    image_url: imageUrl,
    amount_kind: amountKind,
    amount_num: amountNum,
    amount_den: amountDen,
    weight_value: weightValue,
    weight_unit: weightUnit,
    barcode,
    sort_order: sortOrder,
  });
  if (error) return { error: error.message };

  revalidatePath("/freezer");
  return { success: true };
}

export async function updateFreezerItem(
  id: string,
  fields: {
    amount: { kind: "fraction" | "count"; num: number; den?: number | null };
    weightValue: number | null;
    weightUnit: string | null;
  }
) {
  const supabase = await createClient();
  const { amount, weightValue, weightUnit } = fields;
  const { error } = await supabase
    .from("freezer_items")
    .update({
      amount_kind: amount.kind,
      amount_num: amount.num,
      amount_den: amount.kind === "fraction" ? amount.den ?? 1 : null,
      weight_value: weightValue,
      weight_unit: weightValue != null ? weightUnit : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/freezer");
  return { success: true };
}

export async function deleteFreezerItem(id: string) {
  const supabase = await createClient();

  // Remove an uploaded image if it lives in our bucket
  const { data: item } = await supabase
    .from("freezer_items")
    .select("image_url")
    .eq("id", id)
    .single();
  if (item?.image_url?.includes("/freezer-items/")) {
    const path = item.image_url.split("/freezer-items/")[1];
    if (path) {
      await supabase.storage
        .from("freezer-items")
        .remove([decodeURIComponent(path)]);
    }
  }

  const { error } = await supabase.from("freezer_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/freezer");
  return { success: true };
}

export async function reorderFreezerItems(idsInOrder: string[]) {
  const supabase = await createClient();
  const accountId = await getUserAccountId();

  if (!Array.isArray(idsInOrder) || idsInOrder.length === 0) {
    return { error: "No items to reorder." };
  }

  const updates = idsInOrder.map((id, index) =>
    supabase
      .from("freezer_items")
      .update({ sort_order: index + 1 })
      .eq("id", id)
      .eq("account_id", accountId)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/freezer");
  return { success: true };
}
