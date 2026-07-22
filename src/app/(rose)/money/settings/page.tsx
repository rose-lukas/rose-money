import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/settings/category-manager";
import { getUserAccountId } from "@/lib/account";

export default async function MoneySettingsPage() {
  const supabase = await createClient();

  // Ensure the user has an account before running account-scoped queries.
  await getUserAccountId();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, sort_order, is_active")
    .order("sort_order");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Money Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your expense categories.
        </p>
      </div>

      <CategoryManager categories={categories ?? []} />
    </div>
  );
}
