import { MEDIA_APP_KEY, supabase } from "./supabase";

export async function validateMediaSession(session) {
  if (!session?.user?.id) {
    return { valid: false, error: "No active session." };
  }

  const { data: ownerAccess, error: ownerAccessError } = await supabase.rpc(
    "ensure_owner_app_access",
    { app_key: MEDIA_APP_KEY },
  );

  if (ownerAccessError) {
    return { valid: false, error: "Could not verify application access." };
  }

  if (ownerAccess) {
    const { error: ownerProfileError } = await supabase.rpc(
      "ensure_media_owner_profile",
    );
    if (ownerProfileError) {
      return { valid: false, error: "Could not prepare the owner profile." };
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("media_profiles")
    .select("id, real_email, auth_email, username, role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      valid: false,
      error: "This account is not registered for Media Manager.",
    };
  }

  if (profile.role === "student") return { valid: true, profile };

  const { data: allowed, error: allowError } = await supabase.rpc(
    "is_app_email_allowed",
    {
      app_key: MEDIA_APP_KEY,
      candidate_email: profile.real_email,
    },
  );

  if (allowError || !allowed) {
    return {
      valid: false,
      error: "Your email is no longer authorized to access Media Manager.",
    };
  }

  return { valid: true, profile };
}
