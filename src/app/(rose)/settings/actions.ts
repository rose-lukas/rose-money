"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserAccountId } from "@/lib/account";

export async function addCategory(name: string) {
  const supabase = await createClient();
  const accountId = await getUserAccountId();

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
    .insert({ name, sort_order: nextOrder, account_id: accountId });

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

export async function addMemberToAccount(email: string) {
  const supabase = await createClient();
  const accountId = await getUserAccountId();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check that current user is owner
  const { data: membership } = await supabase
    .from("account_members")
    .select("role")
    .eq("account_id", accountId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return { error: "Only the account owner can add members." };
  }

  // Use service role key to look up user by email
  const supabaseAdmin = createAdminClient();

  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) return { error: "Could not look up users." };

  const targetUser = listData?.users?.find((u) => u.email === email);
  if (!targetUser) {
    return { error: "No registered user found with that email. They must register first." };
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("account_members")
    .select("id")
    .eq("account_id", accountId)
    .eq("user_id", targetUser.id)
    .single();

  if (existingMember) {
    return { error: "This user is already a member of your account." };
  }

  // Add as member using admin client to bypass RLS
  const { error: addError } = await supabaseAdmin
    .from("account_members")
    .insert({
      account_id: accountId,
      user_id: targetUser.id,
      role: "member",
      invited_by: user.id,
    });

  if (addError) return { error: addError.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function getAccountMembers() {
  const supabase = await createClient();
  const accountId = await getUserAccountId();

  const { data } = await supabase
    .from("account_members")
    .select(`
      id, role, joined_at,
      profiles:user_id(id, display_name)
    `)
    .eq("account_id", accountId)
    .order("joined_at");

  return data ?? [];
}

export async function removeMember(memberId: string) {
  const supabase = await createClient();
  const accountId = await getUserAccountId();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check that current user is owner
  const { data: membership } = await supabase
    .from("account_members")
    .select("role")
    .eq("account_id", accountId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return { error: "Only the account owner can remove members." };
  }

  // Don't allow removing yourself
  const { data: targetMember } = await supabase
    .from("account_members")
    .select("user_id")
    .eq("id", memberId)
    .single();

  if (targetMember?.user_id === user.id) {
    return { error: "You cannot remove yourself from the account." };
  }

  const { error } = await supabase
    .from("account_members")
    .delete()
    .eq("id", memberId)
    .eq("account_id", accountId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
