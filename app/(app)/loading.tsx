import { Heart } from "lucide-react";

/**
 * Shown while the next page renders on the server. Deliberately not a layout
 * skeleton (it can't match every page); a thin bar under the header plus a
 * small heart, both hidden for the first 150ms so fast navigations stay clean.
 */
export default function Loading() {
  return (
    <div role="status" aria-label="Yükleniyor" className="loader-delayed">
      <div className="fixed inset-x-0 top-16 z-30 h-0.5 overflow-hidden bg-primary/15">
        <div className="loader-bar h-full w-2/5 rounded-full bg-primary" />
      </div>
      <div className="flex min-h-[50vh] items-center justify-center">
        <Heart className="size-8 animate-pulse fill-primary/30 text-primary/40" />
      </div>
    </div>
  );
}
