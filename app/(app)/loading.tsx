import { Heart } from "lucide-react";

export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Yükleniyor">
      <div className="mb-8 space-y-3">
        <div className="h-6 w-32 rounded-full bg-blush" />
        <div className="h-10 w-64 rounded-full bg-blush" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-blush/60">
            <Heart className="size-6 fill-white/70 text-white/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
