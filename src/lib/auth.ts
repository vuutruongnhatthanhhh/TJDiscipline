import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export function isAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return !!adminEmail && email.trim().toLowerCase() === adminEmail;
}

// Uses getUser() (not getSession()) because it revalidates the token against
// Supabase Auth instead of trusting the locally-decoded cookie.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  return {
    id: user.id,
    email: user.email ?? "",
    name: fullName || user.email || "Bạn",
    isAdmin: isAdminEmail(user.email ?? ""),
  };
}
