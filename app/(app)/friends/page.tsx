import Link from "next/link";
import { Camera, ListChecks, MessageCircleHeart, Users } from "lucide-react";
import { Avatar } from "@/components/friends/avatar";
import { AddFriendForm, MyProfileCard, RequestLists } from "@/components/friends/friends-panel";
import { PageHeader } from "@/components/page-header";
import { listFriendships } from "@/lib/friends";
import { getOrCreateProfile } from "@/lib/profiles";
import { requireUser } from "@/lib/session";

export default async function FriendsPage() {
  const user = await requireUser("/friends");
  const [profile, { friends, incoming, outgoing }] = await Promise.all([
    getOrCreateProfile(user),
    listFriendships(user.id),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="sevdiklerimiz"
        title="Arkadaşlarım"
        description="Her arkadaşınla ayrı bir ortak alanınız var: albüm, liste, notlar ve puzzle yarışması."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="flex flex-col gap-4">
          <RequestLists incoming={incoming} outgoing={outgoing} />

          {friends.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-border px-6 py-14 text-center">
              <Users className="size-8 text-primary/70" />
              <p className="text-muted-foreground">
                Henüz arkadaşın yok. Kodunu paylaş ya da bir arkadaşının kodunu yazarak başla.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {friends.map((f) => (
                <Link
                  key={f.friendshipId}
                  href={`/friends/${f.friendshipId}`}
                  className="group relative flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {f.unreadNotes > 0 ? (
                    <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                      <MessageCircleHeart className="size-3.5" /> {f.unreadNotes}
                    </span>
                  ) : null}
                  <div className="flex items-center gap-3">
                    <Avatar name={f.profile.displayName} src={f.profile.avatarUrl} className="size-12" />
                    <div className="min-w-0">
                      <p className="truncate font-heading text-lg font-semibold text-rose-ink">{f.profile.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(f.since).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}{" "}
                        tarihinden beri
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Camera className="size-4" /> {f.sharedPhotos} fotoğraf
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks className="size-4" /> {f.sharedActivities} aktivite
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-5">
          <MyProfileCard name={profile.displayName} code={profile.friendCode} />
          <AddFriendForm />
        </aside>
      </div>
    </>
  );
}
