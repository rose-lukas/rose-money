import { createClient } from "@/lib/supabase/server";

/**
 * Get the current user's account ID.
 * Throws if not authenticated or not a member of any account.
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
    .single();

  if (!membership) throw new Error("No account found");

  return membership.account_id;
}
