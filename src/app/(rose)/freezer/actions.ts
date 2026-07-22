"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserAccountId } from "@/lib/account";

export interface OffResult {
  name: string;
  imageUrl: string | null;
  barcode: string | null;
  quantity: string | null;
}

export async function searchOpenFoodFacts(
  query: string
): Promise<{ results?: OffResult[]; error?: string }> {
  const q = query.trim();
  if (!q) return { results: [] };
  try {
    // ca. subdomain biases results to products sold in Canada; sort by scan
    // popularity for relevance.
    const url =
      `https://ca.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
      `&search_simple=1&action=process&json=1&page_size=20&sort_by=unique_scans_n` +
      `&fields=product_name,brands,image_front_small_url,code,quantity`;
    const res = await fetch(url, {
      headers: { "User-Agent": "RoseHome-Freezer/1.0 (household app)" },
    });
    if (!res.ok) return { error: "Search failed. Try again." };
    const data = await res.json();
    const results: OffResult[] = (data.products ?? [])
      .filter((p: { product_name?: string }) => p.product_name)
      .slice(0, 12)
      .map((p: { product_name: string; brands?: string; image_front_small_url?: string; code?: string; quantity?: string }) => ({
        name: [p.brands?.split(",")[0]?.trim(), p.product_name]
          .filter(Boolean)
          .join(" ")
          .slice(0, 80),
        imageUrl: p.image_front_small_url ?? null,
        barcode: p.code ?? null,
        quantity: p.quantity ?? null,
      }));
    return { results };
  } catch {
    return { error: "Could not reach the product database." };
  }
}

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
