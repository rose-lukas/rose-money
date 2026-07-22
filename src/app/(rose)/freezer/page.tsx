import { createClient } from "@/lib/supabase/server";
import { FreezerScene } from "@/components/freezer/freezer-scene";
import { getUserAccountId } from "@/lib/account";
import type { FreezerItem } from "@/components/freezer/types";

export default async function FreezerPage() {
  const supabase = await createClient();

  // Ensure the user has an account (provisions if needed) before scoped query.
  await getUserAccountId();

  const { data } = await supabase
    .from("freezer_items")
    .select(
      "id, name, emoji, image_url, amount_kind, amount_num, amount_den, barcode, notes"
    )
    .order("sort_order")
    .order("created_at");

  const items: FreezerItem[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    imageUrl: r.image_url,
    barcode: r.barcode,
    notes: r.notes,
    amount:
      r.amount_kind === "count"
        ? { kind: "count", num: r.amount_num }
        : { kind: "fraction", num: r.amount_num, den: r.amount_den ?? 1 },
  }));

  return <FreezerScene items={items} />;
}
