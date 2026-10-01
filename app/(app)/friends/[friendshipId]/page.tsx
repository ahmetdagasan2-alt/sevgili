import Link from "next/link";
import { ArrowLeft, Crown, Puzzle } from "lucide-react";
import { ActivityBoard } from "@/components/activities/activity-board";
import { Avatar } from "@/components/friends/avatar";
import { FriendSpaceTabs } from "@/components/friends/friend-space-tabs";
import { parseSpaceTab } from "@/lib/friend-space";
import { NotesPanel } from "@/components/friends/notes-panel";
import { RemoveFriendButton } from "@/components/friends/remove-friend-button";
import { PhotoGallery } from "@/components/gallery/photo-gallery";
import { PhotoUploader } from "@/components/gallery/photo-uploader";
import { listSharedActivities } from "@/lib/activities-server";
import { requireFriendship } from "@/lib/friends";
import { listNotes } from "@/lib/notes";
import { listSharedPhotos } from "@/lib/photos";
import { getHeadToHead } from "@/lib/scores";
import { requireUser } from "@/lib/session";

export default async function FriendSpacePage(props: PageProps<"/friends/[friendshipId]">) {
  const { friendshipId } = await props.params;
  const { tab } = await props.searchParams;
  const user = await requireUser(`/friends/${friendshipId}`);
  const { friend, memberIds, friendship } = await requireFriendship(user.id, friendshipId);

  const [photos, activities, notes] = await Promise.all([
    listSharedPhotos([friendshipId]),
    listSharedActivities(friendshipId),
    listNotes(friendshipId),
  ]);
  const wins = await getHeadToHead(
    photos.map((p) => p.id),
    memberIds,
  );

  const unread = notes.filter((n) => n.authorId !== user.id && !n.readAt).length;
  const initialTab = parseSpaceTab(tab, unread > 0 ? "notlar" : "album");
  const names = { [user.id]: "Sen", [friend.userId]: friend.displayName };

  return (
    <>
      <Link
        href="/friends"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Arkadaşlarım
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={friend.displayName} src={friend.avatarUrl} className="size-16 text-2xl" />
          <div>
            <p className="font-hand text-2xl text-primary">ortak alanımız</p>
            <h1 className="text-3xl font-semibold text-rose-ink sm:text-4xl">Sen & {friend.displayName}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(friendship.accepted_at ?? friendship.created_at).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              tarihinden beri arkadaşsınız
            </p>
          </div>
        </div>
        <RemoveFriendButton friendshipId={friendshipId} name={friend.displayName} />
      </div>

      <FriendSpaceTabs
        initialTab={initialTab}
        badges={{ notlar: unread }}
        panels={{
          album: (
            <div className="flex flex-col gap-8">
              <PhotoUploader friendshipId={friendshipId} />
              {photos.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  Ortak albüm boş. İkiniz de buraya fotoğraf ekleyebilirsiniz 📸
                </p>
              ) : (
                <PhotoGallery photos={photos} editable currentUserId={user.id} uploaderNames={names} />
              )}
            </div>
          ),
          liste: <ActivityBoard activities={activities} friendshipId={friendshipId} />,
          notlar: (
            <NotesPanel
              friendshipId={friendshipId}
              notes={notes}
              currentUserId={user.id}
              friendName={friend.displayName}
              newestUnreadId={notes.findLast((n) => n.authorId !== user.id && !n.readAt)?.id ?? null}
            />
          ),
          puzzle: (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-linear-to-br from-amber-100 to-rose-100 p-5">
                <Crown className="size-6 text-amber-500" />
                <p className="font-heading text-lg font-semibold text-rose-ink">
                  Rekorlar: Sen {wins[user.id]} · {friend.displayName} {wins[friend.userId]}
                </p>
                <p className="w-full text-sm text-rose-ink/70">
                  Ortak albümdeki her fotoğraf ve zorluk için en hızlı olan bir rekor kazanır.
                </p>
              </div>
              {photos.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  Yarışmak için önce ortak albüme fotoğraf ekleyin.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {photos.map((p) => (
                    <Link
                      key={p.id}
                      href={`/games/puzzle/${p.id}?size=3`}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-blush shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.caption ?? ""}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-rose-ink opacity-0 transition-opacity group-hover:opacity-100">
                        <Puzzle className="size-3.5" /> Oyna
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ),
        }}
      />
    </>
  );
}
