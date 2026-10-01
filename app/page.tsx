import Link from "next/link";
import { Camera, CloudSun, Heart, ListChecks, Puzzle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ArchGallery } from "@/components/landing/arch-gallery";
import { FloatingHearts } from "@/components/landing/floating-hearts";
import { auth0 } from "@/lib/auth0";
import { listOurPhotos } from "@/lib/our-photos";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Camera, title: "Anılarımız", text: "Fotoğraflarımızı yükleyip birlikte biriktirdiğimiz bir albüm." },
  { icon: Puzzle, title: "Oyunlarımız", text: "Kendi fotoğraflarımızdan puzzle'lar, ve zamanla daha fazlası." },
  { icon: ListChecks, title: "Planlarımız", text: "Beraber yapmak istediğimiz her şey tek bir listede." },
  { icon: CloudSun, title: "Her sabah", text: "Bulunduğun yerin havası ve sana küçük bir not." },
];

export default async function Home() {
  const [session, photos] = await Promise.all([auth0.getSession(), listOurPhotos()]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <FloatingHearts />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <span className="flex items-center gap-2">
          <Heart className="size-5 fill-primary text-primary" />
          <span className="font-hand text-2xl text-rose-ink">Bizim Sitemiz</span>
        </span>
        {session ? (
          <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">
            Siteye gir →
          </Link>
        ) : (
          <a href="/auth/login?returnTo=/dashboard" className="text-sm font-semibold text-primary hover:underline">
            Giriş yap
          </a>
        )}
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 pb-16 pt-6 lg:grid-cols-[1fr_1.1fr] lg:pt-12">
        <section className="min-w-0 text-center lg:text-left">
          <p className="font-hand text-3xl text-primary">sevgilim için,</p>
          <h1 className="mt-2 text-[2.6rem] font-semibold leading-[1.05] text-rose-ink sm:text-6xl">
            Sadece ikimize ait <em className="font-normal text-primary">küçük bir dünya</em>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground lg:mx-0">
            Anılarımızı sakladığımız, birlikte oyun oynadığımız ve bir sonraki maceramızı planladığımız yer.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            {session ? (
              <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-7 text-base")}>
                <Heart className="fill-current" /> Hadi gidelim
              </Link>
            ) : (
              <>
                <a
                  href="/auth/login?screen_hint=signup&returnTo=/dashboard"
                  className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-7 text-base")}
                >
                  <Heart className="fill-current" /> Kayıt ol
                </a>
                <a
                  href="/auth/login?returnTo=/dashboard"
                  className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 rounded-full px-7 text-base")}
                >
                  Giriş yap
                </a>
              </>
            )}
          </div>
        </section>

        <section className="min-w-0">
          <ArchGallery items={photos.map((src) => ({ src, alt: "Biz" }))} />
        </section>
      </main>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl border border-border/70 bg-card/70 p-5 backdrop-blur-sm">
            <Icon className="size-6 text-primary" />
            <h2 className="mt-3 text-lg font-semibold text-rose-ink">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <footer className="relative z-10 pb-8 text-center font-hand text-xl text-rose-ink/60">
        seni seviyorum ♥
      </footer>
    </div>
  );
}
