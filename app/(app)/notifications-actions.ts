"use server";

import { listNotifications } from "@/lib/notifications";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function getNotifications() {
  const user = await requireUser();
  return listNotifications(user.id);
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  const { error } = await supabaseAdmin()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) throw new Error(error.message);
}
