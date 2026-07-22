import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

/**
 * Get the current user's account ID.
 * If the user has no account yet (e.g. created directly in Supabase before
 * registration is finalized), lazily provision one so the app is usable.
 * Throws only if not authenticated.
 */
export async function getUserAccountId(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("account_members")
    .select("account_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membership) return membership.account_id;

  // No account — provision one for this user as owner (service role bypasses RLS).
  const admin = createAdminClient();

  const { data: account, error: accountError } = await admin
    .from("accounts")
    .insert({ name: "My Household" })
    .select("id")
    .single();

  if (accountError || !account) {
    throw new Error(
      `Failed to provision account: ${accountError?.message ?? "unknown error"}`
    );
  }

  const { error: memberError } = await admin
    .from("account_members")
    .insert({ account_id: account.id, user_id: user.id, role: "owner" });

  if (memberError) {
    throw new Error(`Failed to provision membership: ${memberError.message}`);
  }

  // Seed default categories for the new account.
  await admin.from("categories").insert(
    DEFAULT_CATEGORIES.map((name, index) => ({
      account_id: account.id,
      name,
      sort_order: index,
      is_active: true,
    }))
  );

  return account.id;
}
