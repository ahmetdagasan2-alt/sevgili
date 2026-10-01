"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { parseCategory, STARTER_IDEAS } from "@/lib/activities";
import { assertFriendship, findFriendship, isUuid, otherMember, type FriendshipRow } from "@/lib/friends";
import { notify } from "@/lib/notifications";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

function refresh(friendshipId?: string | null) {
  revalidatePath("/activities");
  revalidatePath("/dashboard");
  if (friendshipId) {
    revalidatePath(`/friends/${friendshipId}`);
    revalidatePath("/friends");
  }
}

/**
 * Personal activities belong to their creator; shared ones can be edited by
 * both members of the friendship.
 */
async function authorizeActivity(
  userId: string,
  id: string,
): Promise<{ title: string; friendship: FriendshipRow | null }> {
  if (!isUuid(id)) throw new Error("Geçersiz aktivite");
  const { data, error } = await supabaseAdmin()
    .from("activities")
    .select("user_id, friendship_id, title")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Bu aktiviteye erişimin yok");
  if (data.friendship_id) {
    const friendship = await findFriendship(userId, data.friendship_id);
    if (!friendship) throw new Error("Bu aktiviteye erişimin yok");
    return { title: data.title, friendship };
  }
  if (data.user_id !== userId) throw new Error("Bu aktiviteye erişimin yok");
  return { title: data.title, friendship: null };
}

export async function addActivity(
  input: { title: string; description?: string; category: string },
  friendshipId?: string,
) {
  const user = await requireUser();
  const friendship = friendshipId ? await assertFriendship(user.id, friendshipId) : null;
  const title = input.title.trim().slice(0, 120);
  if (!title) throw new Error("Bir başlık yaz");
  const { error } = await supabaseAdmin()
    .from("activities")
    .insert({
      user_id: user.id,
      friendship_id: friendshipId ?? null,
      title,
      description: input.description?.trim().slice(0, 300) || null,
      category: parseCategory(input.category),
    });
  if (error) throw new Error(error.message);
  if (friendship) {
    after(() =>
      notify({
        to: otherMember(friendship, user.id),
        from: user.id,
        type: "shared_activity",
        friendshipId: friendship.id,
        data: { title },
      }),
    );
  }
  refresh(friendshipId);
}

export async function addStarterIdeas(friendshipId?: string) {
  const user = await requireUser();
  if (friendshipId) await assertFriendship(user.id, friendshipId);
  const { error } = await supabaseAdmin()
    .from("activities")
    .insert(STARTER_IDEAS.map((idea) => ({ ...idea, user_id: user.id, friendship_id: friendshipId ?? null })));
  if (error) throw new Error(error.message);
  refresh(friendshipId);
}

export async function setActivityDone(id: string, done: boolean) {
  const user = await requireUser();
  const { title, friendship } = await authorizeActivity(user.id, id);
  const { error } = await supabaseAdmin()
    .from("activities")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (friendship && done) {
    after(() =>
      notify({
        to: otherMember(friendship, user.id),
        from: user.id,
        type: "activity_done",
        friendshipId: friendship.id,
        data: { title },
      }),
    );
  }
  refresh(friendship?.id);
}

export async function deleteActivity(id: string) {
  const user = await requireUser();
  const { friendship } = await authorizeActivity(user.id, id);
  const { error } = await supabaseAdmin().from("activities").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh(friendship?.id);
}
