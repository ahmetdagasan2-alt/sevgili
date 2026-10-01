"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { findFriendship, otherMember } from "@/lib/friends";
import { notify } from "@/lib/notifications";
import { getPhoto } from "@/lib/photos";
import { parseGridSize } from "@/lib/puzzle";
import { getBestScoresFor, type BestScore } from "@/lib/scores";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";

/** Faster time wins; fewer moves breaks a tie. */
function beats(a: { seconds: number; moves: number }, b: BestScore) {
  return !b || a.seconds < b.seconds || (a.seconds === b.seconds && a.moves < b.moves);
}

export async function saveScore(input: {
  photoId: string;
  gridSize: number;
  moves: number;
  seconds: number;
}) {
  const user = await requireUser();
  const db = supabaseAdmin();

  // Only photos the user may see: their own, or ones in a shared album they belong to.
  const photo = await getPhoto(user.id, input.photoId);
  if (!photo) throw new Error("Fotoğraf bulunamadı");

  const score = {
    grid_size: parseGridSize(input.gridSize),
    moves: Math.max(0, Math.floor(input.moves)),
    seconds: Math.max(0, Math.floor(input.seconds)),
  };

  // In a shared album, find out whether this score takes the lead from the friend.
  const friendship = photo.friendshipId ? await findFriendship(user.id, photo.friendshipId) : null;
  const friendId = friendship ? otherMember(friendship, user.id) : null;
  let tookTheLead = false;
  if (friendId) {
    const bests = await getBestScoresFor(photo.id, [user.id, friendId]);
    const mine = bests[user.id][score.grid_size] ?? null;
    const theirs = bests[friendId][score.grid_size] ?? null;
    const wasLeading = mine !== null && beats(mine, theirs);
    tookTheLead = theirs !== null && !wasLeading && beats(score, theirs);
  }

  const { error } = await db.from("puzzle_scores").insert({ user_id: user.id, photo_id: input.photoId, ...score });
  if (error) throw new Error(error.message);

  if (tookTheLead && friendId && friendship) {
    after(() =>
      notify({
        to: friendId,
        from: user.id,
        type: "puzzle_record",
        friendshipId: friendship.id,
        data: { photoId: photo.id, seconds: score.seconds },
      }),
    );
  }
  revalidatePath(`/games/puzzle/${input.photoId}`);
  if (photo.friendshipId) revalidatePath(`/friends/${photo.friendshipId}`);
}
