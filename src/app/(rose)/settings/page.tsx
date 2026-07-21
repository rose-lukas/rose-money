import { createClient } from "@/lib/supabase/server";
import { ProfileManager } from "@/components/settings/profile-manager";
import { ChangePassword } from "@/components/settings/change-password";
import { FontSelector } from "@/components/settings/font-selector";
import { MemberManager } from "@/components/settings/member-manager";
import { getUserAccountId } from "@/lib/account";
import { getAccountMembers } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ensure the user has an account (lazily provisions one if missing)
  // before running account-scoped queries.
  await getUserAccountId();

  const [{ data: profiles }, members] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_path"),
    getAccountMembers(),
  ]);

  // Determine if current user is owner
  const isOwner = members.some(
    (m: any) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return profile?.id === user?.id && m.role === "owner";
    }
  );

  // Build avatar URLs
  const profilesWithAvatars = (profiles ?? []).map((p) => ({
    ...p,
    avatar_url: p.avatar_path
      ? supabase.storage.from("avatars").getPublicUrl(p.avatar_path).data.publicUrl
      : null,
  }));

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your household, profile, and appearance.
          </p>
        </div>

        <MemberManager members={members as any} isOwner={isOwner} />
        <ProfileManager profiles={profilesWithAvatars} />
        <FontSelector />
        <ChangePassword />
      </div>
    </div>
  );
}
