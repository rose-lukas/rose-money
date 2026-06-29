import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/settings/category-manager";
import { ProfileManager } from "@/components/settings/profile-manager";
import { ChangePassword } from "@/components/settings/change-password";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: profiles }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, sort_order, is_active")
      .order("sort_order"),
    supabase.from("profiles").select("id, display_name, avatar_path"),
  ]);

  // Build avatar URLs
  const profilesWithAvatars = (profiles ?? []).map((p) => ({
    ...p,
    avatar_url: p.avatar_path
      ? supabase.storage.from("avatars").getPublicUrl(p.avatar_path).data.publicUrl
      : null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage categories and user profiles.
        </p>
      </div>

      <CategoryManager categories={categories ?? []} />
      <ProfileManager profiles={profilesWithAvatars} />
      <ChangePassword />
    </div>
  );
}
