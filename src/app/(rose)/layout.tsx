import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/platform-shell";

export default async function RoseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_path")
    .eq("id", user.id)
    .single();

  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl
    : null;

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email ?? "",
        displayName: profile?.display_name ?? user.email ?? "",
        avatarUrl,
      }}
    >
      {children}
    </PlatformShell>
  );
}
