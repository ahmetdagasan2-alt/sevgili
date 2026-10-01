"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { assertFriendship, isUuid, otherMember } from "@/lib/friends";
import { notify } from "@/lib/notifications";
import { requireUser } from "@/lib/session";
import { PHOTO_BUCKET, storageFolder, supabaseAdmin } from "@/lib/supabase/server";

const EXT_BY_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const MAX_BATCH = 20;

/** Step 1: one-time URLs for uploading straight into the user's own folder. */
export async function createUploadUrls(contentTypes: string[]) {
  const user = await requireUser();
  if (contentTypes.length === 0 || contentTypes.length > MAX_BATCH) {
    throw new Error(`Tek seferde en fazla ${MAX_BATCH} fotoğraf yükleyebilirsin`);
  }
  const folder = storageFolder(user.id);
  const bucket = supabaseAdmin().storage.from(PHOTO_BUCKET);

  return Promise.all(
    contentTypes.map(async (type) => {
      const ext = EXT_BY_TYPE[type];
      if (!ext) throw new Error("Sadece JPG, PNG veya WEBP yükleyebilirsin");
      const { data, error } = await bucket.createSignedUploadUrl(`${folder}/${randomUUID()}.${ext}`);
      if (error) throw new Error(error.message);
      return { path: data.path, token: data.token };
    }),
  );
}

type UploadedPhoto = { path: string; caption?: string; width: number; height: number };

/**
 * Step 2: record every upload that succeeded, then refresh the pages once.
 * With a friendshipId the photos go into that friendship's shared album.
 */
export async function savePhotos(items: UploadedPhoto[], friendshipId?: string) {
  const user = await requireUser();
  if (items.length === 0) return;
  if (items.length > MAX_BATCH) throw new Error("Çok fazla fotoğraf");
  const friendship = friendshipId ? await assertFriendship(user.id, friendshipId) : null;

  const folder = storageFolder(user.id);
  for (const item of items) {
    if (!item.path.startsWith(`${folder}/`) || item.path.includes("..")) {
      throw new Error("Geçersiz dosya yolu");
    }
  }

  const db = supabaseAdmin();
  // Make sure each object really exists before writing its row. The files were
  // just uploaded, so they're among the newest in the folder: one list call covers them.
  const { data: recent, error: listError } = await db.storage.from(PHOTO_BUCKET).list(folder, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (listError) throw new Error(listError.message);
  const existing = new Set(recent.map((f) => `${folder}/${f.name}`));
  if (items.some((item) => !existing.has(item.path))) throw new Error("Yüklenen dosya bulunamadı");

  const { error } = await db.from("photos").insert(
    items.map((item) => ({
      user_id: user.id,
      friendship_id: friendshipId ?? null,
      storage_path: item.path,
      caption: item.caption?.trim().slice(0, 140) || null,
      width: Math.round(item.width) || null,
      height: Math.round(item.height) || null,
    })),
  );
  if (error) throw new Error(error.message);

  if (friendship) {
    after(() =>
      notify({
        to: otherMember(friendship, user.id),
        from: user.id,
        type: "shared_photo",
        friendshipId: friendship.id,
        data: { count: items.length },
      }),
    );
  }
  revalidatePhotoPages(friendshipId);
}

function revalidatePhotoPages(friendshipId?: string | null) {
  revalidatePath("/photos");
  revalidatePath("/dashboard");
  revalidatePath("/games/puzzle");
  if (friendshipId) {
    revalidatePath(`/friends/${friendshipId}`);
    revalidatePath("/friends");
  }
}

/** Only the uploader can delete a photo, shared or not. */
export async function deletePhoto(photoId: string) {
  const user = await requireUser();
  if (!isUuid(photoId)) throw new Error("Geçersiz fotoğraf");
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("photos")
    .delete()
    .eq("user_id", user.id)
    .eq("id", photoId)
    .select("storage_path, friendship_id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Bu fotoğrafı sadece yükleyen silebilir");
  await db.storage.from(PHOTO_BUCKET).remove([data.storage_path]);
  revalidatePhotoPages(data.friendship_id);
}
