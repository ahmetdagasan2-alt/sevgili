import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { GAMES } from "@/lib/games";
import { cn } from "@/lib/utils";

export default function GamesPage() {
  return (
    <>
      <PageHeader
        eyebrow="hadi oynayalım"
        title="Oyunlarımız"
        description="Birlikte oynayabileceğimiz küçük oyunlar. Zamanla yenileri eklenecek."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => {
          const Icon = game.icon;
          return (
            <Link
              key={game.slug}
              href={game.href}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={cn("flex h-36 items-center justify-center bg-linear-to-br", game.accent)}>
                <Icon className="size-14 text-rose-ink/80 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h2 className="text-xl font-semibold text-rose-ink">{game.title}</h2>
                <p className="flex-1 text-sm text-muted-foreground">{game.description}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Oyna <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
        <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          <Sparkles className="size-8 text-primary/60" />
          <p className="font-hand text-2xl text-rose-ink/70">yakında yeni oyunlar…</p>
        </div>
      </div>
    </>
  );
}
