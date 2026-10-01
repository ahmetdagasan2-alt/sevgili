"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Puzzle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePhoto } from "@/app/(app)/photos/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Photo } from "@/lib/photos";
import { formatDate } from "@/lib/format";
import { MasonryLightbox } from "./masonry-lightbox";

type Props = {
  photos: Photo[];
  editable?: boolean;
  /** Needed in shared albums: only the uploader may delete. */
  currentUserId?: string;
  /** userId → display name, to show who added each photo in shared albums. */
  uploaderNames?: Record<string, string>;
};

export function PhotoGallery({ photos, editable = false, currentUserId, uploaderNames }: Props) {
  const [pending, startTransition] = useTransition();
  const uploaderOf = new Map(photos.map((p) => [p.id, p.userId]));

  const images = photos.map((p) => {
    const by = uploaderNames ? (p.userId === currentUserId ? "Sen" : uploaderNames[p.userId]) : null;
    return {
      id: p.id,
      src: p.url,
      alt: p.caption || "Bizden bir an",
      description: by ? `${by} ekledi · ${formatDate(p.createdAt)}` : formatDate(p.createdAt),
      width: p.width ?? undefined,
      height: p.height ?? undefined,
    };
  });

  return (
    <MasonryLightbox
      images={images}
      renderActions={
        editable
          ? (image, close) => (
              <>
                <Link
                  href={`/games/puzzle/${image.id}?size=3`}
                  className={buttonVariants({ size: "lg", className: "rounded-full px-4" })}
                >
                  <Puzzle /> Bununla puzzle yap
                </Link>
                {!currentUserId || uploaderOf.get(image.id) === currentUserId ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="rounded-full px-4"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm("Bu fotoğrafı silmek istediğine emin misin?")) return;
                      startTransition(async () => {
                        try {
                          // The action revalidates the page, which drops the photo from the grid.
                          await deletePhoto(image.id);
                          close();
                          toast.success("Fotoğraf silindi");
                        } catch {
                          toast.error("Silinemedi, tekrar dene");
                        }
                      });
                    }}
                  >
                    <Trash2 /> Sil
                  </Button>
                ) : null}
              </>
            )
          : undefined
      }
    />
  );
}
