"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addCategory(name: string) {
  const supabase = await createClient();

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
    .insert({ name, sort_order: nextOrder });

  if (error) {
    if (error.code === "23505") {
      return { error: "A category with that name already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/settings");
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

  revalidatePath("/settings");
}

export async function toggleCategory(id: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
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
  revalidatePath("/settings");
}

export async function updateProfile(id: string, displayName: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function uploadAvatar(id: string, formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("avatar") as File;
  if (!file || file.size === 0) return { error: "No file provided." };

  if (file.size > 2 * 1024 * 1024) {
    return { error: "Avatar must be under 2MB." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${id}.${ext}`;

  // Remove old avatar if exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", id)
    .single();

  if (profile?.avatar_path) {
    await supabase.storage.from("avatars").remove([profile.avatar_path]);
  }

  // Upload new avatar
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: fileName })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout");

  return { url: urlData.publicUrl };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient();

  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters." };
  }

  // Verify current password by re-authenticating
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Unable to verify user." };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) return { error: "Current password is incorrect." };

  // Update password
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { success: true };
}
