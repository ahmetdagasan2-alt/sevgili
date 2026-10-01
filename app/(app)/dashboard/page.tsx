import Link from "next/link";
import { ArrowRight, Camera, Gamepad2, ListChecks, MessageCircleHeart, Quote, UserPlus } from "lucide-react";
import { WeatherCard } from "@/components/weather/weather-card";
import { listActivities } from "@/lib/activities-server";
import { QUOTE_CATEGORIES, quoteOfTheDay } from "@/lib/daily-quotes";
import { listFriendships } from "@/lib/friends";
import { listUnreadNotes } from "@/lib/notes";
import { listPhotos } from "@/lib/photos";
import { getProfile } from "@/lib/profiles";
import { countSolved } from "@/lib/scores";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const [photos, activities, solved, profile, { friends, incoming }] = await Promise.all([
    listPhotos(user.id, 6),
    listActivities(user.id),
    countSolved(user.id),
    getProfile(user.id),
    listFriendships(user.id),
  ]);
  // Only fetch note bodies when there is something unread.
  const withUnread = friends.filter((f) => f.unreadNotes > 0);
  const unreadNotes = withUnread.length
    ? await listUnreadNotes(
        user.id,
        withUnread.map((f) => f.friendshipId),
      )
    : [];
  const friendByFriendship = new Map(friends.map((f) => [f.friendshipId, f.profile]));
  const quote = quoteOfTheDay();
  const nextActivity = activities.find((a) => !a.done);
  const doneCount = activities.filter((a) => a.done).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-hand text-3xl text-primary">hoş geldin,</p>
        <h1 className="text-4xl font-semibold text-rose-ink sm:text-5xl">{profile?.displayName ?? user.name} 💕</h1>
      </div>

      {incoming.length > 0 ? (
        <Link
          href="/friends"
          className="flex items-center gap-3 rounded-3xl border border-primary/30 bg-card p-4 transition-colors hover:bg-accent"
        >
          <UserPlus className="size-5 text-primary" />
          <p className="flex-1 font-medium">
            {incoming.length === 1
              ? `${incoming[0].profile.displayName} seninle arkadaş olmak istiyor`
              : `${incoming.length} arkadaşlık isteğin var`}
          </p>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      ) : null}

      {unreadNotes.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-rose-ink">
            <MessageCircleHeart className="size-5 text-primary" /> Sana bırakılan notlar
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unreadNotes.map((n) => {
              const from = friendByFriendship.get(n.friendshipId);
              return (
                <Link
                  key={n.id}
                  href={`/friends/${n.friendshipId}?tab=notlar`}
                  className="flex flex-col gap-2 rounded-3xl rounded-bl-md bg-card p-4 shadow-xs transition-shadow hover:shadow-md"
                >
                  <p className="line-clamp-3 font-hand text-2xl leading-snug text-rose-ink">{n.body}</p>
                  <p className="text-xs text-muted-foreground">— {from?.displayName ?? "Arkadaşın"}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <WeatherCard />

        <div className="flex flex-col gap-6">
          <figure className="relative flex flex-col justify-center rounded-3xl border border-border bg-card p-6">
            <Quote className="absolute right-5 top-5 size-10 text-primary/15" />
            <figcaption className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              Günün sözü
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {QUOTE_CATEGORIES[quote.category].emoji} {QUOTE_CATEGORIES[quote.category].label}
              </span>
            </figcaption>
            <blockquote className="mt-3 pr-8 font-hand text-3xl leading-snug text-rose-ink">{quote.text}</blockquote>
          </figure>

          <div className="grid grid-cols-3 gap-3">
            <StatTile href="/photos" icon={Camera} value={photos.length >= 6 ? "6+" : String(photos.length)} label="fotoğraf" />
            <StatTile href="/games" icon={Gamepad2} value={String(solved)} label="puzzle" />
            <StatTile href="/activities" icon={ListChecks} value={String(doneCount)} label="anı" />
          </div>

          {nextActivity ? (
            <Link
              href="/activities"
              className="group flex items-center justify-between gap-4 rounded-3xl bg-linear-to-br from-rose-200 to-orange-100 p-5"
            >
              <div>
                <p className="text-sm font-medium text-rose-ink/70">Sıradaki planımız</p>
                <p className="font-heading text-xl font-semibold text-rose-ink">{nextActivity.title}</p>
              </div>
              <ArrowRight className="size-5 text-rose-ink transition-transform group-hover:translate-x-1" />
            </Link>
          ) : null}
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-rose-ink">Son anılarımız</h2>
          <Link href="/photos" className="text-sm font-semibold text-primary hover:underline">
            Tümü
          </Link>
        </div>
        {photos.length === 0 ? (
          <Link
            href="/photos"
            className="flex items-center justify-center rounded-3xl border-2 border-dashed border-border py-12 text-muted-foreground hover:border-primary/40"
          >
            İlk fotoğrafımızı ekleyelim 📸
          </Link>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {photos.map((p, i) => (
              <Link
                key={p.id}
                href="/photos"
                className="aspect-square overflow-hidden rounded-2xl bg-blush shadow-sm"
                style={{ rotate: `${(i % 2 ? 1 : -1) * 1.5}deg` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption ?? ""} className="size-full object-cover transition-transform duration-500 hover:scale-110" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({
  href,
  icon: Icon,
  value,
  label,
}: {
  href: string;
  icon: typeof Camera;
  value: string;
  label: string;
}) {
  return (
    <Link href={href} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent">
      <Icon className="size-4 text-primary" />
      <p className="mt-2 font-heading text-2xl font-semibold text-rose-ink">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Link>
  );
}
