import { cn } from "@/lib/utils";

/** Profile picture, or the first letter on a soft gradient when there is none. */
export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn("size-10 shrink-0 rounded-full object-cover", className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-rose-200 to-orange-100 font-heading font-semibold text-rose-ink",
        className,
      )}
    >
      {name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?"}
    </span>
  );
}
