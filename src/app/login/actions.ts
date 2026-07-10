"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;
  const accountName = formData.get("account_name") as string;

  if (!email || !password || !displayName || !accountName) {
    return { error: "All fields are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  // Create user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (!signUpData.user) {
    return { error: "Registration failed." };
  }

  // Use service role to create account/membership (user may not have active session yet)
  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create account
  const { data: account, error: accountError } = await supabaseAdmin
    .from("accounts")
    .insert({ name: accountName })
    .select("id")
    .single();

  if (accountError) {
    return { error: `Account creation failed: ${accountError.message}` };
  }

  // Add user as owner
  const { error: memberError } = await supabaseAdmin
    .from("account_members")
    .insert({
      account_id: account.id,
      user_id: signUpData.user.id,
      role: "owner",
    });

  if (memberError) {
    return { error: `Membership creation failed: ${memberError.message}` };
  }

  // Seed default categories
  const categoryInserts = DEFAULT_CATEGORIES.map((name, index) => ({
    account_id: account.id,
    name,
    sort_order: index,
    is_active: true,
  }));

  await supabaseAdmin.from("categories").insert(categoryInserts);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
